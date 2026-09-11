import { motion } from 'framer-motion'
import { AlertTriangle, Brain, CalendarClock, Check, Database, Download, KeyRound, Layers, Lightbulb, Loader2, ListChecks, RefreshCw, Rocket, ShieldAlert, Users, Workflow, X, Zap } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { generateBlueprint } from '../lib/api'
import { ApiError } from '../lib/api'
import { blueprintToMarkdown, buildBlueprintPrompt, callModel, defaultModelFor, normalizeBlueprint, parseBlueprint } from '../lib/ai.js'
import { sendAnalyticsEvent } from '../lib/analytics'
import { ENTER, FADE } from '../lib/motion'

const WORKING_STEPS = [
  'Reading the collision context…',
  'Weighing real-world signals…',
  'Drafting the architecture…',
  'Scoping a buildable MVP…',
]

const PROVIDER_KEYS = {
  provider: 'idea-lab-provider',
  apiKey: 'idea-lab-api-key',
}

// Bring-your-own-key preference written by ApiModal (sessionStorage only, so
// the key dies with the tab).
function readOwnKey() {
  try {
    const provider = sessionStorage.getItem(PROVIDER_KEYS.provider) || 'OpenAI'
    const apiKey = sessionStorage.getItem(PROVIDER_KEYS.apiKey) || ''
    return { provider, apiKey: apiKey.trim(), hasKey: apiKey.trim().length > 0 }
  } catch {
    return { provider: 'OpenAI', apiKey: '', hasKey: false }
  }
}

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

const slugify = (value) => value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'blueprint'

const Section = ({ icon: Icon, title, children }) => <section className="detail-section"><div className="mb-3 flex items-center gap-2"><Icon className="h-4 w-4 text-acid" /><h3 className="font-mono text-[10px] uppercase tracking-[0.2em] text-slate-500">{title}</h3></div>{children}</section>

// The AI architect: turns an idea (+ optional mined signals) into a full
// buildable blueprint — stack, data flow, data model, APIs, phased plan —
// before the user commits to building. Runs on the server model (metered
// credit) or the user's own key (free, browser-direct).
export function BlueprintModal({ idea, onClose, auth, openAuth, openPaywall, openModelSetup, onAttach, initialBlueprint = null }) {
  const [phase, setPhase] = useState(initialBlueprint ? 'done' : 'setup') // setup | working | done | error
  const [notes, setNotes] = useState('')
  const [blueprint, setBlueprint] = useState(initialBlueprint)
  const [blueprintMeta, setBlueprintMeta] = useState(null) // { mode: 'server'|'own', provider, model }
  const [attached, setAttached] = useState(false)
  const [error, setError] = useState(null)
  const [useOwn, setUseOwn] = useState(() => readOwnKey().hasKey)
  const [stepIndex, setStepIndex] = useState(0)
  const ownKey = readOwnKey()
  const stepTimer = useRef(null)

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  useEffect(() => {
    if (phase === 'working') {
      stepTimer.current = setInterval(() => setStepIndex((index) => Math.min(index + 1, WORKING_STEPS.length - 1)), 2600)
      return () => clearInterval(stepTimer.current)
    }
    return undefined
  }, [phase])

  const run = async () => {
    if (phase === 'working') return

    const usingOwn = useOwn && ownKey.hasKey
    if (!usingOwn && !auth.session) {
      openAuth('AI blueprints need an account — your free trial includes 3 blueprints, or add your own key in Model setup.')
      return
    }

    setPhase('working')
    setStepIndex(0)
    setError(null)
    setAttached(false)

    try {
      let result
      let meta
      if (usingOwn) {
        const prompt = buildBlueprintPrompt({ idea, signals: idea.signals || [], notes })
        result = await callModel({
          provider: ownKey.provider,
          apiKey: ownKey.apiKey,
          system: prompt.system,
          user: prompt.user,
          browserDirect: true,
          timeoutMs: 90000,
        })
        if (result.error) throw new ApiError('model_error', `${result.error} (your ${ownKey.provider} key)`)
        meta = { mode: 'own', provider: ownKey.provider, model: defaultModelFor(ownKey.provider) }
      } else {
        const token = await auth.getToken()
        result = await generateBlueprint({
          idea: {
            title: idea.title,
            domainA: idea.domainA,
            domainB: idea.domainB,
            domainC: idea.domainC,
            tagline: idea.tagline,
            pitch: idea.pitch,
            audience: idea.audience,
            type: idea.type,
          },
          signals: idea.signals || [],
          notes,
        }, token)
        auth.applyCredits(result.credits)
        meta = { mode: 'server', provider: result.provider, model: null }
      }
      setBlueprintMeta(meta)

      // BYOK returns raw text; the server pre-parses. Normalise both paths.
      const parsed = result.blueprint || parseBlueprint(result.text)
      if (!parsed) throw new ApiError('model_error', 'The model did not return a valid blueprint. Try again.')
      setBlueprint(normalizeBlueprint(parsed))
      setPhase('done')
      sendAnalyticsEvent('blueprint', { mode: meta.mode, provider: String(meta.provider || '') })
    } catch (caught) {
      if (caught instanceof ApiError) {
        if (caught.code === 'unauthenticated') {
          openAuth('Your session expired — sign in again to use the server model.')
        } else if (caught.code === 'trial_exhausted') {
          auth.applyCredits(caught.credits)
          openPaywall('ai')
        } else if (caught.code === 'ai_not_configured') {
          setError(`${caught.message}`)
        } else {
          setError(caught.message)
        }
      } else {
        setError(caught.message || 'The blueprint failed. Try again.')
      }
      setPhase(caught instanceof ApiError && ['unauthenticated', 'trial_exhausted'].includes(caught.code) ? 'setup' : 'error')
    }
  }

  const exportMarkdown = () => {
    downloadBlob(`${slugify(blueprint.name || idea.title)}-blueprint.md`, blueprintToMarkdown(blueprint), 'text/markdown')
  }

  const attach = () => {
    onAttach(idea, blueprint)
    setAttached(true)
  }

  const bp = blueprint ? normalizeBlueprint(blueprint) : null

  return <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={FADE} className="overlay fixed inset-0 z-50 overflow-y-auto bg-ink/85 p-4 backdrop-blur-lg" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
    <motion.div initial={{ opacity: 0, y: 18, scale: 0.985 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 10, scale: 0.99 }} transition={ENTER} className="mx-auto my-4 max-w-4xl rounded-3xl border border-white/10 bg-panel p-6 shadow-2xl sm:my-10 sm:p-9">
      <div className="mb-6 flex items-start justify-between gap-5">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-violet">AI architect / blueprint</p>
          <h2 className="mt-3 font-display text-4xl font-semibold tracking-[-0.05em] text-white">{phase === 'done' && bp ? bp.name : idea.title}</h2>
          <p className="mt-2 text-slate-400">{phase === 'done' && bp ? bp.tagline : 'Brainstorm the concept and lock the architecture before you build.'}</p>
        </div>
        <button className="icon-button" onClick={onClose} aria-label="Close blueprint"><X className="h-4 w-4" /></button>
      </div>

      {phase === 'setup' && <>
        <div className="mb-6 grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-slate-500">Context</p>
            <p className="mt-2 text-sm text-white">{[idea.domainA, idea.domainB, idea.domainC].filter(Boolean).join(' x ')}</p>
            <p className="mt-2 text-xs leading-5 text-slate-400">{idea.tagline}</p>
            {(idea.signals || []).length > 0 && <p className="mt-3 flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-wider text-acid"><Zap className="h-3 w-3" />{idea.signals.length} real-world signals attached</p>}
          </div>
          <label className="block">
            <span className="mb-2 block font-mono text-[10px] uppercase tracking-[0.18em] text-slate-500">Builder notes <b className="text-slate-600">optional</b></span>
            <textarea
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              placeholder="Constraints, must-haves, tone, non-goals…"
              rows={4}
              className="input resize-none"
            />
          </label>
        </div>

        <div className="mb-6 grid gap-3 sm:grid-cols-2">
          <button onClick={() => setUseOwn(true)} disabled={!ownKey.hasKey} className={`rounded-2xl border p-4 text-left transition disabled:opacity-40 ${useOwn ? 'border-cyan/50 bg-cyan/[0.06]' : 'border-white/10 bg-white/[0.03] hover:border-white/20'}`}>
            <p className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.18em] text-cyan"><KeyRound className="h-3.5 w-3.5" /> Your key — free</p>
            <p className="mt-2 text-xs leading-5 text-slate-400">{ownKey.hasKey ? `${ownKey.provider} key, calls go straight from this browser.` : 'Add a provider key in Model setup to unlock this.'}</p>
          </button>
          <button onClick={() => setUseOwn(false)} className={`rounded-2xl border p-4 text-left transition ${!useOwn ? 'border-acid/50 bg-acid/[0.06]' : 'border-white/10 bg-white/[0.03] hover:border-white/20'}`}>
            <p className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.18em] text-acid"><Brain className="h-3.5 w-3.5" /> Idea Lab model — 1 credit</p>
            <p className="mt-2 text-xs leading-5 text-slate-400">{auth.isPro ? 'Pro: unlimited blueprints.' : auth.session ? `${auth.profile?.trial_ai_left ?? '…'} trial blueprint${auth.profile?.trial_ai_left === 1 ? '' : 's'} left.` : 'Sign in — free trial includes 3.'}</p>
          </button>
        </div>

        {error && <div className="mb-6 flex items-start gap-3 rounded-2xl border border-red-400/30 bg-red-400/[0.07] p-4">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-red-300" />
          <p className="text-xs leading-5 text-red-200/90">{error}</p>
        </div>}

        <div className="flex flex-wrap gap-3">
          <button onClick={run} className="primary-button"><Brain className="h-4 w-4" /> Generate blueprint</button>
          {ownKey.hasKey && !useOwn && <button onClick={() => { setUseOwn(true); openModelSetup() }} className="secondary-button"><KeyRound className="h-4 w-4" /> Use my key instead</button>}
          {error && error.toLowerCase().includes('not configured') && <button onClick={openModelSetup} className="secondary-button"><KeyRound className="h-4 w-4" /> Model setup</button>}
        </div>
      </>}

      {phase === 'working' && <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl border border-acid/30 bg-acid/10 text-acid"><Loader2 className="h-6 w-6 animate-spin" /></div>
        <p className="font-display text-xl text-white">Architecting…</p>
        <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.2em] text-slate-500">{WORKING_STEPS[stepIndex]}</p>
        <div className="mt-6 flex gap-1.5">{WORKING_STEPS.map((step, index) => <span key={step} className={`h-1 w-8 rounded-full transition-colors ${index <= stepIndex ? 'bg-acid' : 'bg-white/10'}`} />)}</div>
      </div>}

      {phase === 'error' && <div className="flex flex-col items-center py-16 text-center">
        <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl border border-red-400/30 bg-red-400/10 text-red-300"><AlertTriangle className="h-5 w-5" /></div>
        <p className="font-display text-xl text-white">The architect hit a snag.</p>
        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-400">{error}</p>
        <div className="mt-6 flex gap-3">
          <button onClick={run} className="primary-button"><RefreshCw className="h-4 w-4" /> Try again</button>
          <button onClick={() => setPhase('setup')} className="secondary-button">Adjust inputs</button>
        </div>
      </div>}

      {phase === 'done' && bp && <>
        {blueprintMeta && <p className="mb-6 font-mono text-[9px] uppercase tracking-[0.2em] text-slate-600">Blueprint by {blueprintMeta.mode === 'own' ? `your ${blueprintMeta.provider} key` : `Idea Lab (${blueprintMeta.provider})`}</p>}

        <div className="mb-6 grid gap-4 md:grid-cols-2">
          <Section icon={Lightbulb} title="Problem"><p>{bp.problemStatement || '—'}</p></Section>
          <Section icon={Users} title="Target users"><p>{bp.targetUsers || '—'}</p></Section>
        </div>

        <Section icon={Rocket} title="Solution"><p>{bp.solution || '—'}</p></Section>

        {bp.mvpFeatures.length > 0 && <Section icon={ListChecks} title="MVP features">
          <ul className="space-y-2">{bp.mvpFeatures.map((feature) => <li key={feature} className="pl-4">{feature}</li>)}</ul>
        </Section>}

        {bp.architecture.summary && <Section icon={Layers} title="Architecture"><p>{bp.architecture.summary}</p></Section>}

        {bp.architecture.stack.length > 0 && <Section icon={Layers} title="Stack">
          <div className="space-y-2">{bp.architecture.stack.map((layer) => <div key={`${layer.layer}-${layer.choice}`} className="flex flex-col gap-1 rounded-xl border border-white/10 bg-black/20 p-3 sm:flex-row sm:items-center sm:gap-4">
            <span className="w-28 shrink-0 font-mono text-[9px] uppercase tracking-wider text-slate-500">{layer.layer}</span>
            <span className="font-medium text-slate-200">{layer.choice}</span>
            {layer.why && <span className="text-xs leading-5 text-slate-500 sm:ml-auto sm:max-w-xs sm:text-right">{layer.why}</span>}
          </div>)}</div>
        </Section>}

        {bp.architecture.dataFlow.length > 0 && <Section icon={Workflow} title="Data flow">
          <ol className="space-y-2">{bp.architecture.dataFlow.map((step, index) => <li key={step} className="pl-4"><span className="mr-2 font-mono text-[10px] text-acid">{String(index + 1).padStart(2, '0')}</span>{step}</li>)}</ol>
        </Section>}

        {bp.architecture.dataModel.length > 0 && <Section icon={Database} title="Data model">
          <div className="grid gap-2 sm:grid-cols-2">{bp.architecture.dataModel.map((entity) => <div key={entity.entity} className="rounded-xl border border-white/10 bg-black/20 p-3">
            <p className="font-mono text-[10px] uppercase tracking-wider text-violet">{entity.entity}</p>
            <p className="mt-1.5 font-mono text-xs leading-5 text-slate-300">{entity.fields}</p>
            {entity.notes && <p className="mt-1.5 text-xs leading-4 text-slate-500">{entity.notes}</p>}
          </div>)}</div>
        </Section>}

        {bp.architecture.apis.length > 0 && <Section icon={Zap} title="API surface">
          <div className="space-y-1.5">{bp.architecture.apis.map((api) => <div key={api.endpoint} className="flex flex-col gap-0.5 rounded-lg bg-black/20 px-3 py-2 sm:flex-row sm:items-baseline sm:gap-3">
            <code className="shrink-0 font-mono text-xs text-acid">{api.endpoint}</code>
            <span className="text-xs leading-5 text-slate-500">{api.purpose}</span>
          </div>)}</div>
        </Section>}

        {bp.buildPlan.length > 0 && <Section icon={CalendarClock} title="Build plan">
          <div className="space-y-3">{bp.buildPlan.map((phaseItem) => <div key={phaseItem.phase} className="rounded-xl border border-white/10 bg-black/20 p-4">
            <p className="font-mono text-[9px] uppercase tracking-wider text-acid">{phaseItem.phase}</p>
            {phaseItem.goal && <p className="mt-1 text-sm text-slate-300">{phaseItem.goal}</p>}
            <ul className="mt-2 space-y-1.5">{phaseItem.tasks.map((task) => <li key={task} className="pl-4 text-xs leading-5 text-slate-500">{task}</li>)}</ul>
          </div>)}</div>
        </Section>}

        <div className="grid gap-4 md:grid-cols-2">
          {bp.risks.length > 0 && <Section icon={ShieldAlert} title="Risks"><ul className="space-y-2">{bp.risks.map((risk) => <li key={risk} className="pl-4">{risk}</li>)}</ul></Section>}
          {bp.openQuestions.length > 0 && <Section icon={Brain} title="Open questions"><ul className="space-y-2">{bp.openQuestions.map((question) => <li key={question} className="pl-4">{question}</li>)}</ul></Section>}
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <button onClick={exportMarkdown} className="secondary-button"><Download className="h-4 w-4" /> Export markdown</button>
          <button onClick={attach} disabled={attached} className="primary-button disabled:opacity-60">{attached ? <Check className="h-4 w-4" /> : <Layers className="h-4 w-4" />} {attached ? 'Attached to idea' : 'Attach to this idea'}</button>
          <button onClick={() => { setPhase('setup'); setBlueprint(null) }} className="secondary-button"><RefreshCw className="h-4 w-4" /> New pass</button>
        </div>
      </>}
    </motion.div>
  </motion.div>
}
