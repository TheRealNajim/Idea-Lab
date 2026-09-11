import { motion } from 'framer-motion'
import { Brain, CheckCircle2, CircleDollarSign, Clock3, Download, Gauge, Layers, Lightbulb, Presentation, Rocket, ShieldAlert, X, Zap } from 'lucide-react'
import { useEffect } from 'react'
import { ENTER, EASE_SMOOTH, FADE } from '../lib/motion'

const Section = ({ icon: Icon, title, children }) => <section className="detail-section"><div className="mb-3 flex items-center gap-2"><Icon className="h-4 w-4 text-acid" /><h3 className="font-mono text-[10px] uppercase tracking-[0.2em] text-slate-500">{title}</h3></div>{children}</section>

export function IdeaDetailModal({ idea, onClose, onPresent, onExport, onBlueprint }) {
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  // Ideas restored from an older vault payload may be missing enriched fields.
  const scores = idea.scores || {}
  const buildTime = idea.buildTime || 'an unscoped timeline'
  const signals = idea.signals || []

  return <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={FADE} className="overlay fixed inset-0 z-50 overflow-y-auto bg-ink/85 p-4 backdrop-blur-lg" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
    <motion.div initial={{ opacity: 0, y: 18, scale: 0.985 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 10, scale: 0.99 }} transition={ENTER} className="mx-auto my-4 max-w-4xl rounded-3xl border border-white/10 bg-panel p-6 shadow-2xl sm:my-10 sm:p-9">
      <div className="mb-8 flex items-start justify-between gap-5"><div><p className="font-mono text-[10px] uppercase tracking-[0.25em] text-violet">{idea.domainA} x {idea.domainB}</p><h2 className="mt-3 font-display text-4xl font-semibold tracking-[-0.05em] text-white">{idea.title}</h2><p className="mt-2 text-slate-400">{idea.tagline}</p></div><button className="icon-button" onClick={onClose} aria-label="Close dossier"><X className="h-4 w-4" /></button></div>
      {/* scaleX rather than width: a transform stays on the compositor, while
          animating width would relayout each bar on every frame. */}
      <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4">{Object.entries(scores).map(([label, score], index) => <div key={label} className="score-card"><span>{label}</span><strong>{score}</strong><div><motion.i initial={{ scaleX: 0 }} animate={{ scaleX: Math.max(0, Math.min(100, score)) / 100 }} transition={{ duration: 0.5, ease: EASE_SMOOTH, delay: 0.12 + index * 0.05 }} style={{ transformOrigin: 'left' }} /></div></div>)}</div>
      <div className="grid gap-4 md:grid-cols-2">
        <Section icon={Lightbulb} title="Problem / Solution"><p>{idea.pitch}</p></Section>
        <Section icon={CircleDollarSign} title="Business model"><p>{idea.businessModel}. Launch with a free proof-of-value tier, then charge for advanced workflows, exports, and team features.</p></Section>
        <Section icon={CheckCircle2} title="MVP features"><ul>{(idea.mvp || []).map((item) => <li key={item}>{item}</li>)}</ul></Section>
        <Section icon={Rocket} title="Product roadmap"><ol>{(idea.roadmap || []).map((item) => <li key={item}>{item}</li>)}</ol></Section>
        <Section icon={ShieldAlert} title="Risks"><ul>{(idea.risks || []).map((item) => <li key={item}>{item}</li>)}</ul></Section>
        <Section icon={Clock3} title="Build profile"><p>{idea.difficulty} difficulty, scoped for {buildTime.toLowerCase()}. Recommended format: {idea.format}.</p></Section>
      </div>
      {signals.length > 0 && <Section icon={Zap} title={`Grounded in ${signals.length} live signal${signals.length === 1 ? '' : 's'}`}>
        <ul className="space-y-2">{signals.map((signal) => <li key={signal.url || signal.title} className="pl-4">
          <a href={signal.url} target="_blank" rel="noopener noreferrer" className="text-slate-300 underline decoration-acid/40 underline-offset-2 transition hover:text-acid">“{signal.title}”</a>
          <span className="ml-2 font-mono text-[9px] uppercase tracking-wider text-slate-500">{signal.source}{signal.engagement ? ` / ${signal.engagement}` : ''}</span>
        </li>)}</ul>
      </Section>}
      {idea.blueprint && <Section icon={Layers} title="AI blueprint attached">
        <p className="mb-3">{idea.blueprint.architecture?.summary || idea.blueprint.tagline}</p>
        <div className="flex flex-wrap gap-2">{(idea.blueprint.architecture?.stack || []).map((layer) => <span key={`${layer.layer}-${layer.choice}`} className="rounded bg-white/5 px-2 py-1 font-mono text-[10px] text-slate-400">{layer.layer}: {layer.choice}</span>)}</div>
      </Section>}
      <Section icon={Gauge} title="Why now?"><p>{idea.whyNow}</p></Section>
      <div className="mt-6 flex flex-wrap gap-3">
        <button onClick={() => onBlueprint(idea)} className="primary-button">{idea.blueprint ? <Layers className="h-4 w-4" /> : <Brain className="h-4 w-4" />} {idea.blueprint ? 'View blueprint' : 'AI blueprint'}</button>
        <button onClick={onPresent} className="secondary-button"><Presentation className="h-4 w-4" /> Present idea</button>
        <button onClick={onExport} className="secondary-button"><Download className="h-4 w-4" /> Export markdown</button>
      </div>
    </motion.div>
  </motion.div>
}
