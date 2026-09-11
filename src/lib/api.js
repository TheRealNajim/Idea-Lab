// Browser-side helper for the /api functions. Same-origin by default; a
// static mirror (GitHub Pages) can point at the Vercel deployment by setting
// VITE_API_BASE.

const BASE = String(import.meta.env.VITE_API_BASE || '').replace(/\/+$/, '')

export class ApiError extends Error {
  constructor(code, message, status, credits) {
    super(message)
    this.name = 'ApiError'
    this.code = code
    this.status = status
    this.credits = credits
  }
}

export function apiBaseConfigured() {
  return Boolean(BASE)
}

async function request(path, { method = 'GET', body, token } = {}) {
  const headers = {}
  if (token) headers.Authorization = `Bearer ${token}`
  if (body !== undefined) headers['Content-Type'] = 'application/json'

  let response
  try {
    response = await fetch(`${BASE}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    })
  } catch {
    throw new ApiError('network_error', 'Could not reach the Idea Lab server. Check your connection.', 0)
  }

  // Static hosts (GitHub Pages) answer unknown paths with an HTML page; treat
  // any non-JSON response as "no backend here".
  const contentType = response.headers.get('content-type') || ''
  if (!contentType.includes('application/json')) {
    throw new ApiError(
      'api_unavailable',
      'This deployment has no /api backend. Deploy to Vercel or set VITE_API_BASE to your Vercel URL.',
      response.status
    )
  }

  const data = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw new ApiError(data.code || 'error', data.error || 'Request failed', response.status, data.credits)
  }
  return data
}

export function scanSignals({ topic, sources, token }) {
  return request('/api/signals', { method: 'POST', body: { topic, sources }, token })
}

export function generateBlueprint({ idea, signals, notes, token }) {
  return request('/api/ai', { method: 'POST', body: { idea, signals, notes }, token })
}

export function createCheckoutSession(token) {
  return request('/api/stripe/checkout', { method: 'POST', token })
}

export function createPortalSession(token) {
  return request('/api/stripe/portal', { method: 'POST', token })
}
