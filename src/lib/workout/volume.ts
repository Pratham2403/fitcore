import type { SetLog, Exercise } from '@/types'

/** Total volume in kg: only sets where weight_kg > 0 contribute. */
export function calculateTotalVolume(sets: SetLog[]): number {
  return sets.reduce((sum, s) => {
    const w = s.weight_kg ?? 0
    return sum + (w > 0 ? (s.reps ?? 0) * w : 0)
  }, 0)
}

/** Total reps of sets logged as reps_only (e.g. Lying Leg Raises, Russian Twists), including swapped-in alternatives. */
export function calculateCoreReps(sets: SetLog[], exercises: Exercise[]): number {
  return sets.reduce((sum, s) => {
    const loggedAs = exercises.find(e => e.exerciseId === s.exercise_id || e.name === s.exercise_name)
      ?? exercises.flatMap(e => e.alternatives).find(alternative => alternative.id === s.exercise_id)
    return sum + (loggedAs?.volumeType === 'reps_only' ? (s.reps ?? 0) : 0)
  }, 0)
}
