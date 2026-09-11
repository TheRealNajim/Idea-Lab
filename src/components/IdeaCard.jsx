import { motion } from 'framer-motion'
import { Bookmark, Check, Copy, Eye, GitCompareArrows, Share2, Sparkles, ThumbsDown, ThumbsUp, Users, Zap } from 'lucide-react'
import { EASE_OUT, EASE_SMOOTH, SPRING_HOVER, SPRING_LAYOUT } from '../lib/motion'

export function IdeaCard({ idea, index, saved, onSave, onCopy, copied, copyFailed, onInspect, onRefine, onCompare, compared, rating, onRate, onShare }) {
  const share = async () => {
    const text = `${idea.title}: ${idea.tagline}`
    try {
      if (navigator.share) {
        await navigator.share({ title: idea.title, text })
      } else {
        await navigator.clipboard.writeText(text)
      }
      onShare?.(idea)
    } catch (err) {
      // AbortError just means the user dismissed the share sheet.
      if (err?.name !== 'AbortError') {
        try {
          await navigator.clipboard.writeText(text)
          onShare?.(idea)
        } catch {}
      }
    }
  }

  return (
    <motion.article
      // "position" instead of a full layout animation: a full layout animation
      // interpolates width/height and visibly stretches the text and the 1.5rem
      // radius while the grid reflows. Position-only keeps the box rigid.
      layout="position"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 8 }}
      // The lift lives here, not in CSS: framer-motion owns this element's inline
      // transform, so a `.idea-card:hover { transform }` rule can never win.
      whileHover={{ y: -4, transition: SPRING_HOVER }}
      transition={{
        layout: SPRING_LAYOUT,
        // Only the fade is staggered. Putting the delay on `y` too would also
        // delay the hover-out, making the card feel stuck under the cursor.
        opacity: { duration: 0.3, ease: EASE_OUT, delay: Math.min(index, 5) * 0.03 },
        y: { duration: 0.34, ease: EASE_SMOOTH },
      }}
      className="idea-card group relative flex h-full flex-col overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-panel/80 dark:shadow-none sm:p-6"
    >
      <div className="absolute right-0 top-0 font-mono text-7xl font-bold leading-none text-slate-100 dark:text-white/[0.025]">{String(index + 1).padStart(2, '0')}</div>
      <div className="relative mb-8 flex items-start justify-between">
        <div className="flex flex-wrap gap-2">
          <span className="pill">{idea.domainA}</span>
          <span className="mt-1 font-mono text-xs text-slate-400">×</span>
          <span className="pill">{idea.domainB}</span>
        </div>
        <button onClick={() => onSave(idea)} className={`icon-button ${saved ? 'border-acid/40 text-acid' : ''}`} aria-label={saved ? 'Remove from saved vault' : 'Save to vault'}>
          <Bookmark className={`h-4 w-4 ${saved ? 'fill-current' : ''}`} />
        </button>
      </div>

      <div className="relative mb-6">
        <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.2em] text-violet">{idea.type}</p>
        <h3 className="font-display text-2xl font-semibold tracking-[-0.04em] text-slate-950 dark:text-white sm:text-[1.75rem]">{idea.title}</h3>
        <p className="mt-2 text-sm font-medium text-slate-500 dark:text-slate-400">{idea.tagline}</p>
        {(idea.signals || []).length > 0 && <p className="mt-2 flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-wider text-acid">
          <Zap className="h-3 w-3" /> {idea.signals.length} live signal{idea.signals.length === 1 ? '' : 's'} / {[...new Set(idea.signals.map((signal) => signal.source))].join(', ')}
        </p>}
      </div>

      <p className="mb-6 text-sm leading-6 text-slate-600 dark:text-slate-400">{idea.pitch}</p>

      <div className="mb-6 flex items-start gap-3 border-y border-slate-200 py-4 dark:border-white/10">
        <Users className="mt-0.5 h-4 w-4 shrink-0 text-cyan" />
        <div>
          <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-slate-400">Built for</p>
          <p className="mt-1 text-xs text-slate-700 dark:text-slate-300">{idea.audience}</p>
        </div>
      </div>

      <div className="mb-6 flex flex-wrap gap-2">
        {(idea.stack || []).map((item) => <span key={item} className="rounded bg-slate-100 px-2 py-1 font-mono text-[10px] text-slate-500 dark:bg-white/5 dark:text-slate-400">{item}</span>)}
      </div>

      <div className="mt-auto rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-black/20">
        <div className="mb-3 flex items-center justify-between">
          <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-slate-400">Vibecode prompt</span>
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-acid" />
        </div>
        <p className="line-clamp-3 font-mono text-[11px] leading-5 text-slate-500 dark:text-slate-500">{idea.prompt}</p>
      </div>

      <div className="mt-4 flex gap-2">
        <button onClick={() => onInspect(idea)} className="action-button flex-1"><Eye className="h-3.5 w-3.5" /> Explore dossier</button>
        <button onClick={() => onRefine(idea, 'practical')} className="action-button px-3" aria-label="Make idea more practical"><Sparkles className="h-3.5 w-3.5" /></button>
        <button onClick={() => onCompare(idea)} className={`action-button px-3 ${compared ? 'border-acid/50 text-acid' : ''}`} aria-label="Compare idea"><GitCompareArrows className="h-3.5 w-3.5" /></button>
      </div>
      <div className="mt-2 flex gap-2">
        <button onClick={() => onCopy(idea)} className={`action-button flex-1 ${copyFailed ? 'border-red-400/50 text-red-300' : ''}`} aria-live="polite">
          {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
          {copyFailed ? 'Copy blocked' : copied ? 'Copied' : 'Copy prompt'}
        </button>
        <button onClick={share} className="action-button px-3" aria-label="Share idea"><Share2 className="h-3.5 w-3.5" /></button>
      </div>
      <div className="mt-4 flex items-center justify-between border-t border-slate-200 pt-3 dark:border-white/10"><span className="font-mono text-[9px] uppercase tracking-wider text-slate-500">Useful?</span><div className="flex gap-1"><button onClick={() => onRate(idea, 1)} className={`feedback-button ${rating === 'helpful' ? 'selected' : ''}`} aria-label="Mark idea helpful"><ThumbsUp className="h-3 w-3" /></button><button onClick={() => onRate(idea, -1)} className={`feedback-button ${rating === 'not-helpful' ? 'selected negative' : ''}`} aria-label="Mark idea not helpful"><ThumbsDown className="h-3 w-3" /></button></div></div>
    </motion.article>
  )
}
