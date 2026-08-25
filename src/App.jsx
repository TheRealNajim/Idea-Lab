import { AnimatePresence, motion } from 'framer-motion'
import { Bookmark, ChevronRight, Cpu, Dices, FlaskConical, KeyRound, Layers3, Moon, RotateCw, Search, Sparkles, Sun, X } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { createCustomMashups, domains, filters, mashups } from './data/mashups'
import { useLocalStorage } from './hooks/useLocalStorage'
import { ApiModal } from './components/ApiModal'
import { DomainSlot } from './components/DomainSlot'
import { IdeaCard } from './components/IdeaCard'

function App() {
  const [domainA, setDomainA] = useState('Cybersecurity')
  const [domainB, setDomainB] = useState('Cooking')
  const [activeFilter, setActiveFilter] = useState('All')
  const [ideas, setIdeas] = useState(mashups)
  const [saved, setSaved] = useLocalStorage('idea-lab-saved', [])
  const [dark, setDark] = useLocalStorage('idea-lab-dark', true)
  const [spinning, setSpinning] = useState(false)
  const [vaultOpen, setVaultOpen] = useState(false)
  const [apiOpen, setApiOpen] = useState(false)
  const [copied, setCopied] = useState(null)
  const [query, setQuery] = useState('')

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark)
  }, [dark])

  const visibleIdeas = useMemo(() => ideas.filter((idea) => (activeFilter === 'All' || idea.type === activeFilter) && `${idea.title} ${idea.domainA} ${idea.domainB} ${idea.tagline}`.toLowerCase().includes(query.toLowerCase())), [activeFilter, ideas, query])

  const saveIdea = (idea) => setSaved((items) => items.some((item) => item.id === idea.id) ? items.filter((item) => item.id !== idea.id) : [idea, ...items])
  const copyPrompt = async (idea) => { await navigator.clipboard.writeText(idea.prompt); setCopied(idea.id); setTimeout(() => setCopied(null), 1400) }
  const spin = () => {
    setSpinning(true)
    const choices = domains.filter((item) => item !== domainA && item !== domainB)
    setTimeout(() => { setDomainA(choices[Math.floor(Math.random() * choices.length)]); setDomainB(choices[Math.floor(Math.random() * choices.length)]); setSpinning(false) }, 500)
  }
  const generate = () => { setIdeas((current) => [...createCustomMashups(domainA || 'Unknown', domainB || 'Unknown'), ...current]); setActiveFilter('All'); window.scrollTo({ top: 500, behavior: 'smooth' }) }

  return <div className="min-h-screen bg-[#f5f7f2] text-slate-900 transition-colors dark:bg-ink dark:text-white">
    <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-[#f5f7f2]/85 backdrop-blur-xl dark:border-white/10 dark:bg-ink/80">
      <div className="mx-auto flex max-w-[1440px] items-center justify-between px-5 py-4 sm:px-8 lg:px-12">
        <div className="flex items-center gap-3"><div className="logo-mark"><FlaskConical className="h-4 w-4" /></div><div><p className="font-mono text-[9px] uppercase tracking-[0.28em] text-slate-500">Idea Lab</p><h1 className="font-display text-sm font-semibold tracking-tight text-slate-900 dark:text-white">// Mashup Generator</h1></div></div>
        <div className="flex items-center gap-2 sm:gap-5"><span className="hidden font-mono text-[10px] uppercase tracking-[0.2em] text-slate-500 sm:block"><span className="mr-2 inline-block h-1.5 w-1.5 rounded-full bg-acid shadow-[0_0_10px_#b8f34a]" />System online</span><button className="icon-button" onClick={() => setDark(!dark)} aria-label="Toggle theme">{dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}</button><button onClick={() => setVaultOpen(true)} className="vault-button"><Bookmark className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Vault</span><b>{saved.length}</b></button></div>
      </div>
    </header>

    <main className="mx-auto max-w-[1440px] px-5 py-10 sm:px-8 sm:py-14 lg:px-12">
      <section className="mb-14 grid items-end gap-8 lg:grid-cols-[1fr_320px]"><div><p className="mb-5 flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.3em] text-acid"><span className="h-px w-8 bg-acid" />Experiment 004 / Cross-pollination engine</p><h2 className="max-w-4xl font-display text-5xl font-semibold leading-[0.95] tracking-[-0.08em] text-slate-950 dark:text-white sm:text-7xl lg:text-[6.5rem]">Make the <span className="text-acid [text-shadow:0_0_28px_rgba(184,243,74,.28)]">unlikely</span><br />feel inevitable.</h2></div><div className="border-l border-slate-300 pl-5 dark:border-white/15"><p className="mb-3 font-mono text-[10px] uppercase tracking-[0.2em] text-slate-500">The brief</p><p className="text-sm leading-6 text-slate-600 dark:text-slate-400">Two unrelated domains. One sharp angle. Generate buildable ideas for the space between what already exists.</p></div></section>

      <section className="mb-16"><div className="mb-4 flex items-end justify-between"><div><p className="font-mono text-[10px] uppercase tracking-[0.25em] text-slate-500">01 / Select your collision</p><p className="mt-2 text-xs text-slate-500">Pull two worlds into the same orbit.</p></div><button onClick={() => setApiOpen(true)} className="secondary-button"><KeyRound className="h-3.5 w-3.5" /> <span className="hidden sm:inline">API settings</span></button></div><div className="grid items-center gap-3 lg:grid-cols-[1fr_76px_1fr]"><DomainSlot label="Domain A" value={domainA} onChange={setDomainA} domains={domains} spinning={spinning} accent="cyan" /><div className="order-first flex justify-center lg:order-none"><button onClick={spin} className="spin-button" aria-label="Randomize domains"><RotateCw className={`h-5 w-5 ${spinning ? 'animate-spin' : ''}`} /><span className="sr-only">Spin</span></button></div><DomainSlot label="Domain B" value={domainB} onChange={setDomainB} domains={domains} spinning={spinning} accent="violet" /></div><div className="mt-5 flex flex-col items-stretch justify-between gap-4 sm:flex-row sm:items-center"><p className="font-mono text-[10px] uppercase tracking-[0.18em] text-slate-500"><span className="text-acid">Ready //</span> {ideas.length} patterns in the archive</p><button onClick={generate} className="primary-button"><Sparkles className="h-4 w-4" /> Generate ideas <ChevronRight className="h-4 w-4" /></button></div></section>

      <section><div className="mb-6 flex flex-col justify-between gap-5 border-b border-slate-200 pb-5 dark:border-white/10 sm:flex-row sm:items-end"><div><p className="font-mono text-[10px] uppercase tracking-[0.25em] text-slate-500">02 / The output</p><h3 className="mt-2 font-display text-3xl font-semibold tracking-[-0.05em]">Fresh from the lab <span className="font-mono text-sm font-normal text-slate-500">({visibleIdeas.length})</span></h3></div><div className="flex items-center gap-3"><div className="relative hidden sm:block"><Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-500" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Filter archive" className="search-input" /></div><div className="flex flex-wrap gap-1 rounded-xl border border-slate-200 bg-white p-1 dark:border-white/10 dark:bg-white/5">{filters.map((filter) => <button key={filter} onClick={() => setActiveFilter(filter)} className={`filter-chip ${activeFilter === filter ? 'active' : ''}`}>{filter}</button>)}</div></div></div><div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3"><AnimatePresence mode="popLayout">{visibleIdeas.map((idea, index) => <IdeaCard key={idea.id} idea={idea} index={index} saved={saved.some((item) => item.id === idea.id)} onSave={saveIdea} onCopy={copyPrompt} copied={copied === idea.id} />)}</AnimatePresence></div>{visibleIdeas.length === 0 && <div className="rounded-3xl border border-dashed border-slate-300 py-20 text-center dark:border-white/15"><Dices className="mx-auto mb-4 h-8 w-8 text-slate-500" /><p className="font-display text-xl">No patterns found.</p><p className="mt-2 text-sm text-slate-500">Try another filter or generate a fresh collision.</p></div>}</section>
    </main>

    <footer className="border-t border-slate-200 px-5 py-8 dark:border-white/10 sm:px-8 lg:px-12"><div className="mx-auto flex max-w-[1440px] items-center justify-between font-mono text-[10px] uppercase tracking-[0.2em] text-slate-500"><span>Idea Lab / v0.4.1</span><span className="hidden sm:block">Make weird useful</span><span><Cpu className="mr-1 inline h-3 w-3" /> Local archive</span></div></footer>

    <AnimatePresence>{vaultOpen && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-40 bg-ink/60 backdrop-blur-sm" onMouseDown={(event) => event.target === event.currentTarget && setVaultOpen(false)}><motion.aside initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', damping: 28 }} className="absolute right-0 top-0 h-full w-full max-w-md overflow-y-auto border-l border-white/10 bg-panel p-6 shadow-2xl sm:p-8"><div className="mb-10 flex items-center justify-between"><div><p className="font-mono text-[10px] uppercase tracking-[0.2em] text-acid">Saved archive</p><h2 className="mt-2 font-display text-3xl font-semibold text-white">Your vault</h2></div><button className="icon-button" onClick={() => setVaultOpen(false)}><X className="h-4 w-4" /></button></div>{saved.length === 0 ? <div className="py-16 text-center text-sm text-slate-500">Bookmark ideas to build a personal reference set.</div> : <div className="space-y-3">{saved.map((idea) => <div key={idea.id} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4"><div className="flex items-start justify-between"><div><p className="font-mono text-[9px] uppercase tracking-widest text-violet">{idea.type}</p><h3 className="mt-1 font-display text-lg font-semibold text-white">{idea.title}</h3></div><button onClick={() => saveIdea(idea)} className="text-slate-500 transition hover:text-acid"><Bookmark className="h-4 w-4 fill-current" /></button></div><p className="mt-2 text-xs leading-5 text-slate-500">{idea.tagline}</p></div>)}</div>}</motion.aside></motion.div>}</AnimatePresence>
    {apiOpen && <ApiModal onClose={() => setApiOpen(false)} />}
  </div>
}

export default App
