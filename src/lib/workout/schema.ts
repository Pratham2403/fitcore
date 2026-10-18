import { z } from 'zod'
import type { LastSessionData } from '@/types'
import { BLOCK_TYPES, VOLUME_TYPES } from '@/lib/enums'
import { exerciseIdSchema } from '@/lib/catalog/schema'

const MAX_EXERCISE_NAME = 120
const MAX_SET_NUMBER = 50
const MAX_REPS = 1000
const MAX_WEIGHT_KG = 1000
const MAX_DURATION_SECS = 3600
const score = z.literal([1, 2, 3])

export const readinessSchema = z.object({ sleep: score, energy: score, soreness: score, protein: score })

export const setLogInputSchema = z.object({
  exercise_name: z.string().trim().min(1).max(MAX_EXERCISE_NAME),
  exercise_id: exerciseIdSchema,
  block_type: z.enum(BLOCK_TYPES).default('working'),
  set_number: z.number().int().min(1).max(MAX_SET_NUMBER),
  reps: z.number().int().min(0).max(MAX_REPS).optional(),
  weight_kg: z.number().min(0).max(MAX_WEIGHT_KG).optional(),
  is_timed: z.boolean(),
  /** Decides which personal record the set counts towards; not stored on the set. */
  volume_type: z.enum(VOLUME_TYPES),
  duration_secs: z.number().int().min(0).max(MAX_DURATION_SECS).optional(),
  rpe: score.optional(),
  side: z.enum(['left', 'right']).nullish(),
})

export const finalizeSessionSchema = z.object({
  readiness: readinessSchema.nullable(),
  startTime: z.number().int().positive(),
  workoutMood: score,
  energyMood: score,
})

export type SetLogInput = z.input<typeof setLogInputSchema>
export type FinalizeSessionInput = z.input<typeof finalizeSessionSchema>

const lastSessionSchema: z.ZodType<LastSessionData> = z.object({
  avgWeight: z.number(),
  avgReps: z.number(),
  perSetReps: z.array(z.object({ setNum: z.number(), reps: z.number() })).optional(),
  isPlateaued: z.boolean().optional(),
})

/** Shape of cached last-session data, keyed by catalog exercise id. */
export const lastSessionByExerciseSchema = z.record(z.string(), lastSessionSchema.nullable())
