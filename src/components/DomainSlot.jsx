import { motion } from 'framer-motion'
import { ChevronDown, Terminal } from 'lucide-react'
import { EASE_OUT, EASE_SMOOTH, SPIN_MS } from '../lib/motion'

export function DomainSlot({ label, value, onChange, domains, spinning, accent }) {
  return (
    <div className="domain-slot relative overflow-hidden rounded-[1.5rem] border border-white/10 bg-panel/80 p-5 sm:p-6">
      <div className="scan-line" />
      <div className="mb-8 flex items-center justify-between">
        <span className="font-mono text-[10px] uppercase tracking-[0.28em] text-slate-500">{label}</span>
        <span className={`h-2 w-2 rounded-full ${accent === 'cyan' ? 'bg-cyan shadow-[0_0_14px_#3ee8ff]' : 'bg-violet shadow-[0_0_14px_#9b7bff]'}`} />
      </div>

      <div className="relative mb-5">
        {/*
          No `key` here on purpose. Keying on `value`/`spinning` unmounted this node
          the instant the spin finished, which killed the running animation and
          snapped the new domain in with no transition at all. Driving it purely
          from the `spinning` prop lets the keyframes play through, and App swaps
          the label mid-animation so the settle reveals the new value.

          Also transform/opacity only. The old version animated `filter: blur()`
          on 3xl/4xl display text, which forces a fresh full-quality repaint of the
          glyphs every frame and is the single most expensive thing you can put in
          a 60fps loop.
        */}
        <motion.div
          animate={spinning ? { y: [0, -10, 6, 0], opacity: [1, 0.2, 0.7, 1] } : { y: 0, opacity: 1 }}
          transition={spinning
            ? { duration: SPIN_MS / 1000, ease: EASE_SMOOTH, times: [0, 0.35, 0.7, 1] }
            : { duration: 0.24, ease: EASE_OUT }}
          className="pr-8 font-display text-3xl font-semibold tracking-[-0.05em] text-white sm:text-4xl"
        >
          {value}
        </motion.div>
        <ChevronDown className="absolute right-0 top-2 h-5 w-5 text-slate-600" />
        <select aria-label={`${label} preset`} value={domains.includes(value) ? value : ''} onChange={(event) => onChange(event.target.value)} className="domain-select absolute inset-0 cursor-pointer opacity-0">
          <option value="" disabled>Choose a domain</option>
          {domains.map((domain) => <option key={domain}>{domain}</option>)}
        </select>
      </div>

      <label className="flex items-center gap-2 border-t border-white/10 pt-4 font-mono text-xs text-slate-500">
        <Terminal className="h-3.5 w-3.5" />
        <span className="sr-only">Custom {label}</span>
        <input value={value} onChange={(event) => onChange(event.target.value)} maxLength={32} className="min-w-0 flex-1 bg-transparent text-slate-300 outline-none placeholder:text-slate-700" placeholder="type custom domain..." />
      </label>
    </div>
  )
}
