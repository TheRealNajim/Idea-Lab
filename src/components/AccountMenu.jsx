import { AnimatePresence, motion } from 'framer-motion'
import { CreditCard, ExternalLink, Loader2, LogOut, Sparkles, User } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { createPortalSession } from '../lib/api'
import { FADE } from '../lib/motion'

const PLAN_BADGE = {
  pro: 'border-acid/40 bg-acid/10 text-acid',
  trial: 'border-white/15 bg-white/5 text-slate-300',
  free: 'border-white/15 bg-white/5 text-slate-400',
}

// Header account chip + dropdown: plan, remaining trial credits, billing
// portal, and sign out. Clicking outside (or Escape) closes the menu.
export function AccountMenu({ auth, onUpgrade, notify }) {
  const [open, setOpen] = useState(false)
  const [portalLoading, setPortalLoading] = useState(false)
  const [menuError, setMenuError] = useState(null)
  const rootRef = useRef(null)

  const { user, profile, isPro, schemaIssue, signOut, getToken } = auth

  useEffect(() => {
    if (!open) return undefined
    const onPointerDown = (event) => {
      if (rootRef.current && !rootRef.current.contains(event.target)) setOpen(false)
    }
    window.addEventListener('pointerdown', onPointerDown)
    return () => window.removeEventListener('pointerdown', onPointerDown)
  }, [open])

  useEffect(() => {
    if (!open) return undefined
    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        event.stopPropagation()
        setOpen(false)
      }
    }
    window.addEventListener('keydown', onKeyDown, true)
    return () => window.removeEventListener('keydown', onKeyDown, true)
  }, [open])

  const email = user?.email || profile?.email || 'signed in'
  const displayName = profile?.display_name || email.split('@')[0]
  const plan = isPro ? 'pro' : (profile?.plan || 'trial')

  const openPortal = async () => {
    setMenuError(null)
    setPortalLoading(true)
    try {
      const token = await getToken()
      const { url } = await createPortalSession(token)
      window.location.href = url
    } catch (error) {
      setMenuError(error.message)
      setPortalLoading(false)
    }
  }

  return <div className="relative" ref={rootRef}>
    <button
      onClick={() => setOpen((value) => !value)}
      className="flex h-9 items-center gap-2 rounded-xl border border-slate-200 bg-white pl-2 pr-3 font-mono text-[10px] uppercase tracking-wider text-slate-600 transition hover:border-acid/50 dark:border-white/10 dark:bg-white/5 dark:text-slate-300"
      aria-haspopup="menu"
      aria-expanded={open}
    >
      <span className={`flex h-5 w-5 items-center justify-center rounded-md font-semibold ${isPro ? 'bg-acid text-ink' : 'bg-white/10 text-slate-300'}`}>{(displayName[0] || '?').toUpperCase()}</span>
      <span className="hidden sm:inline">{isPro ? 'Pro' : plan === 'free' ? 'Free' : 'Trial'}</span>
      <span className={`h-1.5 w-1.5 rounded-full ${isPro ? 'bg-acid shadow-[0_0_8px_#b8f34a]' : 'bg-slate-400'}`} />
    </button>

    <AnimatePresence>
      {open && <motion.div
        initial={{ opacity: 0, y: -6, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -4, scale: 0.99 }}
        transition={FADE}
        role="menu"
        className="fixed inset-x-4 top-[72px] z-50 max-h-[calc(100dvh-96px)] overflow-y-auto rounded-2xl border border-white/10 bg-panel p-4 shadow-2xl shadow-black/50 sm:absolute sm:inset-x-auto sm:right-0 sm:top-11 sm:max-h-none sm:w-72"
      >
        <div className="flex items-center gap-3 border-b border-white/10 pb-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/10 font-display text-sm font-semibold text-white">{(displayName[0] || '?').toUpperCase()}</span>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-white">{displayName}</p>
            <p className="truncate font-mono text-[10px] text-slate-500">{email}</p>
          </div>
        </div>

        <div className="flex items-center justify-between py-3">
          <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-slate-500">Plan</span>
          <span className={`rounded-full border px-2.5 py-1 font-mono text-[9px] uppercase tracking-wider ${PLAN_BADGE[plan] || PLAN_BADGE.trial}`}>{isPro ? 'Pro' : plan === 'free' ? 'Free' : 'Trial'}</span>
        </div>

        {!isPro && <div className="mb-3 rounded-xl border border-white/10 bg-white/[0.03] p-3">
          <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-slate-500">Trial credits left</p>
          <div className="mt-2 grid grid-cols-2 gap-2">
            <div className="rounded-lg bg-black/20 p-2 text-center"><strong className="block font-display text-lg text-white">{profile?.trial_scans_left ?? '—'}</strong><span className="font-mono text-[9px] text-slate-500">scans</span></div>
            <div className="rounded-lg bg-black/20 p-2 text-center"><strong className="block font-display text-lg text-white">{profile?.trial_ai_left ?? '—'}</strong><span className="font-mono text-[9px] text-slate-500">blueprints</span></div>
          </div>
        </div>}

        {schemaIssue && <p className="mb-3 rounded-xl border border-amber-400/25 bg-amber-400/[0.07] p-3 font-mono text-[9px] leading-4 text-amber-200/80">Profiles table missing — run supabase/schema.sql to enable trials and billing.</p>}

        {menuError && <p className="mb-3 rounded-xl border border-red-400/25 bg-red-400/[0.07] p-3 font-mono text-[9px] leading-4 text-red-300">{menuError}</p>}

        <div className="space-y-2">
          {!isPro && <button onClick={() => { setOpen(false); onUpgrade('account') }} className="primary-button w-full !py-2.5"><Sparkles className="h-3.5 w-3.5" /> Upgrade to Pro</button>}
          {profile?.stripe_customer_id && <button onClick={openPortal} disabled={portalLoading} className="secondary-button w-full justify-center disabled:opacity-50">
            {portalLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CreditCard className="h-3.5 w-3.5" />} Manage billing <ExternalLink className="h-3 w-3 opacity-50" />
          </button>}
          <button onClick={async () => { await signOut(); notify('Signed out. Saved ideas stay on this device.', 'info') }} className="secondary-button w-full justify-center"><LogOut className="h-3.5 w-3.5" /> Sign out</button>
        </div>

        <p className="mt-3 flex items-center gap-1.5 border-t border-white/10 pt-3 font-mono text-[9px] leading-4 text-slate-600"><User className="h-3 w-3 shrink-0" /> Pro gives unlimited scans + AI blueprints. Cancel anytime from billing.</p>
      </motion.div>}
    </AnimatePresence>
  </div>
}
