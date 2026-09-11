import { AnimatePresence, motion } from 'framer-motion'
import { AlertTriangle, CheckCircle2, Info, X } from 'lucide-react'
import { FADE } from '../lib/motion'

const ICONS = {
  info: Info,
  success: CheckCircle2,
  error: AlertTriangle,
}

const ACCENTS = {
  info: 'text-cyan',
  success: 'text-acid',
  error: 'text-red-300',
}

// Transient feedback for background events (checkout activation, blueprint
// attachment). Rendered at the top so it never competes with the consent
// banner at the bottom.
export function StatusToast({ toast, onDismiss }) {
  const Icon = ICONS[toast?.type] || Info
  return <div className="pointer-events-none fixed left-0 right-0 top-4 z-[80] flex justify-center px-4">
    <AnimatePresence>
      {toast && <motion.div
        key={toast.id}
        initial={{ opacity: 0, y: -14, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -10, scale: 0.98 }}
        transition={FADE}
        className="pointer-events-auto flex max-w-lg items-center gap-3 rounded-2xl border border-white/10 bg-panel/95 px-4 py-3 shadow-2xl backdrop-blur-xl"
      >
        <Icon className={`h-4 w-4 shrink-0 ${ACCENTS[toast.type] || ACCENTS.info}`} />
        <p className="text-sm leading-5 text-slate-300">{toast.message}</p>
        <button onClick={() => onDismiss?.()} className="ml-1 shrink-0 text-slate-500 transition hover:text-white" aria-label="Dismiss notification"><X className="h-3.5 w-3.5" /></button>
      </motion.div>}
    </AnimatePresence>
  </div>
}
