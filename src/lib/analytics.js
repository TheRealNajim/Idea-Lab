import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_ANON_KEY
const supabase = url && key ? createClient(url, key, { auth: { persistSession: false } }) : null

export const CONSENT_KEY = 'idea-lab-analytics-consent'
const ANONYMOUS_ID_KEY = 'idea-lab-anonymous-id'

// The consent value is owned by useLocalStorage, which JSON-encodes it, so the
// raw string is `"accepted"` (with quotes) rather than `accepted`. Parse it, but
// still accept a bare string so values written by older builds keep working.
export function readConsent() {
  try {
    const raw = localStorage.getItem(CONSENT_KEY)
    if (raw === null) return null
    try {
      const parsed = JSON.parse(raw)
      return typeof parsed === 'string' ? parsed : null
    } catch {
      return raw
    }
  } catch {
    return null
  }
}

function createId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') return crypto.randomUUID()
  // Fallback for non-secure contexts where randomUUID is unavailable.
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (char) => {
    const random = (Math.random() * 16) | 0
    const value = char === 'x' ? random : (random & 0x3) | 0x8
    return value.toString(16)
  })
}

function getAnonymousId() {
  try {
    let id = localStorage.getItem(ANONYMOUS_ID_KEY)
    if (!id) {
      id = createId()
      localStorage.setItem(ANONYMOUS_ID_KEY, id)
    }
    return id
  } catch {
    // Storage blocked: still send a well-formed id, just don't persist it.
    return createId()
  }
}

// Never rejects. Analytics must never be able to break a user interaction.
export async function sendAnalyticsEvent(name, properties = {}) {
  if (!supabase || readConsent() !== 'accepted') return

  const safeProperties = {
    type: properties.type,
    domainA: properties.domainA,
    domainB: properties.domainB,
    domainC: properties.domainC,
    format: properties.format,
    difficulty: properties.difficulty,
    rating: properties.rating,
    sources: properties.sources,
    count: properties.count,
    provider: properties.provider,
    mode: properties.mode,
  }

  try {
    await supabase.from('usage_events').insert({
      anonymous_id: getAnonymousId(),
      event_name: name,
      properties: Object.fromEntries(
        Object.entries(safeProperties).filter(([, value]) => value !== undefined && value !== '')
      ),
    })
  } catch {
    // Offline, blocked by an extension, or RLS rejected the row. Ignore.
  }
}

export function clearAnonymousAnalyticsId() {
  try {
    localStorage.removeItem(ANONYMOUS_ID_KEY)
  } catch {
    // Nothing to clear if storage is unavailable.
  }
}
