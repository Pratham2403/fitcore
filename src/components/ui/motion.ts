import type { Transition } from 'framer-motion'

/** Durations in seconds, mirroring the --dur-* CSS tokens. */
export const DURATION = {
  micro: 0.12,
  small: 0.18,
  medium: 0.24,
  large: 0.3,
  illustrative: 0.9,
} as const

/** Cubic-bezier curves, mirroring the --ease-* CSS tokens. */
export const EASE = {
  outQuart: [0.165, 0.84, 0.44, 1],
  outExpo: [0.19, 1, 0.22, 1],
  inOutCubic: [0.645, 0.045, 0.355, 1],
} as const

/** Springs for interruptible or gesture-driven motion; no bounce by default. */
export const SPRING = {
  snappy: { type: 'spring', stiffness: 520, damping: 42, mass: 0.8 },
  sheet: { type: 'spring', stiffness: 380, damping: 38 },
} as const satisfies Record<string, Transition>

/** Standard enter transition for small/medium surfaces (popovers, toasts). */
export const ENTER: Transition = { duration: DURATION.small, ease: EASE.outQuart }

/** Exits run faster than enters so dismissed UI gets out of the way. */
export const EXIT: Transition = { duration: DURATION.micro, ease: EASE.outQuart }
