'use client'

import type { Exercise, SetLog, WarmupExercise, StretchExercise } from '@/types'

interface Props {
  phase: 'warmup' | 'workout' | 'stretch'
  loggedSets: SetLog[]
  completedWarmups: string[]
  completedStretches: string[]
  exercises: Exercise[]
  warmupExercises: WarmupExercise[]
  stretchExercises: StretchExercise[]
}

const MUSCLE_GROUPS = [
  'chest', 'shoulders', 'triceps', 'biceps', 'forearms',
  'back', 'core', 'quads', 'hamstrings', 'glutes', 'calves',
] as const

type MuscleGroup = typeof MUSCLE_GROUPS[number]

function buildWarmupIntensity(completedWarmups: string[], warmupExercises: WarmupExercise[]): Map<MuscleGroup, number> {
  const intensity = new Map<MuscleGroup, number>()
  for (const name of completedWarmups) {
    const ex = warmupExercises.find(w => w.name === name)
    for (const mg of ex?.muscleGroups ?? []) {
      if (MUSCLE_GROUPS.includes(mg as MuscleGroup)) {
        intensity.set(mg as MuscleGroup, 0.5)
      }
    }
  }
  return intensity
}

function buildWorkoutIntensity(loggedSets: SetLog[], exercises: Exercise[]): Map<MuscleGroup, number> {
  const raw = new Map<MuscleGroup, number>()
  for (const s of loggedSets) {
    const ex = exercises.find(e => e.name === s.exercise_name)
    if (!ex) continue
    const contribution = s.weight_kg && s.weight_kg > 0 ? (s.reps ?? 0) * s.weight_kg : (s.reps ?? 0)
    for (const mg of ex.muscleGroups) {
      if (MUSCLE_GROUPS.includes(mg as MuscleGroup)) {
        raw.set(mg as MuscleGroup, (raw.get(mg as MuscleGroup) ?? 0) + contribution)
      }
    }
  }
  if (raw.size === 0) return raw
  const max = Math.max(...Array.from(raw.values()))
  const normalized = new Map<MuscleGroup, number>()
  Array.from(raw.entries()).forEach(([mg, val]) => {
    normalized.set(mg, max > 0 ? val / max : 0)
  })
  return normalized
}

function buildStretchIntensity(completedStretches: string[], stretchExercises: StretchExercise[]): Set<MuscleGroup> {
  const stretched = new Set<MuscleGroup>()
  for (const name of completedStretches) {
    const ex = stretchExercises.find(s => s.name === name)
    for (const mg of ex?.muscleGroups ?? []) {
      if (MUSCLE_GROUPS.includes(mg as MuscleGroup)) {
        stretched.add(mg as MuscleGroup)
      }
    }
  }
  return stretched
}

// Interpolate between yellow → orange → red based on t ∈ [0, 1]
function heatColor(t: number): string {
  if (t < 0.5) {
    // yellow (#F59E0B) → orange (#F97316)
    const r = Math.round(245 + (249 - 245) * (t / 0.5))
    const g = Math.round(158 + (115 - 158) * (t / 0.5))
    const b = Math.round(11 + (22 - 11) * (t / 0.5))
    return `rgb(${r},${g},${b})`
  }
  // orange (#F97316) → red (#EF4444)
  const u = (t - 0.5) / 0.5
  const r = Math.round(249 + (239 - 249) * u)
  const g = Math.round(115 + (68 - 115) * u)
  const b = Math.round(22 + (68 - 22) * u)
  return `rgb(${r},${g},${b})`
}

function getFill(
  mg: MuscleGroup,
  phase: Props['phase'],
  warmupIntensity: Map<MuscleGroup, number>,
  workoutIntensity: Map<MuscleGroup, number>,
  stretchedMuscles: Set<MuscleGroup>,
): { color: string; opacity: number } {
  const EMERALD = '#10B981'
  const YELLOW = '#F59E0B'

  if (phase === 'stretch') {
    if (stretchedMuscles.has(mg)) return { color: EMERALD, opacity: 0.9 }
    const wi = workoutIntensity.get(mg) ?? 0
    if (wi > 0) return { color: heatColor(wi), opacity: 0.6 }
    if (warmupIntensity.has(mg)) return { color: YELLOW, opacity: 0.4 }
    return { color: '#333', opacity: 1 }
  }

  if (phase === 'workout') {
    const wi = workoutIntensity.get(mg) ?? 0
    if (wi > 0) return { color: heatColor(wi), opacity: 0.5 + wi * 0.5 }
    if (warmupIntensity.has(mg)) return { color: YELLOW, opacity: 0.35 }
    return { color: '#333', opacity: 1 }
  }

  // warmup phase
  if (warmupIntensity.has(mg)) return { color: YELLOW, opacity: 0.5 }
  return { color: '#333', opacity: 1 }
}

export default function LiveMuscleMap({
  phase, loggedSets, completedWarmups, completedStretches,
  exercises, warmupExercises, stretchExercises,
}: Props) {
  const warmupIntensity = buildWarmupIntensity(completedWarmups, warmupExercises)
  const workoutIntensity = buildWorkoutIntensity(loggedSets, exercises)
  const stretchedMuscles = buildStretchIntensity(completedStretches, stretchExercises)

  function f(mg: MuscleGroup) {
    return getFill(mg, phase, warmupIntensity, workoutIntensity, stretchedMuscles)
  }

  return (
    <div className="rounded-2xl p-4" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}>
      <p className="text-xs font-medium mb-3" style={{ color: 'var(--text-secondary)' }}>Live muscle activation</p>
      <div className="flex justify-center gap-6">
        {/* Front */}
        <svg width="80" height="160" viewBox="0 0 80 160" fill="none" xmlns="http://www.w3.org/2000/svg">
          <ellipse cx="40" cy="14" rx="11" ry="13" fill="#333" />
          <rect x="36" y="25" width="8" height="8" rx="2" fill="#333" />
          <ellipse cx="18" cy="38" rx="10" ry="8" fill={f('shoulders').color} fillOpacity={f('shoulders').opacity} stroke="#444" strokeWidth="1" />
          <ellipse cx="62" cy="38" rx="10" ry="8" fill={f('shoulders').color} fillOpacity={f('shoulders').opacity} stroke="#444" strokeWidth="1" />
          <path d="M25 33 Q40 28 55 33 L58 52 Q40 58 22 52 Z" fill={f('chest').color} fillOpacity={f('chest').opacity} stroke="#444" strokeWidth="1" />
          <ellipse cx="12" cy="58" rx="7" ry="14" fill={f('biceps').color} fillOpacity={f('biceps').opacity} stroke="#444" strokeWidth="1" />
          <ellipse cx="68" cy="58" rx="7" ry="14" fill={f('biceps').color} fillOpacity={f('biceps').opacity} stroke="#444" strokeWidth="1" />
          <ellipse cx="10" cy="82" rx="5" ry="12" fill={f('forearms').color} fillOpacity={f('forearms').opacity} stroke="#444" strokeWidth="1" />
          <ellipse cx="70" cy="82" rx="5" ry="12" fill={f('forearms').color} fillOpacity={f('forearms').opacity} stroke="#444" strokeWidth="1" />
          <rect x="29" y="53" width="22" height="32" rx="4" fill={f('core').color} fillOpacity={f('core').opacity} stroke="#444" strokeWidth="1" />
          <ellipse cx="32" cy="110" rx="10" ry="22" fill={f('quads').color} fillOpacity={f('quads').opacity} stroke="#444" strokeWidth="1" />
          <ellipse cx="48" cy="110" rx="10" ry="22" fill={f('quads').color} fillOpacity={f('quads').opacity} stroke="#444" strokeWidth="1" />
          <ellipse cx="32" cy="146" rx="7" ry="11" fill={f('calves').color} fillOpacity={f('calves').opacity} stroke="#444" strokeWidth="1" />
          <ellipse cx="48" cy="146" rx="7" ry="11" fill={f('calves').color} fillOpacity={f('calves').opacity} stroke="#444" strokeWidth="1" />
        </svg>

        {/* Back */}
        <svg width="80" height="160" viewBox="0 0 80 160" fill="none" xmlns="http://www.w3.org/2000/svg">
          <ellipse cx="40" cy="14" rx="11" ry="13" fill="#333" />
          <rect x="36" y="25" width="8" height="8" rx="2" fill="#333" />
          <ellipse cx="18" cy="38" rx="10" ry="8" fill={f('shoulders').color} fillOpacity={f('shoulders').opacity} stroke="#444" strokeWidth="1" />
          <ellipse cx="62" cy="38" rx="10" ry="8" fill={f('shoulders').color} fillOpacity={f('shoulders').opacity} stroke="#444" strokeWidth="1" />
          <path d="M22 32 Q40 28 58 32 L62 68 Q40 72 18 68 Z" fill={f('back').color} fillOpacity={f('back').opacity} stroke="#444" strokeWidth="1" />
          <ellipse cx="12" cy="58" rx="7" ry="14" fill={f('triceps').color} fillOpacity={f('triceps').opacity} stroke="#444" strokeWidth="1" />
          <ellipse cx="68" cy="58" rx="7" ry="14" fill={f('triceps').color} fillOpacity={f('triceps').opacity} stroke="#444" strokeWidth="1" />
          <ellipse cx="10" cy="82" rx="5" ry="12" fill={f('forearms').color} fillOpacity={f('forearms').opacity} stroke="#444" strokeWidth="1" />
          <ellipse cx="70" cy="82" rx="5" ry="12" fill={f('forearms').color} fillOpacity={f('forearms').opacity} stroke="#444" strokeWidth="1" />
          <path d="M26 87 Q40 82 54 87 L56 108 Q40 114 24 108 Z" fill={f('glutes').color} fillOpacity={f('glutes').opacity} stroke="#444" strokeWidth="1" />
          <ellipse cx="32" cy="120" rx="10" ry="20" fill={f('hamstrings').color} fillOpacity={f('hamstrings').opacity} stroke="#444" strokeWidth="1" />
          <ellipse cx="48" cy="120" rx="10" ry="20" fill={f('hamstrings').color} fillOpacity={f('hamstrings').opacity} stroke="#444" strokeWidth="1" />
          <ellipse cx="32" cy="148" rx="8" ry="10" fill={f('calves').color} fillOpacity={f('calves').opacity} stroke="#444" strokeWidth="1" />
          <ellipse cx="48" cy="148" rx="8" ry="10" fill={f('calves').color} fillOpacity={f('calves').opacity} stroke="#444" strokeWidth="1" />
        </svg>
      </div>

      <div className="flex items-center gap-4 mt-3 justify-center flex-wrap">
        {phase === 'warmup' && (
          <Legend color="#F59E0B" label="Primed" />
        )}
        {phase === 'workout' && (
          <>
            <Legend color="#F59E0B" label="Low" />
            <Legend color="#F97316" label="Mid" />
            <Legend color="#EF4444" label="Peak" />
          </>
        )}
        {phase === 'stretch' && (
          <>
            <Legend color="#EF4444" label="Worked" />
            <Legend color="#10B981" label="Stretched" />
          </>
        )}
      </div>
    </div>
  )
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <div className="w-3 h-3 rounded-sm" style={{ background: color }} />
      <span className="text-[10px]" style={{ color: 'var(--text-tertiary)' }}>{label}</span>
    </div>
  )
}
