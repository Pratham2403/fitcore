import type { LoggingMode, VolumeType } from '@/types'

/** The catalog columns that decide how an exercise is logged. */
export interface LoggingModeCatalogRow {
  force: string | null
  category: string
  equipment: string | null
  primaryMuscles: readonly string[]
}

const HOLD_FORCE = 'static'
const CARDIO_CATEGORY = 'cardio'
const BODYWEIGHT_EQUIPMENT = 'body only'
const CORE_MUSCLE = 'abdominals'

/**
 * Logging mode an exercise gets when the catalog alone decides it (e.g. a swapped-in alternative): holds and cardio
 * are timed, loaded equipment is weighted, bodyweight core work counts reps only, other bodyweight work is full bodyweight.
 */
export function toLoggingMode(row: LoggingModeCatalogRow): LoggingMode {
  if (row.force === HOLD_FORCE || row.category === CARDIO_CATEGORY) return { isTimed: true, volumeType: 'timed' }
  return { isTimed: false, volumeType: toRepVolumeType(row) }
}

/** How a rep-counted exercise's volume is tracked: loaded equipment is weighted, bodyweight core work reps only, other bodyweight work full bodyweight. */
export function toRepVolumeType(row: Pick<LoggingModeCatalogRow, 'equipment' | 'primaryMuscles'>): Exclude<VolumeType, 'timed'> {
  if (row.equipment !== null && row.equipment !== BODYWEIGHT_EQUIPMENT) return 'weighted'
  return row.primaryMuscles.includes(CORE_MUSCLE) ? 'reps_only' : 'bodyweight_full'
}
