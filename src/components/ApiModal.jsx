import { Info, KeyRound, X } from 'lucide-react'
import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { ENTER, FADE } from '../lib/motion'
import { AI_PROVIDERS } from '../lib/ai'

// Bring-your-own-key preferences for the AI architect. Keys live in
// sessionStorage only (cleared with the tab) and are used exclusively for
// browser-direct calls to the chosen provider — they are never sent to the
// Idea Lab server. Server-backed AI is metered separately via trial credits.
export function ApiModal({ onClose }) {
  const [provider, setProvider] = useState(() => sessionStorage.getItem('idea-lab-provider') || 'OpenAI')
  const [key, setKey] = useState(() => sessionStorage.getItem('idea-lab-api-key') || '')
  const hasKey = key.trim().length > 0

  const save = () => {
    try {
      sessionStorage.setItem('idea-lab-provider', provider)
      if (hasKey) sessionStorage.setItem('idea-lab-api-key', key.trim())
      else sessionStorage.removeItem('idea-lab-api-key')
    } catch {
      // Session storage unavailable; the preference simply won't persist.
    }
    onClose()
  }

  const clear = () => {
    try {
      sessionStorage.removeItem('idea-lab-api-key')
    } catch {}
    setKey('')
  }

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  return <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={FADE} className="overlay fixed inset-0 z-50 flex items-center justify-center bg-ink/80 p-4 backdrop-blur-md" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
    <motion.div initial={{ opacity: 0, y: 16, scale: 0.985 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 8, scale: 0.99 }} transition={ENTER} className="w-full max-w-md rounded-3xl border border-white/10 bg-panel p-6 shadow-2xl shadow-black/50 sm:p-8">
      <div className="mb-6 flex items-start justify-between">
        <div>
          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl border border-acid/30 bg-acid/10 text-acid"><KeyRound className="h-5 w-5" /></div>
          <h2 className="font-display text-2xl font-semibold text-white">Model setup</h2>
          <p className="mt-1 text-sm text-slate-500">Bring your own key — blueprints run free.</p>
        </div>
        <button className="icon-button" onClick={onClose} aria-label="Close model setup"><X className="h-4 w-4" /></button>
      </div>

      <div className="mb-6 flex gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-acid" />
        <p className="text-xs leading-5 text-slate-400">
          With your own key, <strong className="font-semibold text-slate-200">AI blueprints call the provider straight from this browser</strong> — the key is stored for this tab only and never reaches the Idea Lab server. Prefer not to paste keys? The server model works too, on your free trial credits or Pro.
        </p>
      </div>

      <label className="mb-5 block">
        <span className="mb-2 block font-mono text-[10px] uppercase tracking-[0.18em] text-slate-500">Preferred provider</span>
        <select value={provider} onChange={(event) => setProvider(event.target.value)} className="input provider-select">{AI_PROVIDERS.map((name) => <option key={name}>{name}</option>)}</select>
      </label>

      <label className="mb-2 block">
        <span className="mb-2 block font-mono text-[10px] uppercase tracking-[0.18em] text-slate-500">API key <b className="text-slate-600">optional</b></span>
        <input value={key} onChange={(event) => setKey(event.target.value)} type="password" autoComplete="off" placeholder="sk-… / paste your provider key" className="input" />
      </label>
      <p className="mb-6 font-mono text-[10px] leading-4 text-slate-600">Cleared when you close the tab. Used only for blueprint requests to {provider}, direct from this browser.</p>

      <div className="flex gap-2">
        <button onClick={save} className="primary-button flex-1">Save preference</button>
        {hasKey && <button onClick={clear} className="secondary-button">Clear key</button>}
      </div>
    </motion.div>
  </motion.div>
}
