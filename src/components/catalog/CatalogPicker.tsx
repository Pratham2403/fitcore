'use client'

import type { CatalogExercise } from '@/types'
import Sheet from '@/components/ui/Sheet'
import CatalogBrowser from './CatalogBrowser'

interface CatalogPickerProps {
  open: boolean
  onClose: () => void
  onPick: (exercise: CatalogExercise) => void
  title?: string
  selectedIds?: ReadonlySet<string>
}

/** Bottom sheet for choosing exercises from the catalog. */
export default function CatalogPicker({ open, onClose, onPick, title = 'Add exercise', selectedIds }: CatalogPickerProps) {
  return (
    <Sheet open={open} onClose={onClose} title={title}>
      <CatalogBrowser onSelect={onPick} selectedIds={selectedIds} />
    </Sheet>
  )
}
