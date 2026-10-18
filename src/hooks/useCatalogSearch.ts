'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { searchExercises } from '@/lib/catalog/actions'
import { CATALOG_CATEGORIES, CATALOG_EQUIPMENT, CATALOG_LEVELS, CATALOG_MECHANICS, CATALOG_MUSCLES } from '@/lib/catalog/facets'
import type { ExerciseSearchFilters } from '@/lib/catalog/schema'
import type { CatalogExercise } from '@/types'

export type FacetKey = 'muscle' | 'equipment' | 'level' | 'mechanic' | 'category'
/** At most one selected value per facet. */
export type FacetSelection = Partial<Record<FacetKey, string>>

function toSearchFilters(selection: FacetSelection): Pick<ExerciseSearchFilters, FacetKey> {
  return {
    muscle: CATALOG_MUSCLES.find(value => value === selection.muscle),
    equipment: CATALOG_EQUIPMENT.find(value => value === selection.equipment),
    level: CATALOG_LEVELS.find(value => value === selection.level),
    mechanic: CATALOG_MECHANICS.find(value => value === selection.mechanic),
    category: CATALOG_CATEGORIES.find(value => value === selection.category),
  }
}

const PAGE_SIZE = 30
const DEBOUNCE_MS = 250

type SearchStatus = 'loading' | 'ready' | 'error'

/** Debounced, paged catalog search; stale responses from superseded queries are dropped. */
export function useCatalogSearch() {
  const [query, setQuery] = useState('')
  const [filters, setFilters] = useState<FacetSelection>({})
  const [results, setResults] = useState<CatalogExercise[]>([])
  const [status, setStatus] = useState<SearchStatus>('loading')
  const [hasMore, setHasMore] = useState(false)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const latestRequest = useRef(0)

  const fetchPage = useCallback(async (offset: number) => {
    const requestId = ++latestRequest.current
    const page = await searchExercises({ query: query.trim() || undefined, ...toSearchFilters(filters), limit: PAGE_SIZE, offset })
    return { page, isCurrent: requestId === latestRequest.current }
  }, [query, filters])

  const runFirstPage = useCallback(async () => {
    setStatus('loading')
    try {
      const { page, isCurrent } = await fetchPage(0)
      if (!isCurrent) return
      setResults(page)
      setHasMore(page.length === PAGE_SIZE)
      setStatus('ready')
    } catch {
      setStatus('error')
    }
  }, [fetchPage])

  useEffect(() => {
    const timer = setTimeout(runFirstPage, DEBOUNCE_MS)
    return () => clearTimeout(timer)
  }, [runFirstPage])

  async function loadMore() {
    setIsLoadingMore(true)
    try {
      const { page, isCurrent } = await fetchPage(results.length)
      if (!isCurrent) return
      setResults(current => [...current, ...page])
      setHasMore(page.length === PAGE_SIZE)
    } catch {
      setStatus('error')
    } finally {
      setIsLoadingMore(false)
    }
  }

  return { query, setQuery, filters, setFilters, results, status, hasMore, isLoadingMore, loadMore, retry: runFirstPage }
}
