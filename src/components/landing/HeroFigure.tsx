'use client'

import { useEffect, useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { DURATION, EASE } from '@/components/ui/motion'

type Phase = 'warmup' | 'work' | 'stretch'
type Muscle = 'shoulders' | 'chest' | 'biceps' | 'forearms' | 'core' | 'quads' | 'calves'

const PHASES: readonly Phase[] = ['warmup', 'work', 'stretch']
const PHASE_LABEL: Record<Phase, string> = { warmup: 'Warm-up', work: 'Working', stretch: 'Stretch' }
const PHASE_INTERVAL_MS = 2800
const STATIC_PHASE: Phase = 'work'
const KNEE_PULSE = { duration: 1.8, repeatDelay: 0.6, maxScale: 2.1 } as const

const PRIMED = '#F59E0B'
const MID = '#F97316'
const PEAK = '#EF4444'
const STRETCHED = '#10B981'
const IDLE = '#2B2B2B'
const OUTLINE = '#3A3A3A'

interface Tint {
  color: string
  opacity: number
}

const IDLE_TINT: Tint = { color: IDLE, opacity: 1 }

// A legs session: quads take the load while the knee stays capped
const PHASE_TINTS: Record<Phase, Partial<Record<Muscle, Tint>>> = {
  warmup: {
    quads: { color: PRIMED, opacity: 0.55 },
    calves: { color: PRIMED, opacity: 0.55 },
    core: { color: PRIMED, opacity: 0.45 },
    shoulders: { color: PRIMED, opacity: 0.35 },
  },
  work: {
    quads: { color: PEAK, opacity: 0.95 },
    calves: { color: MID, opacity: 0.8 },
    core: { color: PRIMED, opacity: 0.6 },
    shoulders: { color: PRIMED, opacity: 0.3 },
  },
  stretch: {
    quads: { color: STRETCHED, opacity: 0.85 },
    calves: { color: STRETCHED, opacity: 0.75 },
    core: { color: STRETCHED, opacity: 0.45 },
    chest: { color: STRETCHED, opacity: 0.4 },
  },
}

const MUSCLE_PATHS: Record<Muscle, readonly string[]> = {
  shoulders: [
    'M88 90C74 88 64 96 62 112c0 8 4 14 8 16 2-12 8-24 20-30Z',
    'M152 90c14-2 24 6 26 22 0 8-4 14-8 16-2-12-8-24-20-30Z',
  ],
  chest: [
    'M118 94c-14-2-26 2-28 6-6 10-4 24 2 30 10 6 22 4 26-2Z',
    'M122 94c14-2 26 2 28 6 6 10 4 24-2 30-10 6-22 4-26-2Z',
  ],
  biceps: [
    'M66 130c-6 12-8 28-6 42 4 4 10 4 14 0 4-14 4-28 2-42-3-3-7-3-10 0Z',
    'M174 130c6 12 8 28 6 42-4 4-10 4-14 0-4-14-4-28-2-42 3-3 7-3 10 0Z',
  ],
  forearms: [
    'M58 180c-6 16-8 34-6 50 3 3 8 3 10 0 6-16 10-34 10-50-4-4-10-4-14 0Z',
    'M182 180c6 16 8 34 6 50-3 3-8 3-10 0-6-16-10-34-10-50 4-4 10-4 14 0Z',
  ],
  core: [
    'M106 140h12v15h-12ZM122 140h12v15h-12ZM106 159h12v15h-12ZM122 159h12v15h-12ZM107 178h11v18h-11ZM122 178h11v18h-11Z',
    'M94 136c-2 20 0 44 8 68h2v-66Z',
    'M146 136c2 20 0 44-8 68h-2v-66Z',
  ],
  quads: [
    'M98 210c-10 18-12 52-8 86 4 8 16 10 22 2 6-26 6-58 2-76-4-8-10-14-16-12Z',
    'M142 210c10 18 12 52 8 86-4 8-16 10-22 2-6-26-6-58-2-76 4-8 10-14 16-12Z',
  ],
  calves: [
    'M92 328c-6 22-4 48 2 70 4 4 10 4 12 0 4-22 6-48 2-70-4-4-12-4-16 0Z',
    'M148 328c6 22 4 48-2 70-4 4-10 4-12 0-4-22-6-48-2-70 4-4 12-4 16 0Z',
  ],
}

const MUSCLES = Object.keys(MUSCLE_PATHS) as Muscle[]
const KNEES = [{ cx: 100, cy: 314 }, { cx: 140, cy: 314 }] as const

/** Animated front-view body cycling through the app's warm-up → working → stretch muscle map, with a protected knee. */
export default function HeroFigure() {
  const shouldReduceMotion = useReducedMotion()
  const [phaseIndex, setPhaseIndex] = useState(PHASES.indexOf(STATIC_PHASE))

  useEffect(() => {
    if (shouldReduceMotion) return
    const interval = setInterval(() => setPhaseIndex(index => (index + 1) % PHASES.length), PHASE_INTERVAL_MS)
    return () => clearInterval(interval)
  }, [shouldReduceMotion])

  const phase = PHASES[phaseIndex]

  return (
    <figure className="relative mx-auto w-full max-w-[340px]">
      <div
        aria-hidden
        className="absolute inset-x-6 top-10 bottom-16 rounded-full bg-[radial-gradient(closest-side,rgba(16,185,129,0.18),transparent)] blur-2xl"
      />
      <svg
        viewBox="0 0 240 430"
        className="relative h-auto w-full"
        role="img"
        aria-label="Body diagram showing muscles lighting up through warm-up, working sets and stretch, with the knees marked as protected"
      >
        <g fill={IDLE} stroke={OUTLINE} strokeWidth="1">
          <ellipse cx="120" cy="46" rx="22" ry="27" />
          <path d="M110 70h20l3 16h-26Z" />
          <path d="M107 82q13-4 26 0l19 10q-32-2-64 0Z" />
          <path d="M100 206h40l-8 22q-12 8-24 0Z" />
          <circle cx="55" cy="242" r="7" />
          <circle cx="185" cy="242" r="7" />
          <ellipse cx="98" cy="412" rx="10" ry="5" />
          <ellipse cx="142" cy="412" rx="10" ry="5" />
        </g>

        {MUSCLES.map(muscle => {
          const tint = PHASE_TINTS[phase][muscle] ?? IDLE_TINT
          return MUSCLE_PATHS[muscle].map(path => (
            <motion.path
              key={path}
              d={path}
              stroke={OUTLINE}
              strokeWidth="1"
              initial={false}
              animate={{ fill: tint.color, fillOpacity: tint.opacity }}
              transition={{ duration: DURATION.illustrative, ease: EASE.inOutCubic }}
            />
          ))
        })}

        {KNEES.map(knee => (
          <g key={knee.cx}>
            <circle cx={knee.cx} cy={knee.cy} r="9" fill={IDLE} stroke={STRETCHED} strokeWidth="1.5" />
            <motion.circle
              cx={knee.cx}
              cy={knee.cy}
              r="9"
              fill="none"
              stroke={STRETCHED}
              strokeWidth="1.5"
              style={{ transformOrigin: `${knee.cx}px ${knee.cy}px` }}
              animate={shouldReduceMotion ? undefined : { scale: [1, KNEE_PULSE.maxScale], opacity: [0.7, 0] }}
              transition={{ duration: KNEE_PULSE.duration, ease: EASE.outQuart, repeat: Infinity, repeatDelay: KNEE_PULSE.repeatDelay }}
            />
          </g>
        ))}
        <path d="M149 314h26" stroke={STRETCHED} strokeWidth="1.2" strokeDasharray="2 3" />
      </svg>

      <div className="absolute right-0 top-[69%] -translate-y-1/2 rounded-xl border border-[var(--accent-emerald-line)] bg-[var(--bg-elevated)] px-3 py-2 shadow-[0_8px_24px_rgba(0,0,0,0.4)] sm:-right-4">
        <p className="text-[10px] font-medium uppercase tracking-wider text-[var(--accent-emerald)]">Knee protocol</p>
        <p className="font-mono text-xs text-[var(--text-primary)]">Stop at 90°</p>
      </div>

      <figcaption aria-hidden className="relative mt-4 flex justify-center gap-1 text-xs font-medium">
        {PHASES.map(item => (
          <span
            key={item}
            className={`rounded-full px-3 py-1 transition-colors duration-300 ${
              item === phase ? 'bg-[var(--bg-elevated)] text-[var(--text-primary)]' : 'text-[var(--text-tertiary)]'
            }`}
          >
            {PHASE_LABEL[item]}
          </span>
        ))}
      </figcaption>
    </figure>
  )
}
