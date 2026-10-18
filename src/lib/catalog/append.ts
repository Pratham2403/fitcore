import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'
import type { ExerciseRef } from '@/types'
import { DomainError, requireDbData } from '@/lib/errors'
import { selectAllPages } from '@/lib/supabase/paging'
import { findConflicts, type ExerciseConflict, type NewExercise } from './newExercise'

const UNIQUE_VIOLATION = '23505'

export type AppendExercisesResult =
  | { kind: 'appended'; exercises: ExerciseRef[] }
  | { kind: 'conflict'; conflicts: ExerciseConflict[] }

/**
 * Appends a batch to the catalog all-or-nothing; any id or name already present rejects the whole batch.
 * The client's own RLS decides who may insert.
 * @throws DomainError('CONFLICT') when a concurrent append claims an id or name after the conflict check.
 */
export async function appendExercises(
  supabase: SupabaseClient<Database>,
  exercises: readonly NewExercise[],
): Promise<AppendExercisesResult> {
  const catalog = await selectAllPages(
    (from, to) => supabase.from('exercises').select('id, name').order('id').range(from, to),
    'load catalog names',
  )
  const conflicts = findConflicts(exercises, catalog)
  if (conflicts.length > 0) return { kind: 'conflict', conflicts }

  // One multi-row INSERT is one statement, so the batch commits or fails as a whole.
  const result = await supabase.from('exercises').insert(exercises.map(exercise => ({
    id: exercise.id,
    name: exercise.name,
    level: exercise.level,
    category: exercise.category,
    equipment: exercise.equipment,
    primary_muscles: exercise.primaryMuscles,
    secondary_muscles: exercise.secondaryMuscles,
    instructions: exercise.instructions,
    mechanic: exercise.mechanic,
    force: exercise.force,
    movement_pattern: exercise.movementPattern,
    popularity: exercise.popularity,
    source: 'fitcore',
  }))).select('id, name')
  if (result.error?.code === UNIQUE_VIOLATION) {
    throw new DomainError('CONFLICT', 'Another request just added one of these exercises. Nothing was saved; retry to see which.')
  }
  return { kind: 'appended', exercises: requireDbData(result, 'append exercises') }
}
