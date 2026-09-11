import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_ANON_KEY

// Accounts require a Supabase project; analytics.js deliberately keeps its own
// keyless client, so a missing config degrades features independently.
export const authAvailable = Boolean(url && key)

export const supabase = authAvailable
  ? createClient(url, key, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null
