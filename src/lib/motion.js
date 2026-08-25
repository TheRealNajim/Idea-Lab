// Single source of truth for motion timing. Six surfaces animate in this app and
// they had each grown their own duration/easing, which is why transitions read as
// uneven. Keep new animations on these tokens so retuning stays a one-file edit.

// Mirrors --ease-smooth in styles.css. Strong ease-out: quick to leave, slow to
// settle, which is what makes travel over distance feel smooth rather than linear.
export const EASE_SMOOTH = [0.22, 1, 0.36, 1]
// Gentler ease-out for short fades and colour changes.
export const EASE_OUT = [0.33, 1, 0.68, 1]

// Micro-interactions live at ~200ms. Anything past ~400ms stops reading as
// "smooth" and starts reading as "slow", so entrances are capped at 360ms.
export const DURATION = { fast: 0.18, base: 0.24, slow: 0.34 }

export const FADE = { duration: DURATION.base, ease: EASE_OUT }
export const ENTER = { duration: DURATION.slow, ease: EASE_SMOOTH }
export const EXIT = { duration: DURATION.fast, ease: EASE_OUT }

// Springs are reserved for elements that travel a long way (drawers) or that
// react to a pointer (hover lift), where a velocity curve beats a fixed duration.
// restDelta is raised off the default so px-based springs stop a frame or two
// earlier instead of grinding out imperceptible sub-pixel movement.
export const SPRING_DRAWER = { type: 'spring', stiffness: 300, damping: 32, mass: 0.9, restDelta: 0.5 }
export const SPRING_LAYOUT = { type: 'spring', stiffness: 400, damping: 38, mass: 0.9, restDelta: 0.5 }
export const SPRING_HOVER = { type: 'spring', stiffness: 400, damping: 30, mass: 0.6, restDelta: 0.1 }
export const SPRING_BANNER = { type: 'spring', stiffness: 260, damping: 26, mass: 0.9, restDelta: 0.5 }

// The randomiser has to keep three things in lockstep: the domain text keyframes,
// the moment App swaps in the new domains, and the icon revolution. Exported in ms
// because the state swap is driven by setTimeout.
export const SPIN_MS = 520
// Swap the labels at the dimmest point of the keyframe so the second half of the
// animation reveals the *new* value instead of snapping to it at the end.
export const SPIN_SWAP_MS = Math.round(SPIN_MS * 0.42)
