import { motion } from 'framer-motion'
import { KeyRound, Loader2, Mail, Send, ShieldCheck, X } from 'lucide-react'
import { useState } from 'react'
import { authAvailable } from '../lib/supabase'
import { ENTER, FADE } from '../lib/motion'

// Magic-link sign in. No passwords, no OAuth apps to configure — a Supabase
// project with its default email sender is enough to run the whole
// trial-and-billing flow.
export function AuthModal({ onClose, reason, sendMagicLink }) {
  const [email, setEmail] = useState('')
  const [phase, setPhase] = useState('idle') // idle | sending | sent | error
  const [error, setError] = useState(null)

  const submit = async (event) => {
    event.preventDefault()
    const clean = email.trim()
    if (!clean.includes('@') || phase === 'sending') return
    setPhase('sending')
    setError(null)
    const { error: sendError } = await sendMagicLink(clean)
    if (sendError) {
      setError(sendError)
      setPhase('error')
      return
    }
    setPhase('sent')
  }

  return <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={FADE} className="overlay fixed inset-0 z-50 flex items-center justify-center bg-ink/80 p-4 backdrop-blur-md" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
    <motion.div initial={{ opacity: 0, y: 16, scale: 0.985 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 8, scale: 0.99 }} transition={ENTER} className="w-full max-w-md rounded-3xl border border-white/10 bg-panel p-6 shadow-2xl shadow-black/50 sm:p-8">
      <div className="mb-6 flex items-start justify-between">
        <div>
          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl border border-acid/30 bg-acid/10 text-acid"><Mail className="h-5 w-5" /></div>
          <h2 className="font-display text-2xl font-semibold text-white">Get your free account</h2>
          <p className="mt-1 text-sm text-slate-500">One link, no password.</p>
        </div>
        <button className="icon-button" onClick={onClose} aria-label="Close sign in"><X className="h-4 w-4" /></button>
      </div>

      {!authAvailable
        ? <div className="flex gap-3 rounded-2xl border border-amber-400/25 bg-amber-400/[0.07] p-4"><KeyRound className="mt-0.5 h-4 w-4 shrink-0 text-amber-300" /><p className="text-xs leading-5 text-slate-400">Accounts need Supabase. Set <b className="text-slate-200">VITE_SUPABASE_URL</b> and <b className="text-slate-200">VITE_SUPABASE_ANON_KEY</b>, then deploy — see DEPLOYMENT.md.</p></div>
        : phase === 'sent'
          ? <div className="rounded-2xl border border-acid/25 bg-acid/[0.07] p-5 text-center">
            <ShieldCheck className="mx-auto mb-3 h-8 w-8 text-acid" />
            <p className="font-display text-lg font-semibold text-white">Check your inbox</p>
            <p className="mt-2 text-sm leading-6 text-slate-400">A sign-in link is on its way to <b className="text-slate-200">{email.trim()}</b>. It opens Idea Lab signed in, ready to spend your trial.</p>
            <button onClick={onClose} className="secondary-button mt-4">Back to the lab</button>
          </div>
          : <form onSubmit={submit}>
            {reason && <p className="mb-4 flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5 font-mono text-[10px] leading-4 text-slate-400">{reason}</p>}
            <label className="mb-5 block">
              <span className="mb-2 block font-mono text-[10px] uppercase tracking-[0.18em] text-slate-500">Email address</span>
              <input
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
                className="input"
                autoFocus
              />
            </label>
            <button type="submit" disabled={phase === 'sending' || !email.trim()} className="primary-button w-full disabled:opacity-50">
              {phase === 'sending' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              {phase === 'sending' ? 'Sending link' : 'Send magic link'}
            </button>
            {error && <p className="mt-3 font-mono text-[10px] leading-4 text-red-300">{error}</p>}
            <p className="mt-5 font-mono text-[10px] leading-5 text-slate-600">Free accounts include 5 signal scans + 3 AI blueprints. No card required. Sign-in links open this same app in your browser.</p>
          </form>}
    </motion.div>
  </motion.div>
}
