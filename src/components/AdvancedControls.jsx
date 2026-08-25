import { SlidersHorizontal } from 'lucide-react'
import { buildTimes, difficulties, formats } from '../data/mashups'

const SelectControl = ({ label, value, onChange, options }) => <label>
  <span className="control-label">{label}</span>
  <select value={value} onChange={(event) => onChange(event.target.value)} className="control-input provider-select">
    {options.map((option) => <option key={option}>{option}</option>)}
  </select>
</label>

export function AdvancedControls({ settings, onChange }) {
  const update = (key, value) => onChange({ ...settings, [key]: value })

  return <div className="mt-5 rounded-2xl border border-slate-200 bg-white/60 p-4 dark:border-white/10 dark:bg-white/[0.025] sm:p-5">
    <div className="mb-4 flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.2em] text-slate-500"><SlidersHorizontal className="h-3.5 w-3.5 text-acid" /> Experiment parameters</div>
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <SelectControl label="Output format" value={settings.format} onChange={(value) => update('format', value)} options={formats} />
      <SelectControl label="Difficulty" value={settings.difficulty} onChange={(value) => update('difficulty', value)} options={difficulties} />
      <SelectControl label="Build time" value={settings.buildTime} onChange={(value) => update('buildTime', value)} options={buildTimes} />
      <label><span className="control-label">Target audience</span><input value={settings.audience} onChange={(event) => update('audience', event.target.value)} className="control-input" placeholder="e.g. students" /></label>
    </div>
    <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_220px]">
      <label><span className="control-label">Constraints</span><input value={settings.constraints} onChange={(event) => update('constraints', event.target.value)} className="control-input" placeholder="No blockchain, privacy-first, under $100..." /></label>
      <label><span className="control-label">Practicality <b className="text-acid">{settings.practicality}%</b></span><input type="range" min="0" max="100" value={settings.practicality} onChange={(event) => update('practicality', Number(event.target.value))} className="mt-3 w-full accent-[#b8f34a]" /></label>
    </div>
  </div>
}
