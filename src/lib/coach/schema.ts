import { z } from 'zod'
import { CONSTRAINT_ACTIONS, CONSTRAINT_TYPES, EXPERIENCE_LEVELS, PROTOCOLS } from '@/lib/enums'
import { CATALOG_EQUIPMENT } from '@/lib/catalog/facets'
import { exerciseIdSchema } from '@/lib/catalog/schema'
import { dayOfWeekSchema } from '@/lib/program/schema'
import type { CoachDay } from './types'

export const COACH_GOALS = ['build_muscle', 'lose_fat', 'get_stronger', 'general_fitness'] as const

const MIN_SESSION_MINUTES = 15
const MAX_SESSION_MINUTES = 180
const MAX_PREFERRED_EXERCISES = 10
const MAX_USER_TEXT = 500
const MAX_SUMMARY = 600
const MAX_DAY_NAME = 60
const MAX_FOCUS = 120
const MAX_RATIONALE = 240
const MIN_SETS = 1
const MAX_SETS = 6
const MIN_REST_SECS = 20
const MAX_REST_SECS = 300
export const MIN_EXERCISES_PER_DAY = 3
const MAX_EXERCISES_PER_DAY = 10
/** Same format as program reps: "10", "8–12", "45s", "30–45s" or "AMRAP". */
const REPS_PATTERN = /^(AMRAP|\d{1,3}([–-]\d{1,3})?s?)$/

export const buildIdSchema = z.uuid()
export const feedbackSchema = z.string().trim().max(MAX_USER_TEXT)

export const coachBuildInputSchema = z.object({
  goal: z.enum(COACH_GOALS),
  experience: z.enum(EXPERIENCE_LEVELS),
  daysPerWeek: z.number().int().min(1).max(7),
  sessionMinutes: z.number().int().min(MIN_SESSION_MINUTES).max(MAX_SESSION_MINUTES),
  equipment: z.array(z.enum(CATALOG_EQUIPMENT)),
  constraints: z.array(z.object({ constraintType: z.enum(CONSTRAINT_TYPES) }))
    .refine(
      constraints => new Set(constraints.map(constraint => constraint.constraintType)).size === constraints.length,
      'Each constraint can only be listed once',
    ),
  preferredExerciseIds: z.array(exerciseIdSchema).max(MAX_PREFERRED_EXERCISES),
  freeText: z.string().trim().max(MAX_USER_TEXT).default(''),
})

export const substitutionDecisionSchema = z.object({
  /** The substituted-in exercise id the decision applies to. */
  exerciseId: exerciseIdSchema,
  dayOfWeek: dayOfWeekSchema,
  decision: z.enum(['approve', 'reject']),
})

export const substitutionDecisionListSchema = z.array(substitutionDecisionSchema)

export type CoachBuildInput = z.input<typeof coachBuildInputSchema>
export type ParsedCoachBuildInput = z.output<typeof coachBuildInputSchema>
export type SubstitutionDecision = z.input<typeof substitutionDecisionSchema>

/** Shape the model must return; ids are checked against the candidate list separately. */
export const llmDraftSchema = z.object({
  summary: z.string().trim().min(1).max(MAX_SUMMARY),
  days: z.array(z.object({
    dayOfWeek: dayOfWeekSchema,
    name: z.string().trim().min(1).max(MAX_DAY_NAME),
    focus: z.string().trim().max(MAX_FOCUS),
    protocol: z.enum(PROTOCOLS),
    exercises: z.array(z.object({
      exerciseId: z.string(),
      sets: z.number().int().min(MIN_SETS).max(MAX_SETS),
      reps: z.string().trim().regex(REPS_PATTERN),
      restSecs: z.number().int().min(MIN_REST_SECS).max(MAX_REST_SECS),
      rationale: z.string().trim().max(MAX_RATIONALE),
    })).min(MIN_EXERCISES_PER_DAY).max(MAX_EXERCISES_PER_DAY),
  })).min(1).max(7),
})

export type LlmDraft = z.output<typeof llmDraftSchema>

const constraintWarningSchema = z.object({
  constraintType: z.enum(CONSTRAINT_TYPES),
  action: z.enum(CONSTRAINT_ACTIONS),
  warning: z.string(),
  rationale: z.string(),
  safeAlternative: z.object({ id: z.string(), name: z.string() }).optional(),
})

const coachDaySchema = z.object({
  dayOfWeek: dayOfWeekSchema,
  name: z.string(),
  focus: z.string(),
  protocol: z.enum(PROTOCOLS),
  exercises: z.array(z.object({
    exerciseId: z.string(),
    name: z.string(),
    sets: z.number(),
    reps: z.string(),
    restSecs: z.number(),
    rationale: z.string(),
    isMandatory: z.boolean(),
    warnings: z.array(constraintWarningSchema),
    substitution: z.object({
      originalExerciseId: z.string(),
      originalName: z.string(),
      constraintType: z.enum(CONSTRAINT_TYPES),
      rationale: z.string(),
      status: z.enum(['pending', 'approved', 'rejected']),
    }).optional(),
  })),
}) satisfies z.ZodType<CoachDay>

/** The ai_builds.plan document. */
export const storedPlanSchema = z.object({
  summary: z.string(),
  days: z.array(coachDaySchema),
  /** Exercise ids the model was allowed to use. */
  candidateIds: z.array(z.string()),
  /** Original exercise ids whose constraint substitution the user approved. */
  approvedOriginalIds: z.array(z.string()),
  /** Ids removed from the candidates because the user rejected a substitution involving them. */
  excludedExerciseIds: z.array(z.string()),
})

export type StoredPlan = z.output<typeof storedPlanSchema>
