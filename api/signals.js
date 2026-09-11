import { json, preflight, readInput } from './_lib/http.js'
import { DEFAULT_SOURCES, scanSources } from './_lib/signals.js'
import {
  authorizeMeteredAction,
  ensureProfile,
  getUser,
  supabaseAdminConfigured,
} from './_lib/supabase.js'

export const maxDuration = 30

// GET /api/signals?topic=...&sources=reddit,hackernews
// POST /api/signals { topic, sources }
//
// Auth required (Bearer token). Trial accounts spend one scan credit; Pro is
// unmetered. One credit buys a scan across every requested source.
export default async function handler(req, res) {
  if (req.method === 'OPTIONS') return preflight(res)
  if (req.method !== 'GET' && req.method !== 'POST') {
    return json(res, 405, { code: 'method_not_allowed', error: 'Use GET or POST' })
  }

  if (!supabaseAdminConfigured) {
    return json(res, 503, { code: 'api_not_configured', error: 'Set SUPABASE_SERVICE_ROLE_KEY (and VITE_SUPABASE_URL) on the server to enable accounts and scans' })
  }

  let input
  try {
    input = await readInput(req)
  } catch (error) {
    return json(res, 400, { code: 'bad_request', error: error.message })
  }

  const topic = String(input.topic || '').trim().slice(0, 120)
  if (topic.length < 2) {
    return json(res, 400, { code: 'bad_request', error: 'Provide a topic of at least 2 characters' })
  }

  const user = await getUser(req)
  if (!user) {
    return json(res, 401, { code: 'unauthenticated', error: 'Sign in to scan — free accounts include trial scans' })
  }

  let profile
  let metered
  try {
    profile = await ensureProfile(user)
    metered = await authorizeMeteredAction(user, profile, 'scan')
  } catch (error) {
    return json(res, 500, { code: 'server_error', error: 'Could not reach the accounts database. Try again in a moment.' })
  }

  const { allowed, credits } = metered
  if (!allowed) {
    return json(res, 402, { code: 'trial_exhausted', error: 'Your free scans are used up. Upgrade to Pro for unlimited scans.', credits })
  }

  const requested = Array.isArray(input.sources) ? input.sources : DEFAULT_SOURCES
  const results = await scanSources(topic, requested)

  return json(res, 200, {
    topic,
    results,
    // Echo the credit state AFTER consumption so the client can update its UI
    // without a follow-up fetch.
    credits,
  })
}
