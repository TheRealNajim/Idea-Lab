import { json, readRawBody } from '../_lib/http.js'
import { admin } from '../_lib/supabase.js'
import { stripeConfig, verifyStripeSignature } from '../_lib/stripe.js'

// POST /api/stripe/webhook — Stripe calls this directly (no CORS, no auth
// header; the signed payload IS the authentication). Flips profiles between
// 'pro' and 'free' as subscriptions come and go.

const PRO_STATUSES = ['active', 'trialing', 'past_due']

async function setPlan(userId, plan, status, customerId) {
  const update = { plan, subscription_status: status, updated_at: new Date().toISOString() }
  if (customerId) update.stripe_customer_id = customerId
  const { error } = await admin.from('profiles').update(update).eq('id', userId)
  // Throwing makes the endpoint 500, which tells Stripe to retry the event
  // later — the right outcome for transient database failures.
  if (error) throw new Error(`profile update failed: ${error.message}`)
}

async function findUserIdByCustomer(customerId) {
  const { data, error } = await admin
    .from('profiles')
    .select('id')
    .eq('stripe_customer_id', customerId)
    .maybeSingle()
  if (error) throw new Error(`customer lookup failed: ${error.message}`)
  return data?.id || null
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return json(res, 405, { code: 'method_not_allowed', error: 'Use POST' })

  const { secretKey } = stripeConfig()
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
  if (!secretKey || !webhookSecret) {
    return json(res, 503, { error: 'Stripe webhook is not configured' })
  }
  if (!admin) {
    return json(res, 503, { error: 'Supabase admin is not configured' })
  }

  // The raw body string is required for signature verification — JSON parsing
  // would reserialise it and break the HMAC.
  const rawBody = await readRawBody(req).catch(() => null)
  if (rawBody === null) return json(res, 400, { error: 'Could not read the request body' })

  if (!verifyStripeSignature(rawBody, req.headers['stripe-signature'], webhookSecret)) {
    return json(res, 400, { error: 'Invalid webhook signature' })
  }

  let event
  try {
    event = JSON.parse(rawBody)
  } catch {
    return json(res, 400, { error: 'Invalid JSON payload' })
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object
        const userId = session.metadata?.user_id || session.client_reference_id
        if (userId && session.customer) {
          await setPlan(userId, 'pro', 'active', session.customer)
        }
        break
      }

      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        const subscription = event.data.object
        const status = subscription.status || 'canceled'
        const active = PRO_STATUSES.includes(status)
        const customerId = subscription.customer
        const userId = subscription.metadata?.user_id || (await findUserIdByCustomer(customerId))
        if (userId) {
          await setPlan(userId, active ? 'pro' : 'free', status, customerId)
        }
        break
      }

      default:
        // Unhandled event types are acknowledged so Stripe stops retrying.
        break
    }
  } catch (error) {
    // 500 makes Stripe retry, which is what we want for transient DB issues.
    return json(res, 500, { error: error.message || 'Webhook handler failed' })
  }

  return json(res, 200, { received: true })
}
