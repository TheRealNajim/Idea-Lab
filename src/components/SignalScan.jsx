import { AnimatePresence, motion } from 'framer-motion'
import { ArrowRight, Check, ExternalLink, Loader2, Lock, Radar, Zap } from 'lucide-react'
import { useState } from 'react'
import { ApiError, scanSignals } from '../lib/api'
import { sendAnalyticsEvent } from '../lib/analytics'
import { EASE_SMOOTH, ENTER } from '../lib/motion'

// Locked sources are listed for honesty: Meta's Graph API does not offer
// public content search without a reviewed partner app, so chips render but
// explain why they cannot toggle yet.
const SOURCES = [
  { key: 'reddit', label: 'Reddit' },
  { key: 'hackernews', label: 'Hacker News' },
  { key: 'stackoverflow', label: 'Stack Overflow' },
  { key: 'medium', label: 'Medium' },
  { key: 'youtube', label: 'YouTube' },
  { key: 'twitter', label: 'X / Twitter' },
  { key: 'facebook', label: 'Facebook', locked: 'Public search requires Meta app review — not yet available' },
  { key: 'instagram', label: 'Instagram', locked: 'Public search requires Meta app review — not yet available' },
]

const DEFAULT_ACTIVE = ['reddit', 'hackernews', 'stackoverflow', 'medium']

const formatEngagement = (value) => {
  if (!value || value <= 0) return null
  if (value >= 1000) return `${(value / 1000).toFixed(1)}k`
  return String(value)
}

const formatDate = (iso) => {
  if (!iso) return null
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return null
  return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short' })
}

export function SignalScan({ auth, domainA, domainB, domainC, onForge, openAuth, openPaywall }) {
  const [topic, setTopic] = useState('')
  const [activeSources, setActiveSources] = useState(DEFAULT_ACTIVE)
  const [results, setResults] = useState(null) // { topic, results: [...] }
  const [selected, setSelected] = useState(() => new Set())
  const [scanning, setScanning] = useState(false)
  const [notice, setNotice] = useState(null)

  const { session, profile, isPro } = auth
  const trialScansLeft = profile?.trial_scans_left

  const toggleSource = (source) => {
    setSelected(new Set())
    setActiveSources((current) => current.includes(source) ? current.filter((item) => item !== source) : [...current, source])
  }

  const useCurrentCollision = () => {
    const collision = [domainA, domainB, domainC].filter(Boolean).join(' ')
    if (collision) setTopic(collision)
  }

  const scan = async () => {
    const query = topic.trim()
    if (query.length < 2 || scanning) return

    if (!session) {
      openAuth('Signal scans need an account — your free trial includes 5 scans.')
      return
    }

    // Client-side pre-check for a smoother paywall; the server re-checks on
    // every request, so this only shapes the UX.
    if (!isPro && profile && profile.plan !== 'trial') {
      openPaywall('scan')
      return
    }

    setScanning(true)
    setNotice(null)
    try {
      const token = await auth.getToken()
      const data = await scanSignals({ topic: query, sources: activeSources, token })
      auth.applyCredits(data.credits)
      setResults(data)
      const flat = data.results.flatMap((group) => group.items || [])
      const preselected = new Set(
        [...flat].sort((a, b) => (b.engagement || 0) - (a.engagement || 0)).slice(0, 3).map((signal) => signal.id)
      )
      setSelected(preselected)
      sendAnalyticsEvent('signals_scan', { sources: activeSources.join(','), count: flat.length })
    } catch (error) {
      if (error instanceof ApiError) {
        if (error.code === 'unauthenticated') openAuth('Your session expired — sign in again to keep scanning.')
        else if (error.code === 'trial_exhausted') { auth.applyCredits(error.credits); openPaywall('scan') }
        else setNotice(error.message)
      } else {
        setNotice(error.message || 'The scan failed. Try again in a moment.')
      }
    } finally {
      setScanning(false)
    }
  }

  const flatSignals = results ? results.results.flatMap((group) => group.items || []) : []
  const sorted = [...flatSignals].sort((a, b) => (b.engagement || 0) - (a.engagement || 0))
  const selectedSignals = sorted.filter((signal) => selected.has(signal.id))
  const sourceStatuses = results ? results.results.filter((group) => group.status !== 'ok') : []

  const toggleSelected = (id) => {
    setSelected((current) => {
      const next = new Set(current)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const forge = () => {
    if (selectedSignals.length === 0) return
    onForge(selectedSignals, results.topic)
    sendAnalyticsEvent('signals_forge', { count: selectedSignals.length })
  }

  return <section className="mb-16">
    <div className="mb-4 flex items-end justify-between">
      <div>
        <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-slate-500">02 / Signal scan</p>
        <p className="mt-2 text-xs text-slate-500">Mine real problems from the web around your collision — then build the fix.</p>
      </div>
    </div>

    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-panel/70 sm:p-6">
      <div className="flex flex-col gap-3 lg:flex-row">
        <div className="relative flex-1">
          <Radar className="absolute left-4 top-3.5 h-4 w-4 text-slate-400" />
          <input
            value={topic}
            onChange={(event) => setTopic(event.target.value)}
            onKeyDown={(event) => event.key === 'Enter' && scan()}
            placeholder="What world should we listen to? e.g. meal planning, indie hacking, fitness coaching…"
            className="control-input !pl-11"
            aria-label="Signal scan topic"
          />
        </div>
        <button onClick={useCurrentCollision} className="secondary-button whitespace-nowrap" title="Use the domains selected above">Use current collision</button>
        <button onClick={scan} disabled={scanning || topic.trim().length < 2} className="primary-button whitespace-nowrap disabled:opacity-50">
          {scanning ? <Loader2 className="h-4 w-4 animate-spin" /> : <Radar className="h-4 w-4" />}
          {scanning ? 'Scanning…' : 'Scan signals'}
        </button>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        {SOURCES.map((source) => {
          const active = activeSources.includes(source.key)
          if (source.locked) {
            return <span key={source.key} title={source.locked} className="flex cursor-not-allowed items-center gap-1.5 rounded-lg border border-dashed border-slate-200 px-2.5 py-1.5 font-mono text-[9px] uppercase tracking-wider text-slate-400 dark:border-white/10 dark:text-slate-600">
              <Lock className="h-3 w-3" /> {source.label}
            </span>
          }
          return <button
            key={source.key}
            onClick={() => toggleSource(source.key)}
            className={`filter-chip rounded-lg border px-2.5 py-1.5 ${active ? 'border-acid/50 bg-acid/10 text-slate-900 dark:text-acid' : 'border-slate-200 text-slate-500 dark:border-white/10 dark:text-slate-500'}`}
            aria-pressed={active}
          >
            {active && <Check className="mr-1 inline h-3 w-3" />}{source.label}
          </button>
        })}
      </div>

      <div className="mt-4 flex flex-col justify-between gap-2 border-t border-slate-200 pt-4 font-mono text-[10px] uppercase tracking-[0.18em] text-slate-500 dark:border-white/10 sm:flex-row sm:items-center">
        <span>
          {!session
            ? 'Free trial: 5 scans + 3 AI blueprints with an account'
            : isPro
              ? 'Pro — unlimited scans'
              : `Trial — ${trialScansLeft ?? '…'} scan${trialScansLeft === 1 ? '' : 's'} left`}
        </span>
        {results && <span className="text-acid">{flatSignals.length} signals / {results.topic}</span>}
      </div>
    </div>

    {notice && <div className="mt-4 rounded-2xl border border-amber-400/30 bg-amber-400/[0.07] p-4 font-mono text-[10px] leading-5 text-amber-600 dark:text-amber-300/90">{notice}</div>}

    {scanning && <div className="mt-5 space-y-2">{[0, 1, 2].map((row) => <div key={row} className="h-16 animate-pulse rounded-2xl border border-slate-200 bg-white dark:border-white/10 dark:bg-white/[0.03]" style={{ animationDelay: `${row * 150}ms` }} />)}</div>}

    <AnimatePresence>
      {results && !scanning && <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={ENTER}>
        {sourceStatuses.length > 0 && <div className="mt-5 flex flex-wrap gap-2">
          {sourceStatuses.map((group) => <span key={group.source} className="rounded-lg border border-slate-200 px-2.5 py-1.5 font-mono text-[9px] uppercase tracking-wider text-slate-400 dark:border-white/10 dark:text-slate-500" title={group.message}>
            {group.label}: {group.status === 'not_configured' ? 'needs server key' : 'unavailable right now'}
          </span>)}
        </div>}

        {sorted.length === 0
          ? <div className="mt-5 rounded-3xl border border-dashed border-slate-300 py-16 text-center dark:border-white/15">
            <p className="font-display text-xl">No signals came back.</p>
            <p className="mt-2 text-sm text-slate-500">Try a broader topic or different sources.</p>
          </div>
          : <div className="mt-5 space-y-2">
            {sorted.map((signal, index) => {
              const isSelected = selected.has(signal.id)
              return <motion.div
                key={signal.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0, transition: { delay: Math.min(index, 8) * 0.03, duration: 0.3, ease: EASE_SMOOTH } }}
                role="button"
                tabIndex={0}
                aria-pressed={isSelected}
                onClick={() => toggleSelected(signal.id)}
                onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); toggleSelected(signal.id) } }}
                className={`flex w-full cursor-pointer items-start gap-4 rounded-2xl border p-4 text-left transition ${isSelected ? 'border-acid/50 bg-acid/[0.06] shadow-sm' : 'border-slate-200 bg-white hover:border-slate-300 dark:border-white/10 dark:bg-white/[0.02] dark:hover:border-white/20'}`}
              >
                <span className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border ${isSelected ? 'border-acid bg-acid text-ink' : 'border-slate-300 dark:border-white/20'}`}>
                  {isSelected ? <Check className="h-3.5 w-3.5" /> : null}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full border border-slate-300/60 px-2 py-0.5 font-mono text-[9px] uppercase tracking-wider text-slate-500 dark:border-white/15 dark:text-slate-400">{signal.source}</span>
                    {signal.engagement > 0 && <span className="flex items-center gap-1 font-mono text-[9px] uppercase tracking-wider text-slate-400"><Zap className="h-3 w-3" />{formatEngagement(signal.engagement)}</span>}
                    {formatDate(signal.postedAt) && <span className="font-mono text-[9px] uppercase tracking-wider text-slate-400">{formatDate(signal.postedAt)}</span>}
                  </span>
                  <span className="mt-1.5 block text-sm font-medium leading-5 text-slate-900 dark:text-slate-100">{signal.title}</span>
                  {signal.snippet && <span className="mt-1 line-clamp-2 block text-xs leading-5 text-slate-500 dark:text-slate-400">{signal.snippet}</span>}
                </span>
                <a href={signal.url} target="_blank" rel="noopener noreferrer" onClick={(event) => event.stopPropagation()} className="mt-0.5 shrink-0 text-slate-400 transition hover:text-slate-900 dark:hover:text-white" aria-label={`Open original ${signal.source} post`}>
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </motion.div>
            })}
          </div>}

        {sorted.length > 0 && <div className="mt-5 flex flex-col items-stretch justify-between gap-3 rounded-2xl border border-acid/30 bg-acid/[0.06] p-4 sm:flex-row sm:items-center">
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-slate-600 dark:text-slate-400">
            {selectedSignals.length === 0 ? 'Select the signals worth solving' : <><span className="text-acid">{selectedSignals.length} selected</span> — forge ideas grounded in them</>}
          </p>
          <button onClick={forge} disabled={selectedSignals.length === 0} className="primary-button !py-2.5 disabled:opacity-50">
            Forge ideas <ArrowRight className="h-4 w-4" />
          </button>
        </div>}
      </motion.div>}
    </AnimatePresence>
  </section>
}
