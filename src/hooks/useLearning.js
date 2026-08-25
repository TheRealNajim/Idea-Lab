import { useMemo } from 'react'
import { sendAnalyticsEvent } from '../lib/analytics'
import { useLocalStorage } from './useLocalStorage'

const emptyProfile = { domains: {}, types: {}, ratings: {} }

// Profiles persisted by earlier builds may be missing `ratings` (or be a
// non-object entirely). Every read goes through this so callers can always
// dereference profile.domains / .types / .ratings safely.
const reviveProfile = (stored) => {
  const source = stored && typeof stored === 'object' ? stored : emptyProfile
  return {
    domains: { ...(source.domains ?? {}) },
    types: { ...(source.types ?? {}) },
    ratings: { ...(source.ratings ?? {}) },
  }
}

export function useLearning() {
  const [profile, setProfile] = useLocalStorage('idea-lab-learning-profile', emptyProfile, reviveProfile)

  const learn = (action, idea, weight = 1) => {
    if (!idea) return
    setProfile((current) => {
      const next = reviveProfile(current)
      ;[idea.domainA, idea.domainB, idea.domainC].filter(Boolean).forEach((domain) => {
        next.domains[domain] = (next.domains[domain] || 0) + weight
      })
      if (idea.type) next.types[idea.type] = (next.types[idea.type] || 0) + weight
      if (action === 'rating') next.ratings[idea.id] = weight > 0 ? 'helpful' : 'not-helpful'
      return next
    })
    sendAnalyticsEvent(action, {
      ...idea,
      rating: action === 'rating' ? (weight > 0 ? 'helpful' : 'not-helpful') : undefined,
    })
  }

  const rankIdeas = useMemo(() => (ideas) => [...ideas].sort((a, b) => score(b, profile) - score(a, profile)), [profile])
  const hasPreferences = Object.keys(profile.domains).length > 0
  const resetLearning = () => setProfile(emptyProfile)

  return { profile, learn, rankIdeas, hasPreferences, resetLearning }
}

function score(idea, profile) {
  const domains = [idea.domainA, idea.domainB, idea.domainC].filter(Boolean)
  return domains.reduce((total, domain) => total + (profile.domains[domain] || 0), 0) + (profile.types[idea.type] || 0) * 1.5
}
