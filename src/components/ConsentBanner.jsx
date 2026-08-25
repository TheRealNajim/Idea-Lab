import { ShieldCheck, X } from 'lucide-react'
import { motion } from 'framer-motion'
import { EXIT, SPRING_BANNER } from '../lib/motion'

export function ConsentBanner({ onChoice }) {
  return <motion.aside initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 12, transition: EXIT }} transition={SPRING_BANNER} className="fixed bottom-4 left-4 right-4 z-[70] mx-auto max-w-2xl rounded-2xl border border-white/10 bg-panel/95 p-5 shadow-2xl backdrop-blur-xl sm:bottom-6 sm:p-6">
    <div className="flex items-start gap-4"><div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-acid/30 bg-acid/10 text-acid"><ShieldCheck className="h-5 w-5" /></div><div className="flex-1"><h2 className="font-display text-lg font-semibold text-white">Help Idea Lab improve</h2><p className="mt-1 text-sm leading-6 text-slate-400">Allow anonymous usage events such as generated categories, saves, copies, and ratings. We never send API keys, prompts, constraints, or personal information.</p><div className="mt-4 flex flex-wrap gap-2"><button onClick={() => onChoice('accepted')} className="primary-button">Allow anonymous analytics</button><button onClick={() => onChoice('declined')} className="secondary-button">No thanks</button></div></div><button onClick={() => onChoice('declined')} className="text-slate-500 hover:text-white" aria-label="Decline analytics"><X className="h-4 w-4" /></button></div>
  </motion.aside>
}
