import { useCallback, useEffect, useRef, useState } from 'react'
import { authAvailable, supabase } from '../lib/supabase'

const emptyProfile = { plan: 'trial', trial_scans_left: 0, trial_ai_left: 0, subscription_status: 'none' }
const PRO_STATUSES = ['active', 'trialing', 'past_due']

// Loads the caller's profile row, falling back to the safe self-insert policy
// (see supabase/schema.sql) when the signup predates the schema trigger.
const loadProfile = async (user) => {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, email, display_name, plan, trial_scans_left, trial_ai_left, stripe_customer_id, subscription_status')
    .eq('id', user.id)
    .maybeSingle()

  if (data) return { profile: data, schemaIssue: false }

  const tableMissing = Boolean(
    error && (String(error.message).includes('profiles') || String(error.code) === '42P01' || String(error.message).includes('PGRST205'))
  )
  if (tableMissing) return { profile: null, schemaIssue: true }

  // No row yet (and the table exists): self-create with stock defaults.
  const { error: insertError } = await supabase.from('profiles').insert({ id: user.id, email: user.email })
  if (insertError) return { profile: null, schemaIssue: false }

  const retry = await supabase
    .from('profiles')
    .select('id, email, display_name, plan, trial_scans_left, trial_ai_left, stripe_customer_id, subscription_status')
    .eq('id', user.id)
    .maybeSingle()
  return { profile: retry.data || null, schemaIssue: false }
}

export function useAuth() {
  const [session, setSession] = useState(null)
  const [profile, setProfile] = useState(null)
  const [schemaIssue, setSchemaIssue] = useState(false)
  const [ready, setReady] = useState(!authAvailable)
  const sessionRef = useRef(null)

  const applySession = useCallback(async (nextSession) => {
    sessionRef.current = nextSession
    setSession(nextSession)
    if (!nextSession?.user) {
      setProfile(null)
      return
    }
    const { profile: loaded, schemaIssue: issue } = await loadProfile(nextSession.user)
    // A newer session may have arrived while this load was in flight.
    if (sessionRef.current !== nextSession) return
    setProfile(loaded)
    setSchemaIssue(issue)
  }, [])

  useEffect(() => {
    if (!authAvailable) return undefined

    supabase.auth
      .getSession()
      .then(({ data }) => {
        setReady(true)
        return applySession(data.session)
      })
      .catch(() => setReady(true))

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      applySession(nextSession)
    })

    return () => subscription.unsubscribe()
  }, [applySession])

  const refreshProfile = useCallback(async () => {
    const current = sessionRef.current
    if (!current?.user) return null
    const { profile: loaded, schemaIssue: issue } = await loadProfile(current.user)
    setProfile(loaded)
    setSchemaIssue(issue)
    return loaded
  }, [])

  // Endpoints echo the post-action credit state; merge it so the UI updates
  // without a round trip.
  const applyCredits = useCallback((credits) => {
    if (!credits) return
    setProfile((current) => (current ? { ...current, ...credits } : { ...emptyProfile, ...credits }))
  }, [])

  const getToken = useCallback(async () => {
    if (!authAvailable) return null
    const { data } = await supabase.auth.getSession()
    return data?.session?.access_token || null
  }, [])

  const sendMagicLink = useCallback(async (email) => {
    if (!authAvailable) return { error: 'Accounts are not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.' }
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}${window.location.pathname}`,
        shouldCreateUser: true,
      },
    })
    return { error: error?.message || null }
  }, [])

  const signOut = useCallback(async () => {
    if (!authAvailable) return
    await supabase.auth.signOut()
  }, [])

  const user = session?.user || null
  const isPro = Boolean(
    profile
    && profile.plan === 'pro'
    && PRO_STATUSES.includes(profile.subscription_status)
  )

  return {
    authAvailable,
    session,
    user,
    profile,
    schemaIssue,
    ready,
    isPro,
    refreshProfile,
    applyCredits,
    getToken,
    sendMagicLink,
    signOut,
  }
}
