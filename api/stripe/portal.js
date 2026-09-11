import { json, preflight, readJsonBody } from '../_lib/http.js'
import { admin, getProfile, getUser } from '../_lib/supabase.js'
import { resolveOrigin, stripeConfig, stripeRequest } from '../_lib/stripe.js'

// POST /api/stripe/portal
// Opens Stripe's billing portal so subscribers can update payment details or
// cancel. Requires an existing Stripe customer on the profile.
export default async function handler(req, res) {
  if (req.method === 'OPTIONS') return preflight(res)
  if (req.method !== 'POST') return json(res, 405, { code: 'method_not_allowed', error: 'Use POST' })

  const { secretKey } = stripeConfig()
  if (!secretKey) {
    return json(res, 503, { code: 'stripe_not_configured', error: 'Set STRIPE_SECRET_KEY on the server to enable the billing portal' })
  }
  if (!admin) {
    return json(res, 503, { code: 'api_not_configured', error: 'Set SUPABASE_SERVICE_ROLE_KEY on the server' })
  }

  await readJsonBody(req).catch(() => {})

  const user = await getUser(req)
  if (!user) return json(res, 401, { code: 'unauthenticated', error: 'Sign in first' })

  const profile = await getProfile(user.id)
  if (!profile?.stripe_customer_id) {
    return json(res, 400, { code: 'no_customer', error: 'No billing profile yet — subscribe first' })
  }

  try {
    const origin = resolveOrigin(req)
    const session = await stripeRequest('/v1/billing_portal/sessions', {
      customer: profile.stripe_customer_id,
      return_url: origin,
    })
    return json(res, 200, { url: session.url })
  } catch (error) {
    return json(res, 500, { code: 'portal_failed', error: error.message || 'Could not open the billing portal' })
  }
}
