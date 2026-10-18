'use client'

import { useCatalogSearch } from '@/hooks/useCatalogSearch'
import type { CatalogExercise } from '@/types'
import Button from '@/components/ui/Button'
import EmptyState from '@/components/ui/EmptyState'
import { Input } from '@/components/ui/Field'
import { CheckIcon, SearchIcon } from '@/components/ui/Icon'
import Skeleton from '@/components/ui/Skeleton'
import CatalogFilters from './CatalogFilters'
import ExerciseThumb from './ExerciseThumb'
import { capitalize } from './catalogLabels'

const SKELETON_ROWS = 6

interface CatalogBrowserProps {
  onSelect: (exercise: CatalogExercise) => void
  /** Ids to mark as already chosen. */
  selectedIds?: ReadonlySet<string>
}

function describe(exercise: CatalogExercise): string {
  return [exercise.primaryMuscles.map(capitalize).join(', '), exercise.equipment && capitalize(exercise.equipment)]
    .filter(Boolean)
    .join(' · ')
}

/** Search box, facet filters and a paged result list over the exercise catalog. */
export default function CatalogBrowser({ onSelect, selectedIds }: CatalogBrowserProps) {
  const { query, setQuery, filters, setFilters, results, status, hasMore, isLoadingMore, loadMore, retry } = useCatalogSearch()

  return (
    <div className="flex flex-col gap-3">
      <Input
        label="Search exercises"
        type="search"
        enterKeyHint="search"
        placeholder="Try “goblet squat” or “row”"
        value={query}
        onChange={event => setQuery(event.target.value)}
        trailing={<SearchIcon size={18} className="mr-3 text-[var(--text-tertiary)]" />}
      />
      <CatalogFilters selection={filters} onChange={setFilters} />
      {status === 'loading' && (
        <ul aria-busy className="flex flex-col gap-2">
          {Array.from({ length: SKELETON_ROWS }, (_, index) => (
            <li key={index} className="flex items-center gap-3">
              <Skeleton className="h-12 w-12" />
              <div className="flex flex-1 flex-col gap-2">
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-3 w-1/3" />
              </div>
            </li>
          ))}
        </ul>
      )}
      {status === 'error' && (
        <div className="flex flex-col items-center gap-3 py-8 text-center">
          <p className="text-sm text-[var(--text-secondary)]">Couldn’t load exercises. Check your connection.</p>
          <Button variant="secondary" size="sm" onClick={retry}>Try again</Button>
        </div>
      )}
      {status === 'ready' && results.length === 0 && (
        <EmptyState icon={<SearchIcon />} title="No matches" description="Try a shorter search or clear a filter." />
      )}
      {status === 'ready' && results.length > 0 && (
        <ul className="flex flex-col">
          {results.map(exercise => {
            const isSelected = selectedIds?.has(exercise.id) ?? false
            return (
              <li key={exercise.id}>
                <button
                  type="button"
                  onClick={() => onSelect(exercise)}
                  aria-pressed={selectedIds ? isSelected : undefined}
                  className="flex min-h-16 w-full items-center gap-3 rounded-[var(--radius-md)] px-1 py-2 text-left transition-colors duration-150 hover:bg-[var(--bg-surface)]"
                >
                  <ExerciseThumb name={exercise.name} imageUrls={exercise.imageUrls} size="sm" />
                  <span className="flex min-w-0 flex-1 flex-col">
                    <span className="truncate text-sm font-semibold text-[var(--text-primary)]">{exercise.name}</span>
                    <span className="truncate text-xs text-[var(--text-tertiary)]">{describe(exercise)}</span>
                  </span>
                  {isSelected && <CheckIcon size={18} className="shrink-0 text-[var(--accent-emerald)]" />}
                </button>
              </li>
            )
          })}
        </ul>
      )}
      {status === 'ready' && hasMore && (
        <Button variant="secondary" isFullWidth isLoading={isLoadingMore} loadingLabel="Loading…" onClick={loadMore}>
          Show more
        </Button>
      )}
    </div>
  )
}
