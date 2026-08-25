import { Info, KeyRound, X } from 'lucide-react'
import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { ENTER, FADE } from '../lib/motion'

// This modal intentionally performs no network calls. Idea generation is fully
// local (see src/data/mashups.js). The provider/key are stored for a future
// server-proxied integration, so the copy below must not imply live model access.
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
          <p className="mt-1 text-sm text-slate-500">Saved for this browser session only.</p>
        </div>
        <button className="icon-button" onClick={onClose} aria-label="Close model setup"><X className="h-4 w-4" /></button>
      </div>

      <div className="mb-6 flex gap-3 rounded-2xl border border-cyan/25 bg-cyan/[0.07] p-4">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-cyan" />
        <p className="text-xs leading-5 text-slate-400">
          Idea generation currently runs <strong className="font-semibold text-slate-200">fully offline</strong> from the local archive — no request is ever sent to a model provider. This preference is stored for an upcoming server-proxied integration.
        </p>
      </div>

      <label className="mb-5 block">
        <span className="mb-2 block font-mono text-[10px] uppercase tracking-[0.18em] text-slate-500">Preferred provider</span>
        <select value={provider} onChange={(event) => setProvider(event.target.value)} className="input provider-select"><option>OpenAI</option><option>Anthropic</option><option>Gemini</option></select>
      </label>

      <label className="mb-2 block">
        <span className="mb-2 block font-mono text-[10px] uppercase tracking-[0.18em] text-slate-500">API key <b className="text-slate-600">optional</b></span>
        <input value={key} onChange={(event) => setKey(event.target.value)} type="password" autoComplete="off" placeholder="Leave empty until live generation ships" className="input" />
      </label>
      <p className="mb-6 font-mono text-[10px] leading-4 text-slate-600">Cleared when you close the tab. Never sent anywhere by this build.</p>

      <div className="flex gap-2">
        <button onClick={save} className="primary-button flex-1">Save preference</button>
        {hasKey && <button onClick={clear} className="secondary-button">Clear key</button>}
      </div>
    </motion.div>
  </motion.div>
}
