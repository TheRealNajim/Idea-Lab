import { json, preflight, readJsonBody } from '../_lib/http.js'
import { admin, ensureProfile, getUser } from '../_lib/supabase.js'
import { resolveOrigin, stripeConfig, stripeRequest } from '../_lib/stripe.js'

// POST /api/stripe/checkout
// Creates a Stripe Checkout session for the Pro subscription and returns its
// URL. Auth required; the caller's profile is linked to the Stripe customer
// so the webhook can flip the plan to 'pro'.
export default async function handler(req, res) {
  if (req.method === 'OPTIONS') return preflight(res)
  if (req.method !== 'POST') return json(res, 405, { code: 'method_not_allowed', error: 'Use POST' })

  const { secretKey, priceId, checkoutEnabled } = stripeConfig()
  if (!checkoutEnabled) {
    return json(res, 503, { code: 'stripe_not_configured', error: 'Set STRIPE_SECRET_KEY and STRIPE_PRICE_ID on the server to enable subscriptions' })
  }
  if (!admin) {
    return json(res, 503, { code: 'api_not_configured', error: 'Set SUPABASE_SERVICE_ROLE_KEY on the server' })
  }

  // Drain the body (Checkout sends none) so the request stream is consumed.
  await readJsonBody(req).catch(() => {})

  const user = await getUser(req)
  if (!user) return json(res, 401, { code: 'unauthenticated', error: 'Sign in before upgrading' })

  try {
    const profile = await ensureProfile(user)
    let customerId = profile?.stripe_customer_id

    if (!customerId) {
      const customer = await stripeRequest('/v1/customers', {
        email: user.email,
        'metadata[user_id]': user.id,
      })
      customerId = customer.id
      await admin
        .from('profiles')
        .update({ stripe_customer_id: customerId, updated_at: new Date().toISOString() })
        .eq('id', user.id)
    }

    const origin = resolveOrigin(req)
    const session = await stripeRequest('/v1/checkout/sessions', {
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      customer: customerId,
      client_reference_id: user.id,
      'metadata[user_id]': user.id,
      allow_promotion_codes: true,
      success_url: `${origin}/?checkout=success`,
      cancel_url: `${origin}/?checkout=cancelled`,
    })

    return json(res, 200, { url: session.url })
  } catch (error) {
    return json(res, 500, { code: 'checkout_failed', error: error.message || 'Stripe checkout failed' })
  }
}
