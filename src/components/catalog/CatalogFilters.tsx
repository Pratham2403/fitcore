'use client'

import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import type { FacetKey, FacetSelection } from '@/hooks/useCatalogSearch'
import { ChevronDownIcon, CloseIcon } from '@/components/ui/Icon'
import { ToggleChip } from '@/components/ui/Chip'
import { DURATION, EASE } from '@/components/ui/motion'
import { FACETS, capitalize } from './catalogLabels'

interface CatalogFiltersProps {
  selection: FacetSelection
  onChange: (selection: FacetSelection) => void
}

/** Facet chips; each opens an inline single-select list of values. */
export default function CatalogFilters({ selection, onChange }: CatalogFiltersProps) {
  const [openFacet, setOpenFacet] = useState<FacetKey | null>(null)
  const activeFacet = FACETS.find(facet => facet.key === openFacet)
  const hasSelection = Object.values(selection).some(Boolean)

  function select(key: FacetKey, value: string) {
    onChange({ ...selection, [key]: selection[key] === value ? undefined : value })
    setOpenFacet(null)
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
        {FACETS.map(facet => {
          const value = selection[facet.key]
          const isOpen = openFacet === facet.key
          return (
            <button
              key={facet.key}
              type="button"
              aria-expanded={isOpen}
              onClick={() => setOpenFacet(isOpen ? null : facet.key)}
              className={`inline-flex min-h-11 shrink-0 items-center gap-1 rounded-full border px-3.5 text-sm font-medium transition-colors duration-150 ${
                value
                  ? 'border-[var(--accent-emerald)] bg-[var(--accent-emerald-soft)] text-[var(--accent-emerald-strong)]'
                  : 'border-[var(--border)] bg-[var(--bg-surface)] text-[var(--text-secondary)]'
              }`}
            >
              {value ? capitalize(value) : facet.label}
              <ChevronDownIcon size={16} className={`transition-transform duration-150 ${isOpen ? 'rotate-180' : ''}`} />
            </button>
          )
        })}
        {hasSelection && (
          <button
            type="button"
            onClick={() => onChange({})}
            className="inline-flex min-h-11 shrink-0 items-center gap-1 px-2 text-sm text-[var(--text-tertiary)] hover:text-[var(--text-primary)]"
          >
            <CloseIcon size={14} />
            Clear
          </button>
        )}
      </div>
      <AnimatePresence initial={false}>
        {activeFacet && (
          <motion.div
            key={activeFacet.key}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: DURATION.medium, ease: EASE.inOutCubic }}
            className="overflow-hidden"
          >
            <div role="group" aria-label={activeFacet.label} className="flex flex-wrap gap-2 pb-1">
              {activeFacet.values.map(value => (
                <ToggleChip
                  key={value}
                  isPressed={selection[activeFacet.key] === value}
                  onPressedChange={() => select(activeFacet.key, value)}
                >
                  {capitalize(value)}
                </ToggleChip>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
