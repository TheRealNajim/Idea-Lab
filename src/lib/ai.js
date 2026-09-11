// Shared AI plumbing: prompt construction, provider adapters, and blueprint
// parsing/normalisation. Imported by BOTH the browser (bring-your-own-key
// blueprints, key stored only in sessionStorage) and the /api/ai function
// (server key + credit metering), so it must stay environment-agnostic: no
// import.meta.env, no browser or node globals beyond fetch.

export const AI_PROVIDERS = ['OpenAI', 'Anthropic', 'Gemini']

export const DEFAULT_MODELS = {
  openai: 'gpt-4o-mini',
  anthropic: 'claude-sonnet-4-20250514',
  gemini: 'gemini-2.0-flash',
}

export function defaultModelFor(provider) {
  return DEFAULT_MODELS[String(provider || '').toLowerCase()] || DEFAULT_MODELS.openai
}

// ---------------------------------------------------------------------------
// Prompt
// ---------------------------------------------------------------------------

const BLUEPRINT_SCHEMA = `{
  "name": "short product name",
  "tagline": "one-line positioning",
  "problemStatement": "2-3 sentences grounded in the supplied signals",
  "targetUsers": "who feels this pain, concretely",
  "solution": "2-3 sentences describing the product response",
  "mvpFeatures": ["5 concrete buildable features"],
  "architecture": {
    "summary": "2-3 sentence architecture rationale",
    "stack": [{ "layer": "e.g. Frontend", "choice": "e.g. React + Vite", "why": "one sentence" }],
    "dataFlow": ["4-7 numbered steps from user action to result"],
    "dataModel": [{ "entity": "e.g. User", "fields": "id, email, ...", "notes": "one sentence" }],
    "apis": [{ "endpoint": "POST /api/...", "purpose": "one sentence" }]
  },
  "buildPlan": [{ "phase": "e.g. Weekend 1", "goal": "one sentence", "tasks": ["2-4 tasks"] }],
  "risks": ["3 honest risks"],
  "openQuestions": ["3 decisions the builder should make"]
}`

export function buildBlueprintPrompt({ idea = {}, signals = [], notes = '' }) {
  const system = [
    'You are a pragmatic senior product architect. You turn rough concepts into buildable blueprints.',
    'Ground every choice in the real-world signals supplied by the user when they exist; when they do not, stay generic and honest.',
    'Prefer boring, proven technology over exotic stacks, and scope the MVP so one motivated builder can ship it.',
    'Respond with STRICT JSON only — no markdown fences, no commentary — matching this exact shape:',
    BLUEPRINT_SCHEMA,
  ].join(' ')

  const lines = []
  if (idea.domainA || idea.domainB) {
    lines.push(`Domain collision: ${[idea.domainA, idea.domainB, idea.domainC].filter(Boolean).join(' x ')}`)
  }
  if (idea.title) lines.push(`Working title: ${idea.title}`)
  if (idea.tagline) lines.push(`One-liner: ${idea.tagline}`)
  if (idea.pitch) lines.push(`Pitch: ${idea.pitch}`)
  if (idea.audience) lines.push(`Intended audience: ${idea.audience}`)
  if (idea.type) lines.push(`Product type: ${idea.type}`)

  if (signals.length > 0) {
    lines.push('')
    lines.push('Real-world signals (problems people actually reported):')
    signals.slice(0, 6).forEach((signal) => {
      const engagement = signal.engagement ? ` (${signal.engagement} engagement)` : ''
      lines.push(`- "${signal.title}"${engagement} via ${signal.source}${signal.snippet ? `: ${signal.snippet}` : ''}`)
    })
  }

  if (notes) {
    lines.push('')
    lines.push(`Builder notes: ${notes}`)
  }

  lines.push('')
  lines.push('Produce the blueprint JSON now.')

  return { system, user: lines.join('\n') }
}

// ---------------------------------------------------------------------------
// Provider adapters
// ---------------------------------------------------------------------------

// Returns { text } on success or { error } — never throws, so callers can
// render provider failures inline.
export async function callModel({
  provider,
  apiKey,
  system,
  user,
  model,
  browserDirect = false,
  timeoutMs = 60000,
}) {
  const normalized = String(provider || '').toLowerCase()
  try {
    if (!apiKey) return { error: 'No API key provided' }

    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), timeoutMs)
    let response
    try {
      if (normalized === 'anthropic') {
        response = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          signal: controller.signal,
          headers: {
            'x-api-key': apiKey,
            'anthropic-version': '2023-06-01',
            'Content-Type': 'application/json',
            // Opt-in header required for browser-originated calls; harmless on
            // the server.
            ...(browserDirect ? { 'anthropic-dangerous-direct-browser-access': 'true' } : {}),
          },
          body: JSON.stringify({
            model: model || DEFAULT_MODELS.anthropic,
            max_tokens: 4096,
            system,
            messages: [{ role: 'user', content: user }],
          }),
        })
      } else if (normalized === 'gemini') {
        const geminiModel = model || DEFAULT_MODELS.gemini
        response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent?key=${encodeURIComponent(apiKey)}`,
          {
            method: 'POST',
            signal: controller.signal,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              systemInstruction: { parts: [{ text: system }] },
              contents: [{ role: 'user', parts: [{ text: user }] }],
              generationConfig: { responseMimeType: 'application/json', maxOutputTokens: 4096 },
            }),
          }
        )
      } else {
        response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          signal: controller.signal,
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: model || DEFAULT_MODELS.openai,
            max_tokens: 4096,
            response_format: { type: 'json_object' },
            messages: [
              { role: 'system', content: system },
              { role: 'user', content: user },
            ],
          }),
        })
      }
    } finally {
      clearTimeout(timer)
    }

    if (!response.ok) {
      const detail = await response.json().catch(() => null)
      return { error: detail?.error?.message || `Provider returned HTTP ${response.status}` }
    }

    const data = await response.json()
    if (normalized === 'anthropic') {
      const text = (data.content || []).map((block) => block?.text || '').join('')
      return text ? { text } : { error: 'Empty response from Anthropic' }
    }
    if (normalized === 'gemini') {
      const text = (data.candidates?.[0]?.content?.parts || []).map((part) => part?.text || '').join('')
      return text ? { text } : { error: 'Empty response from Gemini' }
    }
    const text = data.choices?.[0]?.message?.content
    return text ? { text } : { error: 'Empty response from OpenAI' }
  } catch (error) {
    if (error?.name === 'AbortError') return { error: 'The model request timed out' }
    return { error: error?.message || 'The model request failed' }
  }
}

// ---------------------------------------------------------------------------
// Blueprint parsing
// ---------------------------------------------------------------------------

export function parseBlueprint(text) {
  if (!text || typeof text !== 'string') return null
  const stripped = text
    .trim()
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/, '')
  const start = stripped.indexOf('{')
  const end = stripped.lastIndexOf('}')
  if (start === -1 || end <= start) return null
  try {
    return JSON.parse(stripped.slice(start, end + 1))
  } catch {
    return null
  }
}

const asString = (value) => (typeof value === 'string' ? value : '')
const asArray = (value) => (Array.isArray(value) ? value : [])
const row = (value, fields) => {
  if (typeof value === 'string') return { ...fields, choice: value }
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(fields).map(([key, fallback]) => [key, asString(value[key]) || fallback]))
  }
  return fields
}

// Fills every field the UI dereferences so a malformed model response can
// never crash a render.
export function normalizeBlueprint(raw) {
  const source = raw && typeof raw === 'object' ? raw : {}
  const architecture = source.architecture && typeof source.architecture === 'object' ? source.architecture : {}

  return {
    name: asString(source.name) || 'Untitled concept',
    tagline: asString(source.tagline),
    problemStatement: asString(source.problemStatement),
    targetUsers: asString(source.targetUsers),
    solution: asString(source.solution),
    mvpFeatures: asArray(source.mvpFeatures).map(String).slice(0, 8),
    architecture: {
      summary: asString(architecture.summary),
      stack: asArray(architecture.stack)
        .map((item) => row(item, { layer: 'Layer', choice: '', why: '' }))
        .slice(0, 8),
      dataFlow: asArray(architecture.dataFlow).map(String).slice(0, 8),
      dataModel: asArray(architecture.dataModel)
        .map((item) => row(item, { entity: 'Entity', fields: '', notes: '' }))
        .slice(0, 8),
      apis: asArray(architecture.apis)
        .map((item) => row(item, { endpoint: '', purpose: '' }))
        .slice(0, 10),
    },
    buildPlan: asArray(source.buildPlan)
      .map((item) => ({
        phase: asString(item?.phase) || 'Phase',
        goal: asString(item?.goal),
        tasks: asArray(item?.tasks).map(String).slice(0, 5),
      }))
      .slice(0, 5),
    risks: asArray(source.risks).map(String).slice(0, 6),
    openQuestions: asArray(source.openQuestions).map(String).slice(0, 6),
  }
}

export function blueprintToMarkdown(blueprint) {
  const list = (items) => items.map((item) => `- ${item}`).join('\n')
  const bp = normalizeBlueprint(blueprint)

  return [
    `# ${bp.name}`,
    '',
    bp.tagline,
    '',
    '## Problem',
    bp.problemStatement,
    '',
    '## Target users',
    bp.targetUsers,
    '',
    '## Solution',
    bp.solution,
    '',
    '## MVP features',
    list(bp.mvpFeatures),
    '',
    '## Architecture',
    bp.architecture.summary,
    '',
    '### Stack',
    bp.architecture.stack.map((item) => `- **${item.layer}:** ${item.choice} — ${item.why}`).join('\n'),
    '',
    '### Data flow',
    bp.architecture.dataFlow.map((step, index) => `${index + 1}. ${step}`).join('\n'),
    '',
    '### Data model',
    bp.architecture.dataModel.map((item) => `- **${item.entity}** — ${item.fields} (${item.notes})`).join('\n'),
    '',
    '### APIs',
    bp.architecture.apis.map((item) => `- \`${item.endpoint}\` — ${item.purpose}`).join('\n'),
    '',
    '## Build plan',
    bp.buildPlan.map((phase) => `### ${phase.phase}\n${phase.goal}\n\n${list(phase.tasks)}`).join('\n\n'),
    '',
    '## Risks',
    list(bp.risks),
    '',
    '## Open questions',
    list(bp.openQuestions),
    '',
  ].join('\n')
}
