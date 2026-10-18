import { toRepVolumeType } from '@/lib/program/loggingMode'
import type { VolumeType } from '@/types'
import type { CoachDay } from './types'

const HOLD_REPS_SUFFIX = 's'
const ASSISTED_EXERCISE_PREFIX = 'fc_assisted'
const DEFAULT_WEIGHT_KG = 0

/** The catalog fields that decide how a rep-counted exercise's volume is tracked. */
export interface PlanCatalogRow {
  equipment: string | null
  primary_muscles: string[]
}

interface VolumeFields {
  isTimed: boolean
  durationSecs: number | null
  volumeType: VolumeType
}

// The plan's reps format decides the mode: a hold ("30s", "30-45s") is timed at its lower bound, anything else is counted in reps.
function toVolumeFields(reps: string, exercise: PlanCatalogRow): VolumeFields {
  if (reps.endsWith(HOLD_REPS_SUFFIX)) return { isTimed: true, durationSecs: Number.parseInt(reps, 10), volumeType: 'timed' }
  const volumeType = toRepVolumeType({ equipment: exercise.equipment, primaryMuscles: exercise.primary_muscles })
  return { isTimed: false, durationSecs: null, volumeType }
}

/**
 * Maps plan days to the `save_coach_plan` payload: one workout per day, in day order, with its exercises.
 * @throws Error if a plan exercise is missing from `catalogById` (plans only ever reference catalog ids).
 */
export function toSavePlanDays(days: readonly CoachDay[], catalogById: ReadonlyMap<string, PlanCatalogRow>) {
  return days.map(day => ({
    day_of_week: day.dayOfWeek,
    name: day.name,
    focus: day.focus,
    protocol: day.protocol,
    exercises: day.exercises.map((exercise, orderIndex) => {
      const catalogRow = catalogById.get(exercise.exerciseId)
      if (!catalogRow) throw new Error(`Plan exercise missing from catalog: ${exercise.exerciseId}`)
      const volume = toVolumeFields(exercise.reps, catalogRow)
      return {
        order_index: orderIndex,
        exercise_id: exercise.exerciseId,
        sets: exercise.sets,
        reps: exercise.reps,
        rest_secs: exercise.restSecs,
        default_weight_kg: DEFAULT_WEIGHT_KG,
        is_unilateral: false,
        is_mandatory: exercise.isMandatory,
        is_timed: volume.isTimed,
        duration_secs: volume.durationSecs,
        is_assistance: exercise.exerciseId.startsWith(ASSISTED_EXERCISE_PREFIX),
        volume_type: volume.volumeType,
        notes: exercise.rationale,
      }
    }),
  }))
}
