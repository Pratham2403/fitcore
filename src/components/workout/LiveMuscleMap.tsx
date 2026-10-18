'use client'

import type { Exercise, SetLog, WarmupExercise, StretchExercise } from '@/types'
import { UI_MUSCLE_GROUPS, type UiMuscleGroup } from '@/lib/muscles'

type Phase = 'warmup' | 'workout' | 'stretch'

interface LiveMuscleMapProps {
  phase: Phase
  loggedSets: SetLog[]
  completedWarmups: string[]
  completedStretches: string[]
  exercises: Exercise[]
  warmupExercises: WarmupExercise[]
  stretchExercises: StretchExercise[]
}

interface MuscleFill {
  color: string
  opacity: number
}

const IDLE_FILL: MuscleFill = { color: '#333333', opacity: 1 }
const WARMED_COLOR = '#3B82F6'
const STRETCHED_COLOR = '#10B981'
const WARMED_OPACITY = 0.55
const STRETCHED_OPACITY = 0.85
const MIN_WORKING_OPACITY = 0.45
/** Heat ramp for working volume: amber → orange → red. */
const HEAT_STOPS = [[245, 158, 11], [249, 115, 22], [239, 68, 68]] as const
const OUTLINE = '#444444'
const FILL_TRANSITION = 'fill 450ms cubic-bezier(.645,.045,.355,1), fill-opacity 450ms cubic-bezier(.645,.045,.355,1)'

function isUiMuscleGroup(muscle: string): muscle is UiMuscleGroup {
  return UI_MUSCLE_GROUPS.some(group => group === muscle)
}

function musclesOf(names: readonly string[], source: ReadonlyArray<{ name: string; muscleGroups?: string[] }>): Set<UiMuscleGroup> {
  return new Set(names.flatMap(name => source.find(item => item.name === name)?.muscleGroups ?? []).filter(isUiMuscleGroup))
}

/** Work done by a set: load × reps for weighted sets, seconds for timed holds, reps otherwise. */
function setWork(set: SetLog): number {
  if (set.is_timed) return set.duration_secs ?? 0
  const reps = set.reps ?? 0
  return set.weight_kg && set.weight_kg > 0 ? reps * set.weight_kg : reps
}

/** Per-muscle working volume, normalised so the most-worked muscle is 1. */
function workingIntensity(loggedSets: readonly SetLog[], exercises: readonly Exercise[]): Map<UiMuscleGroup, number> {
  const totals = new Map<UiMuscleGroup, number>()
  for (const set of loggedSets) {
    // A swapped-in alternative trains its plan exercise's main muscle, so its sets count towards that exercise
    const exercise = exercises.find(candidate => candidate.exerciseId === set.exercise_id || candidate.name === set.exercise_name)
      ?? exercises.find(candidate => candidate.alternatives.some(alternative => alternative.id === set.exercise_id))
    for (const muscle of (exercise?.muscleGroups ?? []).filter(isUiMuscleGroup)) {
      totals.set(muscle, (totals.get(muscle) ?? 0) + setWork(set))
    }
  }
  const max = Math.max(0, ...Array.from(totals.values()))
  if (max === 0) return new Map()
  return new Map(Array.from(totals, ([muscle, total]) => [muscle, total / max]))
}

function heatColor(intensity: number): string {
  const scaled = intensity * (HEAT_STOPS.length - 1)
  const index = Math.min(Math.floor(scaled), HEAT_STOPS.length - 2)
  const mix = scaled - index
  const [from, to] = [HEAT_STOPS[index], HEAT_STOPS[index + 1]]
  const channel = (position: number) => Math.round(from[position] + (to[position] - from[position]) * mix)
  return `rgb(${channel(0)},${channel(1)},${channel(2)})`
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <div className="h-3 w-3 rounded-sm" style={{ background: color }} />
      <span className="text-[11px] text-[var(--text-tertiary)]">{label}</span>
    </div>
  )
}

const LEGENDS: Record<Phase, ReadonlyArray<{ color: string; label: string }>> = {
  warmup: [{ color: WARMED_COLOR, label: 'Warmed up' }],
  workout: [{ color: heatColor(0), label: 'Light' }, { color: heatColor(0.5), label: 'Moderate' }, { color: heatColor(1), label: 'Most worked' }],
  stretch: [{ color: heatColor(1), label: 'Worked' }, { color: STRETCHED_COLOR, label: 'Stretched' }],
}

/**
 * Body map for the current session: warm-up tints warmed muscles one colour, working sets ramp each muscle by its
 * share of the volume, and the stretch phase replaces worked muscles with a single "stretched" colour.
 */
export default function LiveMuscleMap({
  phase, loggedSets, completedWarmups, completedStretches, exercises, warmupExercises, stretchExercises,
}: LiveMuscleMapProps) {
  const warmed = musclesOf(completedWarmups, warmupExercises)
  const worked = workingIntensity(loggedSets, exercises)
  const stretched = musclesOf(completedStretches, stretchExercises)

  function fillFor(muscle: UiMuscleGroup): MuscleFill {
    if (phase === 'stretch' && stretched.has(muscle)) return { color: STRETCHED_COLOR, opacity: STRETCHED_OPACITY }
    const intensity = worked.get(muscle)
    if (phase !== 'warmup' && intensity !== undefined) {
      return { color: heatColor(intensity), opacity: MIN_WORKING_OPACITY + intensity * (1 - MIN_WORKING_OPACITY) }
    }
    if (warmed.has(muscle)) return { color: WARMED_COLOR, opacity: WARMED_OPACITY }
    return IDLE_FILL
  }

  // A plain render helper (not a component) so elements persist across renders and the fill transition can run.
  function muscle(group: UiMuscleGroup, shape: React.ReactNode) {
    const { color, opacity } = fillFor(group)
    return (
      <g fill={color} fillOpacity={opacity} stroke={OUTLINE} strokeWidth={1} style={{ transition: FILL_TRANSITION }}>
        {shape}
      </g>
    )
  }

  return (
    <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4">
      <p className="mb-3 text-xs font-medium text-[var(--text-secondary)]">Live muscle activation</p>
      <div className="flex justify-center gap-6" role="img" aria-label="Front and back body map showing which muscles this session has worked">
        <svg width="80" height="160" viewBox="0 0 80 160" fill="none" aria-hidden>
          <ellipse cx="40" cy="14" rx="11" ry="13" fill={IDLE_FILL.color} />
          <rect x="36" y="25" width="8" height="8" rx="2" fill={IDLE_FILL.color} />
          {muscle('shoulders', <><ellipse cx="18" cy="38" rx="10" ry="8" /><ellipse cx="62" cy="38" rx="10" ry="8" /></>)}
          {muscle('chest', <path d="M25 33 Q40 28 55 33 L58 52 Q40 58 22 52 Z" />)}
          {muscle('biceps', <><ellipse cx="12" cy="58" rx="7" ry="14" /><ellipse cx="68" cy="58" rx="7" ry="14" /></>)}
          {muscle('forearms', <><ellipse cx="10" cy="82" rx="5" ry="12" /><ellipse cx="70" cy="82" rx="5" ry="12" /></>)}
          {muscle('core', <rect x="29" y="53" width="22" height="32" rx="4" />)}
          {muscle('quads', <><ellipse cx="32" cy="110" rx="10" ry="22" /><ellipse cx="48" cy="110" rx="10" ry="22" /></>)}
          {muscle('calves', <><ellipse cx="32" cy="146" rx="7" ry="11" /><ellipse cx="48" cy="146" rx="7" ry="11" /></>)}
        </svg>
        <svg width="80" height="160" viewBox="0 0 80 160" fill="none" aria-hidden>
          <ellipse cx="40" cy="14" rx="11" ry="13" fill={IDLE_FILL.color} />
          <rect x="36" y="25" width="8" height="8" rx="2" fill={IDLE_FILL.color} />
          {muscle('shoulders', <><ellipse cx="18" cy="38" rx="10" ry="8" /><ellipse cx="62" cy="38" rx="10" ry="8" /></>)}
          {muscle('back', <path d="M22 32 Q40 28 58 32 L62 68 Q40 72 18 68 Z" />)}
          {muscle('triceps', <><ellipse cx="12" cy="58" rx="7" ry="14" /><ellipse cx="68" cy="58" rx="7" ry="14" /></>)}
          {muscle('forearms', <><ellipse cx="10" cy="82" rx="5" ry="12" /><ellipse cx="70" cy="82" rx="5" ry="12" /></>)}
          {muscle('glutes', <path d="M26 87 Q40 82 54 87 L56 108 Q40 114 24 108 Z" />)}
          {muscle('hamstrings', <><ellipse cx="32" cy="120" rx="10" ry="20" /><ellipse cx="48" cy="120" rx="10" ry="20" /></>)}
          {muscle('calves', <><ellipse cx="32" cy="148" rx="8" ry="10" /><ellipse cx="48" cy="148" rx="8" ry="10" /></>)}
        </svg>
      </div>
      <div className="mt-3 flex flex-wrap items-center justify-center gap-4">
        {LEGENDS[phase].map(legend => <Legend key={legend.label} color={legend.color} label={legend.label} />)}
      </div>
    </div>
  )
}
