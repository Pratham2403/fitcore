import type { ActionResult, CatalogExercise } from '@/types'
import { getWorkoutPlan, saveWorkoutExercises } from '@/lib/program/actions'
import { fromCatalogExercise, fromPlanExercise, toExerciseInput } from '@/components/builder/draft'

/** Adds a catalog exercise to the end of a workout, with the builder's smart defaults. */
export async function appendToWorkout(workoutId: string, exercise: CatalogExercise): Promise<ActionResult<void>> {
  const plan = await getWorkoutPlan(workoutId)
  if (!plan) return { ok: false, error: { code: 'NOT_FOUND', message: 'Workout not found.' } }
  const items = [...plan.exercises.map(fromPlanExercise), fromCatalogExercise(exercise)].map(toExerciseInput)
  return saveWorkoutExercises(workoutId, items)
}
