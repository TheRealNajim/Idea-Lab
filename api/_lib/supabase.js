import { createClient } from '@supabase/supabase-js'

// Vercel exposes VITE_* environment variables to functions at runtime too, so
// projects that already set VITE_SUPABASE_URL for the client bundle get the
// server URL for free. Only the service role key is genuinely secret.
const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

export const supabaseAdminConfigured = Boolean(url && serviceKey)

export const admin = supabaseAdminConfigured
  ? createClient(url, serviceKey, { auth: { persistSession: false } })
  : null

// Resolves the caller from the Authorization: Bearer <jwt> header, if any.
export async function getUser(req) {
  if (!admin) return null
  const header = req.headers.authorization || ''
  const token = header.startsWith('Bearer ') ? header.slice(7).trim() : null
  if (!token) return null
  try {
    const { data, error } = await admin.auth.getUser(token)
    return error ? null : data.user
  } catch {
    return null
  }
}

// Loads the profile row. Throws on transport/schema errors so callers can
// surface a 500 instead of misreading an outage as "no profile".
export async function getProfile(userId) {
  if (!admin) return null
  const { data, error } = await admin.from('profiles').select('*').eq('id', userId).maybeSingle()
  if (error) throw new Error(error.message)
  return data || null
}

// Self-heals a missing profile row (e.g. signups that predate the schema's
// auth trigger) so metering never blocks an otherwise valid request.
export async function ensureProfile(user) {
  const existing = await getProfile(user.id)
  if (existing) return existing
  await admin.from('profiles').insert({ id: user.id, email: user.email })
  return getProfile(user.id)
}

export function isProActive(profile) {
  return Boolean(
    profile
    && profile.plan === 'pro'
    && ['active', 'trialing', 'past_due'].includes(profile.subscription_status)
  )
}

// Pro users get unlimited metered access; trial users spend one credit. The
// decrement is atomic inside Postgres (see consume_trial_credit in the
// schema), so parallel requests cannot overspend a trial.
//
// Returns { allowed, credits } — `allowed: false` means the caller should
// respond with 402 and the client should open the paywall.
export async function authorizeMeteredAction(user, profile, kind) {
  if (isProActive(profile)) {
    return { allowed: true, credits: creditSummary(profile) }
  }

  const consumed = await consumeCredit(user.id, kind)
  if (consumed) {
    return { allowed: true, credits: consumed }
  }

  // plan 'free' means the trial is spent or lapsed; plan 'trial' with a null
  // consume means that specific credit bucket is empty. Either way: paywall.
  return { allowed: false, credits: creditSummary(profile) }
}

export async function consumeCredit(userId, kind) {
  const { data, error } = await admin.rpc('consume_trial_credit', { p_user: userId, p_kind: kind })
  // A failed RPC must not read as "out of credits": null data means the
  // update matched nothing (exhausted), while an error means the meter is
  // broken and the caller should 500.
  if (error) throw new Error(error.message)
  return data === null ? null : data
}

export async function refundCredit(userId, kind) {
  try {
    await admin.rpc('refund_trial_credit', { p_user: userId, p_kind: kind })
  } catch {
    // Refunding is best-effort; a missed refund is recoverable manually.
  }
}

export function creditSummary(profile) {
  if (!profile) return null
  return {
    plan: profile.plan,
    trial_scans_left: profile.trial_scans_left,
    trial_ai_left: profile.trial_ai_left,
    subscription_status: profile.subscription_status,
  }
}

// Maps the Supabase/PostgREST error from a failed profile load onto a hint the
// client can actually act on (usually: run the schema).
export function profileSchemaIssue(error) {
  const message = String(error?.message || '')
  return message.includes('profiles') || message.includes('PGRST205') || message.includes('42P01')
}
