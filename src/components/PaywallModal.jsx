import { motion } from 'framer-motion'
import { Brain, CreditCard, KeyRound, Loader2, Radar, Sparkles, X } from 'lucide-react'
import { useState } from 'react'
import { createCheckoutSession } from '../lib/api'
import { ENTER, FADE } from '../lib/motion'

const REASON_COPY = {
  scan: 'You have used your free signal scans.',
  ai: 'You have used your free AI blueprints.',
  account: 'Unlock the full lab.',
}

const PRO_FEATURES = [
  { icon: Radar, title: 'Unlimited signal scans', text: 'Mine Reddit, Hacker News, Stack Overflow, Medium — plus YouTube and X when their keys are configured.' },
  { icon: Brain, title: 'Unlimited AI blueprints', text: 'Brainstorm with the architect: full architecture, data model, and build plan before you write code.' },
  { icon: Sparkles, title: 'Everything else, unmetered', text: 'All local generation and the vault stay free forever. Pro only prices the metered external calls.' },
]

// Shown when a trial runs out (or a user opts in). Pro is a Stripe
// subscription; AI blueprints can alternatively run on the user's own provider
// key for free, which the modal nudges towards.
export function PaywallModal({ onClose, reason, auth, onUseOwnKey }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const upgrade = async () => {
    setLoading(true)
    setError(null)
    try {
      const token = await auth.getToken()
      const { url } = await createCheckoutSession(token)
      window.location.href = url
    } catch (caught) {
      setError(caught.message)
      setLoading(false)
    }
  }

  return <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={FADE} className="overlay fixed inset-0 z-50 flex items-center justify-center bg-ink/80 p-4 backdrop-blur-md" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
    <motion.div initial={{ opacity: 0, y: 16, scale: 0.985 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 8, scale: 0.99 }} transition={ENTER} className="w-full max-w-md rounded-3xl border border-white/10 bg-panel p-6 shadow-2xl shadow-black/50 sm:p-8">
      <div className="mb-6 flex items-start justify-between">
        <div>
          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl border border-acid/30 bg-acid/10 text-acid"><Sparkles className="h-5 w-5" /></div>
          <h2 className="font-display text-2xl font-semibold text-white">Idea Lab Pro</h2>
          <p className="mt-1 text-sm text-slate-500">{REASON_COPY[reason] || REASON_COPY.account}</p>
        </div>
        <button className="icon-button" onClick={onClose} aria-label="Close upgrade dialog"><X className="h-4 w-4" /></button>
      </div>

      <ul className="mb-6 space-y-3">
        {PRO_FEATURES.map(({ icon: Icon, title, text }) => <li key={title} className="flex gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
          <Icon className="mt-0.5 h-4 w-4 shrink-0 text-acid" />
          <div><p className="text-sm font-medium text-white">{title}</p><p className="mt-1 text-xs leading-5 text-slate-400">{text}</p></div>
        </li>)}
      </ul>

      <button onClick={upgrade} disabled={loading} className="primary-button w-full disabled:opacity-50">
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CreditCard className="h-4 w-4" />}
        {loading ? 'Opening checkout…' : 'Upgrade to Pro'}
      </button>
      {error && <p className="mt-3 font-mono text-[10px] leading-4 text-red-300">{error}</p>}

      <p className="mt-4 flex items-center justify-center gap-1.5 font-mono text-[10px] leading-4 text-slate-600"><CreditCard className="h-3 w-3" /> Secure Stripe checkout. Cancel anytime.</p>

      {reason === 'ai' && <button onClick={onUseOwnKey} className="mt-4 flex w-full items-center gap-3 rounded-2xl border border-cyan/25 bg-cyan/[0.06] p-4 text-left transition hover:border-cyan/40">
        <KeyRound className="h-4 w-4 shrink-0 text-cyan" />
        <span className="text-xs leading-5 text-slate-400">Or use <b className="text-slate-200">your own model key</b> in Model setup — blueprints then run free, straight from your browser.</span>
      </button>}
    </motion.div>
  </motion.div>
}
