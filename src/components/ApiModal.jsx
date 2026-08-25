import { KeyRound, X } from 'lucide-react'
import { useEffect, useState } from 'react'

export function ApiModal({ onClose }) {
  const [provider, setProvider] = useState('OpenAI')
  const [key, setKey] = useState(() => sessionStorage.getItem('idea-lab-api-key') || '')
  const save = () => {
    sessionStorage.setItem('idea-lab-api-key', key)
    sessionStorage.setItem('idea-lab-provider', provider)
    onClose()
  }

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/80 p-4 backdrop-blur-md" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
    <div className="w-full max-w-md rounded-3xl border border-white/10 bg-panel p-6 shadow-2xl shadow-black/50 sm:p-8">
      <div className="mb-8 flex items-start justify-between"><div><div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl border border-acid/30 bg-acid/10 text-acid"><KeyRound className="h-5 w-5" /></div><h2 className="font-display text-2xl font-semibold text-white">Connect a model</h2><p className="mt-1 text-sm text-slate-500">Keys stay in this browser session only.</p></div><button className="icon-button" onClick={onClose}><X className="h-4 w-4" /></button></div>
      <label className="mb-5 block"><span className="mb-2 block font-mono text-[10px] uppercase tracking-[0.18em] text-slate-500">Provider</span><select value={provider} onChange={(event) => setProvider(event.target.value)} className="input provider-select"><option>OpenAI</option><option>Anthropic</option><option>Gemini</option></select></label>
      <label className="mb-6 block"><span className="mb-2 block font-mono text-[10px] uppercase tracking-[0.18em] text-slate-500">API key</span><input value={key} onChange={(event) => setKey(event.target.value)} type="password" placeholder="sk-..." className="input" /></label>
      <button onClick={save} className="primary-button w-full">Save connection</button>
    </div>
  </div>
}
