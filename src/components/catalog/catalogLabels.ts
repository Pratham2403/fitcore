import { CATALOG_FACETS } from '@/lib/catalog/facets'
import type { FacetKey } from '@/hooks/useCatalogSearch'

/** Facet name → label and allowed values, in display order. */
export const FACETS: readonly { key: FacetKey; label: string; values: readonly string[] }[] = [
  { key: 'muscle', label: 'Muscle', values: CATALOG_FACETS.muscles },
  { key: 'equipment', label: 'Equipment', values: CATALOG_FACETS.equipment },
  { key: 'level', label: 'Level', values: CATALOG_FACETS.levels },
  { key: 'mechanic', label: 'Type', values: CATALOG_FACETS.mechanics },
  { key: 'category', label: 'Category', values: CATALOG_FACETS.categories },
]

export function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1)
}
