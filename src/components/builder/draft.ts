import type { CatalogExercise, ConstraintWarning, Exercise, VolumeType } from '@/types'
import { workoutExerciseInputSchema, type WorkoutExerciseInput } from '@/lib/program/schema'

/** One exercise as edited in the builder; `key` is stable across reorders. */
export interface DraftExercise {
  key: string
  exerciseId: string
  /** Label shown in the builder (override or catalog name). */
  name: string
  /** Label override sent to the server; null keeps the catalog name. */
  displayName: string | null
  sets: number
  reps: string
  restSecs: number
  defaultWeightKg: number
  isUnilateral: boolean
  isMandatory: boolean
  isTimed: boolean
  durationSecs: number | null
  isAssistance: boolean
  volumeType: VolumeType
  notes: string
  alternativeExerciseIds: string[]
  warnings: ConstraintWarning[]
  imageUrls: string[]
  /** Added since the last save, so constraint warnings are not known yet. */
  isUnsaved: boolean
}

const COMPOUND_DEFAULTS = { sets: 3, reps: '6–12', restSecs: 90 } as const
const ISOLATION_DEFAULTS = { sets: 3, reps: '12–15', restSecs: 60 } as const
const BODYWEIGHT_EQUIPMENT = 'body only'

export function fromPlanExercise(exercise: Exercise): DraftExercise {
  return {
    key: exercise.id,
    exerciseId: exercise.exerciseId,
    name: exercise.name,
    displayName: exercise.name,
    sets: exercise.sets,
    reps: exercise.reps,
    restSecs: exercise.restSecs,
    defaultWeightKg: exercise.defaultWeightKg,
    isUnilateral: exercise.isUnilateral,
    isMandatory: exercise.isMandatory,
    isTimed: exercise.isTimed,
    durationSecs: exercise.durationSecs ?? null,
    isAssistance: exercise.isAssistance,
    volumeType: exercise.volumeType,
    notes: exercise.notes,
    alternativeExerciseIds: exercise.savedAlternativeIds,
    warnings: exercise.warnings,
    imageUrls: exercise.imageUrls,
    isUnsaved: false,
  }
}

/** Sets how a row counts toward volume; a timed volume is what makes the row log hold durations. */
export function withVolumeType(draft: DraftExercise, volumeType: VolumeType): DraftExercise {
  return { ...draft, volumeType, isTimed: volumeType === 'timed' }
}

/** New builder row with smart defaults: compounds 3 × 6–12 / 90s, isolations 3 × 12–15 / 60s. */
export function fromCatalogExercise(exercise: CatalogExercise): DraftExercise {
  const defaults = exercise.mechanic === 'compound' ? COMPOUND_DEFAULTS : ISOLATION_DEFAULTS
  return {
    key: crypto.randomUUID(),
    exerciseId: exercise.id,
    name: exercise.name,
    displayName: null,
    ...defaults,
    defaultWeightKg: 0,
    isUnilateral: false,
    isMandatory: false,
    isTimed: false,
    durationSecs: null,
    isAssistance: false,
    volumeType: exercise.equipment === BODYWEIGHT_EQUIPMENT ? 'bodyweight_full' : 'weighted',
    notes: '',
    alternativeExerciseIds: [],
    warnings: [],
    imageUrls: exercise.imageUrls,
    isUnsaved: true,
  }
}

export function toExerciseInput(draft: DraftExercise): WorkoutExerciseInput {
  return {
    exerciseId: draft.exerciseId,
    displayName: draft.displayName?.trim() || null,
    sets: draft.sets,
    reps: draft.reps,
    restSecs: draft.restSecs,
    defaultWeightKg: draft.defaultWeightKg,
    isUnilateral: draft.isUnilateral,
    isMandatory: draft.isMandatory,
    isTimed: draft.isTimed,
    durationSecs: draft.isTimed ? draft.durationSecs : null,
    isAssistance: draft.isAssistance,
    volumeType: draft.volumeType,
    notes: draft.notes,
    alternativeExerciseIds: draft.alternativeExerciseIds,
  }
}

const FIELD_MESSAGES: Record<string, string> = {
  reps: 'Reps must look like 10, 8–12, 45s or AMRAP.',
  sets: 'Sets must be 1–10.',
  restSecs: 'Rest must be 0–600 seconds.',
  defaultWeightKg: 'Weight must be 0–500 kg.',
  durationSecs: 'Duration must be 1–3600 seconds.',
  displayName: 'Name must be 1–80 characters.',
  notes: 'Notes can be up to 1000 characters.',
}
const GENERIC_MESSAGE = 'Check this exercise’s settings.'

/** First validation problem for a draft row, in plain language; null when valid. */
export function validateDraft(draft: DraftExercise): string | null {
  if (draft.isTimed && !draft.durationSecs) return FIELD_MESSAGES.durationSecs
  const result = workoutExerciseInputSchema.safeParse(toExerciseInput(draft))
  if (result.success) return null
  const field = result.error.issues[0]?.path[0]
  return (typeof field === 'string' && FIELD_MESSAGES[field]) || GENERIC_MESSAGE
}
