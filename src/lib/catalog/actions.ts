'use server'

import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { assertNoDbError } from '@/lib/errors'
import { parseInput } from '@/lib/validation'
import type { CatalogExercise, CatalogFacets } from '@/types'
import { CATALOG_COLUMNS, CATALOG_FACETS, toCatalogExercise } from './facets'
import { CATALOG_BROWSE_TTL_SECONDS, CATALOG_TEXT_SEARCH_TTL_SECONDS, cacheKeys, dataCache } from '@/lib/cache'
import { catalogExerciseSchema, exerciseIdSchema, exerciseSearchFiltersSchema, type ExerciseSearchFilters } from './schema'

const WHITESPACE_RUN = /\s+/g
const catalogSearchResultSchema = z.array(catalogExerciseSchema)

/**
 * Typo-tolerant, ranked catalog search; unset filters are ignored.
 * @throws DomainError('VALIDATION') for out-of-range filters.
 */
export async function searchExercises(filters: ExerciseSearchFilters): Promise<CatalogExercise[]> {
  const parsed = parseInput(exerciseSearchFiltersSchema, filters)
  // Search is case- and whitespace-insensitive, so normalising first lets equivalent queries share one cache entry.
  const normalized = { ...parsed, query: parsed.query?.toLowerCase().replace(WHITESPACE_RUN, ' ') || undefined }
  const ttlSeconds = normalized.query ? CATALOG_TEXT_SEARCH_TTL_SECONDS : CATALOG_BROWSE_TTL_SECONDS
  return dataCache.readThrough(cacheKeys.catalogSearch(JSON.stringify(normalized)), catalogSearchResultSchema, ttlSeconds, async () => {
    const supabase = await createClient()
    const { data, error } = await supabase.rpc('search_exercises', {
      p_query: normalized.query,
      p_muscle: normalized.muscle,
      p_equipment: normalized.equipment,
      p_level: normalized.level,
      p_mechanic: normalized.mechanic,
      p_category: normalized.category,
      p_limit: normalized.limit,
      p_offset: normalized.offset,
    })
    assertNoDbError(error, 'search exercises')
    return (data ?? []).map(toCatalogExercise)
  })
}

export async function getExercise(id: string): Promise<CatalogExercise | null> {
  const exerciseId = parseInput(exerciseIdSchema, id)
  const supabase = await createClient()
  const { data, error } = await supabase.from('exercises').select(CATALOG_COLUMNS).eq('id', exerciseId).maybeSingle()
  assertNoDbError(error, 'load exercise')
  return data && toCatalogExercise(data)
}

export async function getCatalogFacets(): Promise<CatalogFacets> {
  return CATALOG_FACETS
}
