// Shared HTTP plumbing for the /api functions. Plain Vercel Node functions
// receive the raw request stream, so request bodies are read manually and raw
// bytes are preserved (the Stripe webhook needs them for signature checks).

const MAX_BODY_BYTES = 100000

// Endpoints are same-origin in the normal Vercel deployment, but the client
// can also point at them from a static mirror (GitHub Pages via
// VITE_API_BASE), so every response carries permissive CORS headers. Auth
// travels in the Authorization header, never cookies, so a wildcard origin
// does not expose anything.
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, content-type',
  'Access-Control-Max-Age': '86400',
}

export function preflight(res) {
  res.statusCode = 204
  Object.entries(CORS_HEADERS).forEach(([name, value]) => res.setHeader(name, value))
  res.end()
}

export function json(res, status, data) {
  res.statusCode = status
  Object.entries(CORS_HEADERS).forEach(([name, value]) => res.setHeader(name, value))
  res.setHeader('Content-Type', 'application/json')
  res.end(JSON.stringify(data))
}

export async function readRawBody(req) {
  let size = 0
  const chunks = []
  for await (const chunk of req) {
    size += chunk.length
    if (size > MAX_BODY_BYTES) throw new Error('payload too large')
    chunks.push(chunk)
  }
  return Buffer.concat(chunks).toString('utf8')
}

export async function readJsonBody(req) {
  const raw = await readRawBody(req)
  if (!raw) return {}
  try {
    return JSON.parse(raw)
  } catch {
    throw new Error('invalid json body')
  }
}

// Reads topic/sources from either a POST JSON body or GET query parameters so
// the endpoint stays easy to curl and easy to cache-bust from the browser.
export async function readInput(req) {
  if (req.method === 'GET') {
    const url = new URL(req.url, 'http://localhost')
    return {
      topic: url.searchParams.get('topic') || '',
      sources: (url.searchParams.get('sources') || '').split(',').map((item) => item.trim()).filter(Boolean),
    }
  }
  return readJsonBody(req)
}
