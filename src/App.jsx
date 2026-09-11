import { AnimatePresence, MotionConfig, motion } from 'framer-motion'
import { Bookmark, ChevronRight, Copy, Download, Dices, FlaskConical, GitCompareArrows, History, KeyRound, Moon, MoreHorizontal, RotateCw, Search, Sparkles, Sun, User, X } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { createCustomMashups, createSignalIdeas, domains, filters, mashups, vaultFolders } from './data/mashups'
import { useLocalStorage } from './hooks/useLocalStorage'
import { useAuth } from './hooks/useAuth'
import { useLearning } from './hooks/useLearning'
import { ApiModal } from './components/ApiModal'
import { AccountMenu } from './components/AccountMenu'
import { AuthModal } from './components/AuthModal'
import { BlueprintModal } from './components/BlueprintModal'
import { DomainSlot } from './components/DomainSlot'
import { IdeaCard } from './components/IdeaCard'
import { AdvancedControls } from './components/AdvancedControls'
import { IdeaDetailModal } from './components/IdeaDetailModal'
import { ConsentBanner } from './components/ConsentBanner'
import { PaywallModal } from './components/PaywallModal'
import { SignalScan } from './components/SignalScan'
import { StatusToast } from './components/StatusToast'
import { clearAnonymousAnalyticsId, sendAnalyticsEvent } from './lib/analytics'
import { EASE_SMOOTH, ENTER, FADE, SPIN_MS, SPIN_SWAP_MS, SPRING_DRAWER } from './lib/motion'

const ALL_IDEAS = 'All ideas'
const DEFAULT_FOLDER = 'Unsorted'

const clamp = (value, min = 0, max = 100) => Math.min(max, Math.max(min, Math.round(value)))

// Anchors the link in the document and defers revocation, otherwise Firefox
// cancels the download and the object URL leaks on other engines.
const downloadBlob = (filename, content, type) => {
  const url = URL.createObjectURL(new Blob([content], { type }))
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.rel = 'noopener'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  setTimeout(() => URL.revokeObjectURL(url), 0)
}

const copyToClipboard = async (text) => {
  try {
    if (!navigator.clipboard?.writeText) return false
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    return false
  }
}

const slugify = (value) => value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'idea'

function App() {
  const [domainA, setDomainA] = useState('Cybersecurity')
  const [domainB, setDomainB] = useState('Cooking')
  const [domainC, setDomainC] = useState('')
  const [activeFilter, setActiveFilter] = useState('All')
  const [ideas, setIdeas] = useState(mashups)
  const [saved, setSaved] = useLocalStorage('idea-lab-saved', [])
  const [dark, setDark] = useLocalStorage('idea-lab-dark', true)
  const [spinning, setSpinning] = useState(false)
  // Monotonic revolution counter. Animating `rotate` to an ever-increasing
  // multiple of 360 keeps the icon turning forwards with an ease-out settle;
  // toggling a CSS `animate-spin` class off used to snap it back to 0deg
  // from whatever mid-rotation angle it happened to be at.
  const [revolutions, setRevolutions] = useState(0)
  const [vaultOpen, setVaultOpen] = useState(false)
  const [apiOpen, setApiOpen] = useState(false)
  const [copied, setCopied] = useState(null)
  const [copyFailed, setCopyFailed] = useState(null)
  const [query, setQuery] = useState('')
  const [advanced, setAdvanced] = useState(false)
  const [settings, setSettings] = useState({ format: 'Any format', difficulty: 'Any difficulty', buildTime: 'Any timeline', audience: '', constraints: '', practicality: 60 })
  const [history, setHistory] = useLocalStorage('idea-lab-history', [])
  const [vaultFolder, setVaultFolder] = useLocalStorage('idea-lab-vault-folder', ALL_IDEAS)
  const [detailIdea, setDetailIdea] = useState(null)
  const [compareIds, setCompareIds] = useState([])
  const [historyOpen, setHistoryOpen] = useState(false)
  const [presentation, setPresentation] = useState(null)
  const [consent, setConsent] = useLocalStorage('idea-lab-analytics-consent', null)
  const { profile, learn, rankIdeas, hasPreferences, resetLearning } = useLearning()
  const outputRef = useRef(null)
  const spinTimers = useRef([])

  // --- Accounts, trials, billing -------------------------------------------
  const auth = useAuth()
  const authRef = useRef(auth)
  useEffect(() => { authRef.current = auth }, [auth])
  const [authOpen, setAuthOpen] = useState(false)
  const [authReason, setAuthReason] = useState(null)
  const [paywallOpen, setPaywallOpen] = useState(false)
  const [paywallReason, setPaywallReason] = useState('scan')
  const [blueprintIdea, setBlueprintIdea] = useState(null)
  const [toast, setToast] = useState(null)
  const toastTimer = useRef(null)

  const notify = (message, type = 'info') => {
    clearTimeout(toastTimer.current)
    setToast({ id: Date.now(), message, type })
    toastTimer.current = setTimeout(() => setToast(null), 5000)
  }

  const openAuth = (reason) => {
    setAuthReason(reason)
    setAuthOpen(true)
  }

  const openPaywall = (reason) => {
    setPaywallReason(reason)
    setPaywallOpen(true)
  }

  // Auto-close the sign-in modal as soon as a session lands (magic link or
  // token redirect) and confirm the trial state in a toast.
  useEffect(() => {
    if (auth.session && authOpen) {
      setAuthOpen(false)
      setAuthReason(null)
      notify(auth.isPro ? 'Signed in — Pro is active.' : 'Signed in. Free trial: 5 signal scans + 3 AI blueprints.', 'success')
    }
  }, [auth.session, auth.isPro, authOpen])

  // Stripe redirects back with ?checkout=success|cancelled. The webhook that
  // flips the profile to 'pro' can land seconds after the redirect, so poll
  // briefly instead of trusting the redirect alone.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const checkout = params.get('checkout')
    if (!checkout) return
    window.history.replaceState({}, '', `${window.location.pathname}${window.location.hash}`)
    if (checkout === 'cancelled') {
      notify('Checkout cancelled — nothing was charged.', 'info')
      return
    }
    notify('Activating your Pro plan…', 'info')
    let attempts = 0
    const poll = async () => {
      attempts += 1
      try {
        const refreshed = await authRef.current.refreshProfile()
        if (refreshed?.plan === 'pro' && ['active', 'trialing'].includes(refreshed.subscription_status)) {
          notify('Pro is live — unlimited scans and blueprints.', 'success')
          return
        }
      } catch {
        // Keep polling; the webhook may still be in flight.
      }
      if (attempts < 15) setTimeout(poll, 2000)
      else notify('Your subscription is still processing — it will unlock automatically in a moment.', 'info')
    }
    const timer = setTimeout(poll, 2500)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => () => {
    clearTimeout(toastTimer.current)
    spinTimers.current.forEach(clearTimeout)
  }, [])

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark)
  }, [dark])

  // Single Escape handler, ordered by stacking context so the topmost layer closes first.
  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key !== 'Escape') return
      if (presentation) return setPresentation(null)
      if (apiOpen) return setApiOpen(false)
      if (authOpen) return setAuthOpen(false)
      if (paywallOpen) return setPaywallOpen(false)
      if (blueprintIdea) return setBlueprintIdea(null)
      if (detailIdea) return setDetailIdea(null)
      if (vaultOpen) return setVaultOpen(false)
      if (historyOpen) return setHistoryOpen(false)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [presentation, apiOpen, authOpen, paywallOpen, blueprintIdea, detailIdea, vaultOpen, historyOpen])

  const visibleIdeas = useMemo(
    () => rankIdeas(ideas.filter((idea) => (activeFilter === 'All' || idea.type === activeFilter) && `${idea.title} ${idea.domainA} ${idea.domainB} ${idea.domainC || ''} ${idea.tagline}`.toLowerCase().includes(query.toLowerCase()))),
    [activeFilter, ideas, query, rankIdeas]
  )

  // Preserves click order so the two compare columns don't swap unexpectedly.
  const compareIdeas = compareIds.map((id) => ideas.find((idea) => idea.id === id)).filter(Boolean)
  const savedInFolder = vaultFolder === ALL_IDEAS ? saved : saved.filter((item) => (item.folder || DEFAULT_FOLDER) === vaultFolder)

  const saveIdea = (idea) => {
    const alreadySaved = saved.some((item) => item.id === idea.id)
    setSaved((items) => (alreadySaved ? items.filter((item) => item.id !== idea.id) : [{ ...idea, folder: idea.folder || DEFAULT_FOLDER }, ...items]))
    // Removing a bookmark must undo the preference it created, not reinforce it.
    learn(alreadySaved ? 'unsave' : 'save', idea, alreadySaved ? -1 : 1)
  }

  const moveIdeaToFolder = (id, folder) => setSaved((items) => items.map((item) => (item.id === id ? { ...item, folder } : item)))

  const copyPrompt = async (idea) => {
    if (!(await copyToClipboard(idea.prompt))) {
      setCopyFailed(idea.id)
      setTimeout(() => setCopyFailed(null), 1800)
      return
    }
    learn('copy', idea)
    setCopied(idea.id)
    setTimeout(() => setCopied(null), 1400)
  }

  const spin = () => {
    // Re-entrant clicks used to stack timeouts and restart the keyframes from
    // frame zero, which is what made rapid spinning look like it was stuttering.
    if (spinning) return
    setSpinning(true)
    setRevolutions((count) => count + 1)
    // Draw without replacement so A, B and C can never land on the same domain.
    const preferred = domains.filter((item) => item !== domainA && item !== domainB)
    const pool = preferred.length >= 3 ? [...preferred] : [...domains]
    const draw = () => pool.splice(Math.floor(Math.random() * pool.length), 1)[0]
    const pickA = draw()
    const pickB = draw()
    const pickC = Math.random() > 0.65 ? draw() : ''

    // Swap the values at the dimmest keyframe, then end the spin exactly when the
    // slot keyframes end. Previously the 500ms timeout did both at once against a
    // 520ms animation, so the new domain appeared as a hard cut 20ms early.
    const swapTimer = setTimeout(() => {
      setDomainA(pickA)
      setDomainB(pickB)
      setDomainC(pickC)
    }, SPIN_SWAP_MS)
    const settleTimer = setTimeout(() => setSpinning(false), SPIN_MS)
    spinTimers.current.push(swapTimer, settleTimer)
  }

  const generate = () => {
    const practicality = Number(settings.practicality)
    const bias = (practicality - 50) / 50
    const newIdeas = createCustomMashups(domainA || 'Unknown', domainB || 'Unknown', domainC)
    const constrained = newIdeas.map((idea) => {
      const scores = idea.scores || { originality: 75, feasibility: 70, market: 72 }
      const notes = [
        settings.constraints ? `Constraint: ${settings.constraints}.` : null,
        practicality >= 70 ? 'Bias: ship the smallest defensible version first.' : null,
        practicality <= 30 ? 'Bias: chase the strangest reading before optimising for feasibility.' : null,
      ].filter(Boolean)

      return {
        ...idea,
        format: settings.format === 'Any format' ? idea.format : settings.format,
        difficulty: settings.difficulty === 'Any difficulty' ? idea.difficulty : settings.difficulty,
        buildTime: settings.buildTime === 'Any timeline' ? idea.buildTime : settings.buildTime,
        audience: settings.audience || idea.audience,
        practicality,
        // The slider now actually moves the dossier scores it claims to control.
        scores: {
          ...scores,
          feasibility: clamp(scores.feasibility + bias * 18),
          originality: clamp(scores.originality - bias * 12),
        },
        pitch: [idea.pitch, ...notes].join(' '),
      }
    })

    setIdeas((current) => [...constrained, ...current])
    sendAnalyticsEvent('generate', { domainA, domainB, domainC, format: settings.format, difficulty: settings.difficulty })
    setHistory((items) => [{ id: Date.now(), domains: [domainA, domainB, domainC].filter(Boolean), createdAt: new Date().toLocaleString() }, ...items].slice(0, 12))
    setActiveFilter('All')
    outputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  // Turns selected signal-scan results into idea cards grounded in the real
  // posts, then drops the user into the output grid to explore them.
  const forgeFromSignals = (signals, topic) => {
    const forged = createSignalIdeas(signals, { domainA: domainA || topic, domainB: domainB || topic, domainC })
    if (forged.length === 0) return
    setIdeas((current) => [...forged, ...current])
    setHistory((items) => [{ id: Date.now(), domains: [topic, 'signal forge'], createdAt: new Date().toLocaleString() }, ...items].slice(0, 12))
    setActiveFilter('All')
    setQuery('')
    outputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  // Attaches an AI blueprint to an idea everywhere it lives (grid, dossier,
  // vault) so it survives saving and re-opens in view mode.
  const attachBlueprint = (idea, blueprint) => {
    const updated = { ...idea, blueprint }
    setIdeas((current) => current.map((item) => (item.id === idea.id ? updated : item)))
    setSaved((items) => items.map((item) => (item.id === idea.id ? { ...item, blueprint } : item)))
    setDetailIdea((current) => (current?.id === idea.id ? updated : current))
    setBlueprintIdea((current) => (current?.id === idea.id ? updated : current))
    notify('Blueprint attached to the idea.', 'success')
  }

  const refine = (idea, mode) => {
    const refined = {
      ...idea,
      id: `${idea.id}-refined-${Date.now()}`,
      title: mode === 'practical' ? `${idea.title} / Field Test` : `${idea.title} / Wildcard`,
      tagline: mode === 'practical' ? 'A tighter MVP with a clear first customer.' : 'Push the collision into stranger, more memorable territory.',
      pitch: `${idea.pitch} This refinement focuses on a ${mode} interpretation with a single measurable first-use outcome.`,
    }
    setIdeas((current) => [refined, ...current])
    setDetailIdea(refined)
  }

  const toggleCompare = (idea) => setCompareIds((ids) => (ids.includes(idea.id) ? ids.filter((id) => id !== idea.id) : ids.length < 2 ? [...ids, idea.id] : [ids[1], idea.id]))
  const rateIdea = (idea, value) => learn('rating', idea, value)
  const inspectIdea = (idea) => {
    learn('explore', idea)
    setDetailIdea(idea)
  }

  const exportMarkdown = (idea) => {
    const markdown = [
      `# ${idea.title}`,
      '',
      idea.tagline,
      '',
      '## Pitch',
      idea.pitch,
      '',
      '## Audience',
      idea.audience,
      '',
      '## MVP',
      (idea.mvp || []).map((item) => `- ${item}`).join('\n'),
      '',
      ...(idea.blueprint ? ['## AI blueprint', 'See the attached blueprint (export it from the AI architect).', ''] : []),
      '## Vibecode Prompt',
      idea.prompt,
    ].join('\n')
    downloadBlob(`${slugify(idea.title)}.md`, markdown, 'text/markdown')
  }

  const exportVault = () => downloadBlob('idea-lab-vault.json', JSON.stringify(saved, null, 2), 'application/json')

  const copySummary = async (idea) => {
    if (await copyToClipboard(`${idea.title}: ${idea.tagline}`)) {
      setCopied(idea.id)
      setTimeout(() => setCopied(null), 1400)
    }
  }

  return <MotionConfig reducedMotion="user"><div className="min-h-screen bg-[#f5f7f2] text-slate-900 transition-colors dark:bg-ink dark:text-white">
    <header className="app-header sticky top-0 z-30 border-b border-slate-200/80 bg-[#f5f7f2]/85 backdrop-blur-xl dark:border-white/10 dark:bg-ink/80">
      <div className="mx-auto flex max-w-[1440px] items-center justify-between px-5 py-4 sm:px-8 lg:px-12">
        <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="group flex items-center gap-3 text-left" aria-label="Go to top of Idea Lab"><div className="logo-mark transition group-hover:-translate-y-0.5"><FlaskConical className="h-4 w-4" /></div><div><p className="font-mono text-[9px] uppercase tracking-[0.28em] text-slate-500">Idea Lab</p><h1 className="font-display text-sm font-semibold tracking-tight text-slate-900 dark:text-white">// Mashup Generator</h1></div></button>
        <div className="flex items-center gap-2 sm:gap-3">
          {auth.authAvailable && (auth.session
            ? <AccountMenu auth={auth} onUpgrade={openPaywall} notify={notify} />
            : <button onClick={() => openAuth('Sign in to claim your free trial — 5 signal scans + 3 AI blueprints.')} className="secondary-button"><User className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Sign in</span></button>)}
          <button className="icon-button" onClick={() => setDark(!dark)} aria-label="Toggle theme">{dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}</button>
          <button onClick={() => setHistoryOpen(true)} className="icon-button" aria-label="Open generation history"><History className="h-4 w-4" /></button>
          <button onClick={() => setVaultOpen(true)} className="vault-button"><Bookmark className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Vault</span><b>{saved.length}</b></button>
        </div>
      </div>
    </header>

    <main className="mx-auto max-w-[1440px] px-5 py-10 sm:px-8 sm:py-14 lg:px-12">
      <section className="mb-14"><h2 className="max-w-4xl font-display text-5xl font-semibold leading-[0.95] tracking-[-0.08em] text-slate-950 dark:text-white sm:text-7xl lg:text-[6.5rem]">Make the <span className="text-acid [text-shadow:0_0_28px_rgba(184,243,74,.28)]">unlikely</span><br />feel inevitable.</h2></section>

      <section className="mb-16">
        <div className="mb-4 flex items-end justify-between">
          <div><p className="font-mono text-[10px] uppercase tracking-[0.25em] text-slate-500">01 / Select your collision</p></div>
          <div className="flex gap-2"><button onClick={() => setAdvanced(!advanced)} className="secondary-button"><MoreHorizontal className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Advanced</span></button><button onClick={() => setApiOpen(true)} className="secondary-button"><KeyRound className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Model setup</span></button></div>
        </div>
        <div className="grid items-center gap-3 lg:grid-cols-[1fr_76px_1fr] lg:items-stretch">
          <DomainSlot label="Domain A" value={domainA} onChange={setDomainA} domains={domains} spinning={spinning} accent="cyan" />
          <div className="order-first flex justify-center lg:order-none lg:items-center"><button onClick={spin} className="spin-button" aria-label="Randomize domains"><motion.span animate={{ rotate: revolutions * 360 }} transition={{ duration: (SPIN_MS + 100) / 1000, ease: EASE_SMOOTH }} className="flex items-center justify-center"><RotateCw className="h-5 w-5" /></motion.span><span className="sr-only">Spin</span></button></div>
          <DomainSlot label="Domain B" value={domainB} onChange={setDomainB} domains={domains} spinning={spinning} accent="violet" />
        </div>
        <div className="mt-3 grid gap-3 lg:grid-cols-[1fr_76px_1fr]">
          <div className="lg:col-span-3"><div className="third-domain"><span className="font-mono text-[10px] uppercase tracking-[0.2em] text-slate-500">Optional third domain</span><input value={domainC} onChange={(event) => setDomainC(event.target.value)} placeholder="Add a third world for a wilder mashup..." className="ml-3 min-w-0 flex-1 bg-transparent text-sm text-slate-900 placeholder:text-slate-400 outline-none dark:text-slate-200 dark:placeholder:text-slate-600" /></div></div>
        </div>
        {/* Height animations reflow everything below them on every frame, so this
            one is kept short and the fade is front-loaded to hide the reflow. */}
        <AnimatePresence initial={false}>{advanced && <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} transition={{ height: { duration: 0.3, ease: EASE_SMOOTH }, opacity: { duration: 0.2, ease: EASE_SMOOTH } }} className="overflow-hidden"><AdvancedControls settings={settings} onChange={setSettings} /></motion.div>}</AnimatePresence>
        <div className="mt-5 flex justify-end">
          <button onClick={generate} className="primary-button"><Sparkles className="h-4 w-4" /> Generate ideas <ChevronRight className="h-4 w-4" /></button>
        </div>
      </section>

      <SignalScan auth={auth} domainA={domainA} domainB={domainB} domainC={domainC} onForge={forgeFromSignals} openAuth={openAuth} openPaywall={openPaywall} />

      <section ref={outputRef}>
        <div className="mb-6 flex flex-col justify-between gap-5 border-b border-slate-200 pb-5 dark:border-white/10 sm:flex-row sm:items-end">
          <div><p className="font-mono text-[10px] uppercase tracking-[0.25em] text-slate-500">03 / The output</p><h3 className="mt-2 font-display text-3xl font-semibold tracking-[-0.05em]">{hasPreferences ? 'Personalized for you' : 'Fresh from the lab'} <span className="font-mono text-sm font-normal text-slate-500">({visibleIdeas.length})</span></h3></div>
          <div className="flex items-center gap-3">
            <div className="relative hidden sm:block"><Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-500" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Filter archive" className="search-input" /></div>
            <div className="flex flex-wrap gap-1 rounded-xl border border-slate-200 bg-white p-1 dark:border-white/10 dark:bg-white/5">{filters.map((filter) => <button key={filter} onClick={() => setActiveFilter(filter)} className={`filter-chip ${activeFilter === filter ? 'active' : ''}`}>{filter}</button>)}</div>
          </div>
        </div>

        {compareIds.length > 0 && <div className="mb-5 rounded-2xl border border-acid/30 bg-acid/10 p-4">
          <div className="mb-3 flex items-center justify-between">
            <span className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-acid"><GitCompareArrows className="h-4 w-4" /> {compareIdeas.length === 2 ? 'Side by side' : 'Pick one more idea to compare'}</span>
            <button onClick={() => setCompareIds([])} className="font-mono text-[10px] uppercase tracking-wider text-slate-500 transition hover:text-slate-900 dark:hover:text-white">Clear</button>
          </div>
          {compareIdeas.length === 2 && <div className="grid gap-4 sm:grid-cols-2">{compareIdeas.map((idea) => <div key={idea.id} className="rounded-xl border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-white/[0.03]">
            <h4 className="font-display text-lg font-semibold tracking-[-0.03em] text-slate-950 dark:text-white">{idea.title}</h4>
            <p className="mt-1 text-xs leading-5 text-slate-500">{idea.tagline}</p>
            <dl className="mt-3 space-y-1.5">{[['Type', idea.type], ['Format', idea.format], ['Difficulty', idea.difficulty], ['Timeline', idea.buildTime], ['Model', idea.businessModel], ['Audience', idea.audience]].map(([label, value]) => <div key={label} className="flex justify-between gap-3 font-mono text-[10px]"><dt className="uppercase tracking-wider text-slate-400">{label}</dt><dd className="text-right text-slate-700 dark:text-slate-300">{value || '—'}</dd></div>)}</dl>
            <button onClick={() => inspectIdea(idea)} className="mt-3 font-mono text-[10px] uppercase tracking-wider text-acid">Open dossier</button>
          </div>)}</div>}
        </div>}

        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          <AnimatePresence mode="popLayout">{visibleIdeas.map((idea, index) => <IdeaCard
            key={idea.id}
            idea={idea}
            index={index}
            saved={saved.some((item) => item.id === idea.id)}
            onSave={saveIdea}
            onCopy={copyPrompt}
            copied={copied === idea.id}
            copyFailed={copyFailed === idea.id}
            onInspect={inspectIdea}
            onRefine={(item, mode) => { learn('refine', item); refine(item, mode) }}
            onCompare={toggleCompare}
            compared={compareIds.includes(idea.id)}
            rating={profile.ratings[idea.id]}
            onRate={rateIdea}
            onShare={(item) => sendAnalyticsEvent('share', item)}
          />)}</AnimatePresence>
        </div>
        {visibleIdeas.length === 0 && <div className="rounded-3xl border border-dashed border-slate-300 py-20 text-center dark:border-white/15"><Dices className="mx-auto mb-4 h-8 w-8 text-slate-500" /><p className="font-display text-xl">No patterns found.</p><p className="mt-2 text-sm text-slate-500">Try another filter or generate a fresh collision.</p></div>}
      </section>
    </main>

    <footer className="border-t border-slate-200 px-5 py-8 dark:border-white/10 sm:px-8 lg:px-12"><div className="mx-auto flex max-w-[1440px] flex-wrap items-center justify-between gap-4 font-mono text-[10px] uppercase tracking-[0.2em] text-slate-500"><span>Idea Lab / v2.0.0</span><span className="hidden sm:block">Make weird useful</span><button onClick={() => { resetLearning(); clearAnonymousAnalyticsId(); setConsent(null) }} className="text-slate-500 transition hover:text-acid">Privacy controls</button></div></footer>

    <AnimatePresence>{vaultOpen && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={FADE} className="overlay fixed inset-0 z-40 bg-ink/60 backdrop-blur-sm" onMouseDown={(event) => event.target === event.currentTarget && setVaultOpen(false)}>
      <motion.aside initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={SPRING_DRAWER} className="absolute right-0 top-0 h-full w-full max-w-md overflow-y-auto border-l border-white/10 bg-panel p-6 shadow-2xl sm:p-8">
        <div className="mb-6 flex items-center justify-between"><div><p className="font-mono text-[10px] uppercase tracking-[0.2em] text-acid">Saved archive</p><h2 className="mt-2 font-display text-3xl font-semibold text-white">Your vault</h2></div><button className="icon-button" onClick={() => setVaultOpen(false)}><X className="h-4 w-4" /></button></div>
        <div className="mb-6 flex gap-2">
          <select value={vaultFolder} onChange={(event) => setVaultFolder(event.target.value)} className="control-input provider-select flex-1" aria-label="Filter vault by folder">
            <option value={ALL_IDEAS}>{ALL_IDEAS} ({saved.length})</option>
            {vaultFolders.map((folder) => <option key={folder} value={folder}>{folder} ({saved.filter((item) => (item.folder || DEFAULT_FOLDER) === folder).length})</option>)}
          </select>
          <button onClick={exportVault} className="icon-button" aria-label="Export vault"><Download className="h-4 w-4" /></button>
        </div>
        {saved.length === 0
          ? <div className="py-16 text-center text-sm text-slate-500">Bookmark ideas to build a personal reference set.</div>
          : savedInFolder.length === 0
            ? <div className="py-16 text-center text-sm text-slate-500">Nothing filed under “{vaultFolder}” yet.</div>
            : <div className="space-y-3">{savedInFolder.map((idea) => <div key={idea.id} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              <div className="flex items-start justify-between"><div><p className="font-mono text-[9px] uppercase tracking-widest text-violet">{idea.type}</p><h3 className="mt-1 font-display text-lg font-semibold text-white">{idea.title}</h3></div><button onClick={() => saveIdea(idea)} className="text-slate-500 transition hover:text-acid" aria-label={`Remove ${idea.title} from vault`}><Bookmark className="h-4 w-4 fill-current" /></button></div>
              <p className="mt-2 text-xs leading-5 text-slate-500">{idea.tagline}</p>
              <select value={idea.folder || DEFAULT_FOLDER} onChange={(event) => moveIdeaToFolder(idea.id, event.target.value)} className="control-input provider-select mt-3 w-full" aria-label={`Folder for ${idea.title}`}>
                {vaultFolders.map((folder) => <option key={folder} value={folder}>{folder}</option>)}
              </select>
              <div className="mt-3 flex gap-2"><button onClick={() => setDetailIdea(idea)} className="text-[10px] text-acid">Open dossier</button><button onClick={() => exportMarkdown(idea)} className="text-[10px] text-slate-500">Export</button></div>
            </div>)}</div>}
      </motion.aside>
    </motion.div>}</AnimatePresence>

    <AnimatePresence>{historyOpen && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={FADE} className="overlay fixed inset-0 z-40 bg-ink/60 backdrop-blur-sm" onMouseDown={(event) => event.target === event.currentTarget && setHistoryOpen(false)}><motion.aside initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }} transition={SPRING_DRAWER} className="absolute left-0 top-0 h-full w-full max-w-sm overflow-y-auto border-r border-white/10 bg-panel p-6 shadow-2xl"><div className="mb-10 flex items-center justify-between"><div><p className="font-mono text-[10px] uppercase tracking-widest text-acid">Session log</p><h2 className="mt-2 font-display text-3xl font-semibold text-white">History</h2></div><button className="icon-button" onClick={() => setHistoryOpen(false)}><X className="h-4 w-4" /></button></div>{history.length === 0 ? <p className="text-sm text-slate-500">Your generated collisions will appear here.</p> : <div className="space-y-3">{history.map((entry) => <button key={entry.id} onClick={() => { setDomainA(entry.domains[0] || ''); setDomainB(entry.domains[1] || ''); setDomainC(entry.domains[2] || ''); setHistoryOpen(false) }} className="w-full rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-left transition hover:border-acid/40"><div className="mb-2 flex items-center justify-between font-mono text-[9px] uppercase tracking-widest text-slate-500"><span>Collision</span><span>{entry.createdAt}</span></div><p className="text-sm text-white">{entry.domains.join(' + ')}</p></button>)}</div>}</motion.aside></motion.div>}</AnimatePresence>

    <AnimatePresence>{detailIdea && <IdeaDetailModal idea={detailIdea} onClose={() => setDetailIdea(null)} onPresent={() => { setPresentation(detailIdea); setDetailIdea(null) }} onExport={() => exportMarkdown(detailIdea)} onBlueprint={(idea) => setBlueprintIdea(idea)} />}</AnimatePresence>

    <AnimatePresence>{blueprintIdea && <BlueprintModal idea={blueprintIdea} initialBlueprint={blueprintIdea.blueprint || null} onClose={() => setBlueprintIdea(null)} auth={auth} openAuth={openAuth} openPaywall={openPaywall} openModelSetup={() => setApiOpen(true)} onAttach={attachBlueprint} />}</AnimatePresence>

    <AnimatePresence>{presentation && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={FADE} className="fixed inset-0 z-[60] flex items-center justify-center bg-ink p-6 text-center"><button onClick={() => setPresentation(null)} className="icon-button absolute right-6 top-6" aria-label="Exit presentation mode"><X className="h-4 w-4" /></button><motion.div initial={{ opacity: 0, y: 18, scale: 0.985 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 10, scale: 0.99 }} transition={{ ...ENTER, delay: 0.06 }} className="max-w-4xl"><p className="mb-6 font-mono text-xs uppercase tracking-[0.3em] text-acid">Idea Lab / Presentation mode</p><h2 className="font-display text-6xl font-semibold tracking-[-0.08em] text-white sm:text-8xl">{presentation.title}</h2><p className="mx-auto mt-8 max-w-2xl text-xl leading-8 text-slate-400">{presentation.tagline} {presentation.pitch}</p><div className="mt-10 flex justify-center gap-3"><button onClick={() => copySummary(presentation)} className="secondary-button"><Copy className="h-4 w-4" /> {copied === presentation.id ? 'Copied' : 'Copy summary'}</button><button onClick={() => exportMarkdown(presentation)} className="primary-button"><Download className="h-4 w-4" /> Export</button></div></motion.div></motion.div>}</AnimatePresence>

    <AnimatePresence>{apiOpen && <ApiModal onClose={() => setApiOpen(false)} />}</AnimatePresence>
    <AnimatePresence>{authOpen && <AuthModal onClose={() => setAuthOpen(false)} reason={authReason} sendMagicLink={auth.sendMagicLink} />}</AnimatePresence>
    <AnimatePresence>{paywallOpen && <PaywallModal onClose={() => setPaywallOpen(false)} reason={paywallReason} auth={auth} onUseOwnKey={() => { setPaywallOpen(false); setApiOpen(true) }} />}</AnimatePresence>
    <AnimatePresence>{consent === null && <ConsentBanner onChoice={setConsent} />}</AnimatePresence>
    <StatusToast toast={toast} onDismiss={() => setToast(null)} />
  </div></MotionConfig>
}

export default App
