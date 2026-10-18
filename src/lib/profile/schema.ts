import { z } from 'zod'
import { CONSTRAINT_TYPES, EXPERIENCE_LEVELS } from '@/lib/enums'
import { CATALOG_EQUIPMENT } from '@/lib/catalog/facets'

export const SEXES = ['male', 'female', 'other'] as const
export const GOALS = ['build_muscle', 'lose_fat', 'get_stronger', 'general_fitness'] as const

const MIN_BODY_WEIGHT_KG = 30
const MAX_BODY_WEIGHT_KG = 250
const MAX_NAME = 60
const MAX_DETAIL = 200
const MAX_CONTRAINDICATIONS = 10
const MAX_ROM_DEGREES = 180
const MIN_AGE = 13
const MAX_AGE = 100
const MIN_HEIGHT_CM = 100
const MAX_HEIGHT_CM = 250
const MAX_TRAINING_DAYS = 7
const MIN_SESSION_MINUTES = 15
const MAX_SESSION_MINUTES = 180

export const bodyWeightSchema = z.number().min(MIN_BODY_WEIGHT_KG).max(MAX_BODY_WEIGHT_KG)
export const equipmentListSchema = z.array(z.enum(CATALOG_EQUIPMENT)).max(CATALOG_EQUIPMENT.length)
  .transform(items => Array.from(new Set(items)))

export const constraintInputSchema = z.object({
  constraintType: z.enum(CONSTRAINT_TYPES),
  detail: z.string().trim().max(MAX_DETAIL).nullish(),
  romCapDegrees: z.number().int().min(0).max(MAX_ROM_DEGREES).nullish(),
  contraindications: z.array(z.string().regex(/^[a-z_]{1,40}$/)).max(MAX_CONTRAINDICATIONS).default([]),
  priorityArea: z.boolean().default(false),
})
export const constraintListSchema = z.array(constraintInputSchema).max(CONSTRAINT_TYPES.length)
  .refine(items => new Set(items.map(item => item.constraintType)).size === items.length, 'Each constraint can be listed once')

export const profileInputSchema = z.object({
  name: z.string().trim().min(1).max(MAX_NAME),
  age: z.number().int().min(MIN_AGE).max(MAX_AGE),
  sex: z.enum(SEXES),
  heightCm: z.number().int().min(MIN_HEIGHT_CM).max(MAX_HEIGHT_CM),
  startingWeightKg: bodyWeightSchema,
  goal: z.enum(GOALS),
  experienceLevel: z.enum(EXPERIENCE_LEVELS),
  trainingDaysPerWeek: z.number().int().min(1).max(MAX_TRAINING_DAYS),
  sessionMinutes: z.number().int().min(MIN_SESSION_MINUTES).max(MAX_SESSION_MINUTES),
}).partial()

export const onboardingInputSchema = profileInputSchema.required({
  name: true, goal: true, experienceLevel: true, trainingDaysPerWeek: true, sessionMinutes: true,
}).extend({
  equipment: equipmentListSchema,
  constraints: constraintListSchema,
})

export type ConstraintInput = z.input<typeof constraintInputSchema>
export type ProfileInput = z.input<typeof profileInputSchema>
export type OnboardingInput = z.input<typeof onboardingInputSchema>
