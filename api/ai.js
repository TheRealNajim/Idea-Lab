import { json, preflight, readJsonBody } from './_lib/http.js'
import {
  authorizeMeteredAction,
  creditSummary,
  ensureProfile,
  getProfile,
  getUser,
  refundCredit,
  supabaseAdminConfigured,
} from './_lib/supabase.js'
import {
  buildBlueprintPrompt,
  callModel,
  defaultModelFor,
  normalizeBlueprint,
  parseBlueprint,
} from '../src/lib/ai.js'

export const maxDuration = 60

// POST /api/ai { idea, signals, notes }
//
// Server-backed blueprint generation. Trial accounts spend one AI credit,
// refunded automatically if the provider call fails. Users who paste their own
// key in Model setup never hit this endpoint — BYOK calls go straight from
// the browser to the provider.
export default async function handler(req, res) {
  if (req.method === 'OPTIONS') return preflight(res)
  if (req.method !== 'POST') {
    return json(res, 405, { code: 'method_not_allowed', error: 'Use POST' })
  }

  if (!supabaseAdminConfigured) {
    return json(res, 503, { code: 'api_not_configured', error: 'Set SUPABASE_SERVICE_ROLE_KEY (and VITE_SUPABASE_URL) on the server to enable accounts and AI credits' })
  }

  let body
  try {
    body = await readJsonBody(req)
  } catch (error) {
    return json(res, 400, { code: 'bad_request', error: error.message })
  }

  const user = await getUser(req)
  if (!user) {
    return json(res, 401, { code: 'unauthenticated', error: 'Sign in to use server AI — free accounts include AI blueprint credits' })
  }

  const providerName = (process.env.AI_PROVIDER || 'OpenAI').toLowerCase()
  const apiKeys = {
    openai: process.env.OPENAI_API_KEY,
    anthropic: process.env.ANTHROPIC_API_KEY,
    gemini: process.env.GEMINI_API_KEY,
  }
  const apiKey = apiKeys[providerName]
  if (!apiKey) {
    return json(res, 503, {
      code: 'ai_not_configured',
      error: `No server API key for ${providerName}. Set AI_PROVIDER and the matching key, or use your own key in Model setup.`,
    })
  }

  let metered
  try {
    const profile = await ensureProfile(user)
    metered = await authorizeMeteredAction(user, profile, 'ai')
  } catch (error) {
    return json(res, 500, { code: 'server_error', error: 'Could not reach the accounts database. Try again in a moment.' })
  }
  if (!metered.allowed) {
    return json(res, 402, { code: 'trial_exhausted', error: 'Your free AI blueprints are used up. Upgrade to Pro, or add your own key in Model setup.', credits: metered.credits })
  }

  const prompt = buildBlueprintPrompt({
    idea: body.idea || {},
    signals: Array.isArray(body.signals) ? body.signals : [],
    notes: String(body.notes || '').slice(0, 1000),
  })

  const result = await callModel({
    provider: providerName,
    apiKey,
    system: prompt.system,
    user: prompt.user,
    model: process.env.AI_MODEL || defaultModelFor(providerName),
    timeoutMs: 55000,
  })

  const blueprint = result.text ? parseBlueprint(result.text) : null
  if (!blueprint) {
    // The credit was spent but the user got nothing — put it back.
    await refundCredit(user.id, 'ai')
    let refreshedCredits = metered.credits
    try {
      refreshedCredits = creditSummary(await getProfile(user.id))
    } catch {
      // Keep the pre-refund snapshot; the client will re-sync on next load.
    }
    return json(res, 502, {
      code: 'model_error',
      error: `${result.error || 'The model did not return a valid blueprint'}. Your credit was refunded.`,
      credits: refreshedCredits,
    })
  }

  return json(res, 200, {
    blueprint: normalizeBlueprint(blueprint),
    provider: providerName,
    credits: metered.credits,
  })
}
