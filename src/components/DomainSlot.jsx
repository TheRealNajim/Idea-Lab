import { motion } from 'framer-motion'
import { ChevronDown, Terminal } from 'lucide-react'

export function DomainSlot({ label, value, onChange, domains, spinning, accent }) {
  return (
    <div className="domain-slot relative overflow-hidden rounded-[1.5rem] border border-white/10 bg-panel/80 p-5 sm:p-6">
      <div className="scan-line" />
      <div className="mb-8 flex items-center justify-between">
        <span className="font-mono text-[10px] uppercase tracking-[0.28em] text-slate-500">{label}</span>
        <span className={`h-2 w-2 rounded-full ${accent === 'cyan' ? 'bg-cyan shadow-[0_0_14px_#3ee8ff]' : 'bg-violet shadow-[0_0_14px_#9b7bff]'}`} />
      </div>

      <div className="relative mb-5">
        <motion.div
          key={spinning ? `spin-${value}` : value}
          animate={spinning ? { y: [0, -12, 12, 0], opacity: [1, 0.25, 0.25, 1], filter: ['blur(0px)', 'blur(5px)', 'blur(2px)', 'blur(0px)'] } : { y: 0 }}
          transition={{ duration: 0.28 }}
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
