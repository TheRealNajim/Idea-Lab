import crypto from 'node:crypto'

// A ~60 line REST wrapper instead of the Stripe SDK: the app only needs
// three calls (create customer, checkout session, portal session) plus v1
// webhook signature verification, and staying dependency-free keeps cold
// starts fast.

const STRIPE_API = 'https://api.stripe.com'

export function stripeConfig() {
  const secretKey = process.env.STRIPE_SECRET_KEY
  const priceId = process.env.STRIPE_PRICE_ID
  return {
    secretKey,
    priceId,
    checkoutEnabled: Boolean(secretKey && priceId),
  }
}

// Params use Stripe's form-encoding convention. Nested values are passed as
// arrays of flat objects: line_items: [{ price: 'price_x', quantity: 1 }]
// becomes line_items[0][price]=price_x&line_items[0][quantity]=1.
export async function stripeRequest(path, params = {}) {
  const { secretKey } = stripeConfig()
  if (!secretKey) throw new Error('Stripe is not configured')

  const body = new URLSearchParams()
  for (const [name, value] of Object.entries(params)) {
    if (value === undefined || value === null) continue
    if (Array.isArray(value)) {
      value.forEach((entry, index) => {
        for (const [key, inner] of Object.entries(entry)) {
          if (inner !== undefined && inner !== null) body.append(`${name}[${index}][${key}]`, String(inner))
        }
      })
    } else {
      body.append(name, String(value))
    }
  }

  const response = await fetch(`${STRIPE_API}${path}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${secretKey}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: body.toString(),
  })

  const data = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(data?.error?.message || `Stripe error ${response.status}`)
  return data
}

// Verifies the `t=...,v1=...` webhook signature against the raw request body
// (timing-safe). Multiple v1 values are tolerated, as Stripe may rotate
// webhook secrets.
export function verifyStripeSignature(rawBody, signatureHeader, secret) {
  if (!signatureHeader) return false

  const parts = {}
  for (const part of signatureHeader.split(',')) {
    const equals = part.indexOf('=')
    if (equals === -1) continue
    const name = part.slice(0, equals).trim()
    const value = part.slice(equals + 1).trim()
    if (name === 'v1') {
      parts.v1 = parts.v1 ? [...parts.v1, value] : [value]
    } else {
      parts[name] = value
    }
  }

  const timestamp = parts.t
  const signatures = parts.v1 || []
  if (!timestamp || signatures.length === 0) return false

  // Reject stale signatures (outside Stripe's recommended 5 minute window).
  const age = Math.abs(Date.now() / 1000 - Number(timestamp))
  if (!Number.isFinite(age) || age > 300) return false

  const expected = crypto
    .createHmac('sha256', secret)
    .update(`${timestamp}.${rawBody}`)
    .digest('hex')

  return signatures.some(
    (signature) =>
      signature.length === expected.length
      && crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))
  )
}

// The browser origin for success/cancel redirects: APP_URL wins (needed when
// the function runs behind a proxy), otherwise Vercel's forwarded headers.
export function resolveOrigin(req) {
  if (process.env.APP_URL) return process.env.APP_URL.replace(/\/$/, '')
  const host = req.headers.host || 'localhost:3000'
  const proto = req.headers['x-forwarded-proto'] || (host.startsWith('localhost') ? 'http' : 'https')
  return `${proto}://${host}`
}
