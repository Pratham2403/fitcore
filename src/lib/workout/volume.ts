import type { SetLog, Exercise } from '@/types'

/** Total volume in kg: only sets where weight_kg > 0 contribute. */
export function calculateTotalVolume(sets: SetLog[]): number {
  return sets.reduce((sum, s) => {
    const w = s.weight_kg ?? 0
    return sum + (w > 0 ? (s.reps ?? 0) * w : 0)
  }, 0)
}

/** Total reps across exercises classified as reps_only (e.g. Lying Leg Raises, Russian Twists). */
export function calculateCoreReps(sets: SetLog[], exercises: Exercise[]): number {
  return sets.reduce((sum, s) => {
    const ex = exercises.find(e => e.name === s.exercise_name)
    return sum + (ex?.volumeType === 'reps_only' ? (s.reps ?? 0) : 0)
  }, 0)
}
