import { z } from 'zod'
import type { CatalogExercise } from '@/types'
import { CATALOG_CATEGORIES, CATALOG_EQUIPMENT, CATALOG_LEVELS, CATALOG_MECHANICS, CATALOG_MUSCLES } from './facets'

const MAX_QUERY_LENGTH = 100
const MAX_PAGE_SIZE = 50
const DEFAULT_PAGE_SIZE = 30
/** Past the end of the ~900-row catalog; bounds the cacheable key space. */
const MAX_OFFSET = 1000

/** Mirrors the exercises.id CHECK constraint. */
export const exerciseIdSchema = z.string().trim().min(1).max(120).regex(/^[A-Za-z0-9_-]+$/, 'Invalid exercise id')

export const exerciseSearchFiltersSchema = z.object({
  query: z.string().trim().max(MAX_QUERY_LENGTH).optional(),
  muscle: z.enum(CATALOG_MUSCLES).optional(),
  equipment: z.enum(CATALOG_EQUIPMENT).optional(),
  level: z.enum(CATALOG_LEVELS).optional(),
  mechanic: z.enum(CATALOG_MECHANICS).optional(),
  category: z.enum(CATALOG_CATEGORIES).optional(),
  limit: z.number().int().min(1).max(MAX_PAGE_SIZE).default(DEFAULT_PAGE_SIZE),
  offset: z.number().int().min(0).max(MAX_OFFSET).default(0),
})

export type ExerciseSearchFilters = z.input<typeof exerciseSearchFiltersSchema>

/** Shape of a cached CatalogExercise. */
export const catalogExerciseSchema: z.ZodType<CatalogExercise> = z.object({
  id: z.string(),
  name: z.string(),
  force: z.string().nullable(),
  level: z.string(),
  mechanic: z.string().nullable(),
  equipment: z.string().nullable(),
  primaryMuscles: z.array(z.string()),
  secondaryMuscles: z.array(z.string()),
  instructions: z.array(z.string()),
  category: z.string(),
  imageUrls: z.array(z.string()),
  source: z.enum(['free-exercise-db', 'fitcore']),
})
