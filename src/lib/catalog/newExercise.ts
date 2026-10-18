import { z } from 'zod'
import type { ExerciseRef } from '@/types'
import { MOVEMENT_PATTERNS } from '@/lib/enums'
import {
  CATALOG_CATEGORIES, CATALOG_EQUIPMENT, CATALOG_FORCES, CATALOG_LEVELS, CATALOG_MECHANICS, CATALOG_MUSCLES,
} from './facets'

export const MAX_EXERCISES_PER_REQUEST = 50
const MIN_NAME_LENGTH = 2
const MAX_NAME_LENGTH = 80
const MAX_INSTRUCTIONS = 30
const MAX_INSTRUCTION_LENGTH = 500
const MAX_POPULARITY = 3
/** The characters existing catalog names use; must start with a letter or digit so the slug is never empty. */
const EXERCISE_NAME_PATTERN = /^[A-Za-z0-9][A-Za-z0-9 ()'/,-]*$/
const WHITESPACE_RUN = /\s+/g
const NON_SLUG_RUN = /[^a-z0-9]+/g
const EDGE_UNDERSCORES = /^_+|_+$/g
const FITCORE_ID_PREFIX = 'fc_'

/** Catalog id for an app-authored exercise, e.g. "Nordic Hamstring Curl" → "fc_nordic_hamstring_curl". */
export function toExerciseId(name: string): string {
  return FITCORE_ID_PREFIX + name.toLowerCase().replace(NON_SLUG_RUN, '_').replace(EDGE_UNDERSCORES, '')
}

const hasNoDuplicates = (values: readonly string[]) => new Set(values).size === values.length

const exerciseNameSchema = z.string()
  .transform(name => name.trim().replace(WHITESPACE_RUN, ' '))
  .pipe(z.string().min(MIN_NAME_LENGTH).max(MAX_NAME_LENGTH)
    .regex(EXERCISE_NAME_PATTERN, "Name may only contain letters, digits, spaces and - ( ) ' / ,"))

const muscleListSchema = z.array(z.enum(CATALOG_MUSCLES)).refine(hasNoDuplicates, 'Muscles must not repeat')

/** One exercise to append; every key is required so only complete entries reach the catalog. */
const newExerciseSchema = z.strictObject({
  name: exerciseNameSchema,
  level: z.enum(CATALOG_LEVELS),
  category: z.enum(CATALOG_CATEGORIES),
  equipment: z.enum(CATALOG_EQUIPMENT),
  primaryMuscles: muscleListSchema.min(1),
  secondaryMuscles: muscleListSchema,
  instructions: z.array(z.string().trim().min(1).max(MAX_INSTRUCTION_LENGTH)).min(1).max(MAX_INSTRUCTIONS),
  mechanic: z.enum(CATALOG_MECHANICS).nullable(),
  force: z.enum(CATALOG_FORCES).nullable(),
  movementPattern: z.enum(MOVEMENT_PATTERNS),
  popularity: z.number().int().min(0).max(MAX_POPULARITY),
}).transform(exercise => ({ id: toExerciseId(exercise.name), ...exercise }))

/** A request batch; names that slug to the same id are rejected, since they would collide in the catalog. */
export const newExerciseBatchSchema = z.array(newExerciseSchema).min(1).max(MAX_EXERCISES_PER_REQUEST)
  .superRefine((exercises, context) => {
    const firstIndexById = new Map<string, number>()
    exercises.forEach((exercise, index) => {
      const firstIndex = firstIndexById.get(exercise.id)
      if (firstIndex === undefined) {
        firstIndexById.set(exercise.id, index)
        return
      }
      context.addIssue({ code: 'custom', path: [index, 'name'], message: `Duplicates the name of item ${firstIndex}` })
    })
  })

export type NewExercise = z.output<typeof newExerciseSchema>

export interface ExerciseConflict {
  id: string
  name: string
  /** The catalog row with the same id or the same case-insensitive name. */
  existing: ExerciseRef
}

/** Incoming exercises whose id or case-insensitive name is already in the catalog (mirrors the DB unique indexes). */
export function findConflicts(incoming: readonly NewExercise[], catalog: readonly ExerciseRef[]): ExerciseConflict[] {
  const byId = new Map(catalog.map(row => [row.id, row]))
  const byName = new Map(catalog.map(row => [row.name.toLowerCase(), row]))
  return incoming.flatMap(({ id, name }) => {
    const existing = byId.get(id) ?? byName.get(name.toLowerCase())
    return existing ? [{ id, name, existing }] : []
  })
}
