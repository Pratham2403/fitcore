import { z } from 'zod'
import { CONSTRAINT_ACTIONS, CONSTRAINT_TYPES, PROTOCOLS, VOLUME_TYPES } from '@/lib/enums'
import type { ConstraintWarning, Exercise, WeeklyProgram } from '@/types'
import type { StoredWorkoutPlan } from './queries'
import { exerciseIdSchema } from '@/lib/catalog/schema'

const MAX_WORKOUT_NAME = 60
const MAX_FOCUS = 120
const MAX_DISPLAY_NAME = 80
const MAX_NOTES = 1000
const MAX_SETS = 10
const MAX_REST_SECS = 600
const MAX_WEIGHT_KG = 500
const MAX_DURATION_SECS = 3600
const MAX_ALTERNATIVES = 5
const MAX_EXERCISES_PER_WORKOUT = 30
/** "10", "10–12" / "10-12", "45s", "45–60s", or "AMRAP". */
const REPS_PATTERN = /^(AMRAP|\d{1,3}([–-]\d{1,3})?s?)$/

export const uuidSchema = z.uuid()
export const dayOfWeekSchema = z.literal([0, 1, 2, 3, 4, 5, 6])

export const workoutInputSchema = z.object({
  name: z.string().trim().min(1).max(MAX_WORKOUT_NAME),
  focus: z.string().trim().max(MAX_FOCUS).default(''),
  protocol: z.enum(PROTOCOLS),
})

export const workoutExerciseInputSchema = z.object({
  exerciseId: exerciseIdSchema,
  /** Label override; omit to use the catalog name. */
  displayName: z.string().trim().min(1).max(MAX_DISPLAY_NAME).nullish(),
  sets: z.number().int().min(1).max(MAX_SETS),
  reps: z.string().trim().regex(REPS_PATTERN, 'Reps must look like 10, 8–12, 45s or AMRAP'),
  restSecs: z.number().int().min(0).max(MAX_REST_SECS),
  defaultWeightKg: z.number().min(0).max(MAX_WEIGHT_KG).default(0),
  isUnilateral: z.boolean().default(false),
  isMandatory: z.boolean().default(false),
  isTimed: z.boolean().default(false),
  durationSecs: z.number().int().min(1).max(MAX_DURATION_SECS).nullish(),
  isAssistance: z.boolean().default(false),
  volumeType: z.enum(VOLUME_TYPES).default('weighted'),
  notes: z.string().trim().max(MAX_NOTES).default(''),
  alternativeExerciseIds: z.array(exerciseIdSchema).max(MAX_ALTERNATIVES).default([]),
}).refine(exercise => exercise.isTimed === (exercise.volumeType === 'timed'), {
  message: 'A timed exercise must use the timed volume type, and only a timed one may',
  path: ['volumeType'],
})

export const workoutExerciseListSchema = z.array(workoutExerciseInputSchema).max(MAX_EXERCISES_PER_WORKOUT)

export type WorkoutInput = z.input<typeof workoutInputSchema>
export type WorkoutExerciseInput = z.input<typeof workoutExerciseInputSchema>

const workoutSummarySchema = z.object({
  id: z.string(),
  name: z.string(),
  focus: z.string(),
  protocol: z.enum(PROTOCOLS),
  exerciseCount: z.number(),
})

/** A WeeklyProgram as cached: the workout limit depends on the clock, so the subscription's paid-until date is stored instead. */
export type StoredWeeklyProgram = Omit<WeeklyProgram, 'workoutLimit'> & { paidUntil: string | null }

export const storedWeeklyProgramSchema: z.ZodType<StoredWeeklyProgram> = z.object({
  schedule: z.object({
    0: workoutSummarySchema.nullable(),
    1: workoutSummarySchema.nullable(),
    2: workoutSummarySchema.nullable(),
    3: workoutSummarySchema.nullable(),
    4: workoutSummarySchema.nullable(),
    5: workoutSummarySchema.nullable(),
    6: workoutSummarySchema.nullable(),
  }),
  workouts: z.array(workoutSummarySchema),
  paidUntil: z.string().nullable(),
})

const exerciseRefSchema = z.object({ id: z.string(), name: z.string() })
const exerciseAlternativeSchema = exerciseRefSchema.extend({ isTimed: z.boolean(), volumeType: z.enum(VOLUME_TYPES) })

const constraintWarningSchema: z.ZodType<ConstraintWarning> = z.object({
  constraintType: z.enum(CONSTRAINT_TYPES),
  action: z.enum(CONSTRAINT_ACTIONS),
  warning: z.string(),
  rationale: z.string(),
  safeAlternative: exerciseRefSchema.optional(),
})

const exerciseSchema: z.ZodType<Exercise> = z.object({
  id: z.string(),
  exerciseId: z.string(),
  name: z.string(),
  sets: z.number(),
  reps: z.string(),
  restSecs: z.number(),
  isTimed: z.boolean(),
  durationSecs: z.number().optional(),
  isUnilateral: z.boolean(),
  isMandatory: z.boolean(),
  defaultWeightKg: z.number(),
  isAssistance: z.boolean(),
  volumeType: z.enum(VOLUME_TYPES),
  notes: z.string(),
  alternatives: z.array(exerciseAlternativeSchema),
  savedAlternativeIds: z.array(z.string()),
  muscleGroups: z.array(z.string()),
  warnings: z.array(constraintWarningSchema),
  imageUrls: z.array(z.string()),
})

/** Shape of a cached plan; null caches "not found / not yours". */
export const storedWorkoutPlanSchema: z.ZodType<StoredWorkoutPlan | null> = z.object({
  id: z.string(),
  name: z.string(),
  focus: z.string(),
  protocol: z.enum(PROTOCOLS),
  exercises: z.array(exerciseSchema),
}).nullable()
