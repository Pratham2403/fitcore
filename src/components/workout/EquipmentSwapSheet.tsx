'use client'

import Sheet from '@/components/ui/Sheet'
import type { ExerciseAlternative } from '@/types'

interface Props {
  open: boolean
  onClose: () => void
  exerciseName: string
  alternatives: ExerciseAlternative[]
  onSwap: (alternative: ExerciseAlternative) => void
  /** Catalog id of the alternative swapped in; null when none is. */
  currentSwapId: string | null
}

export default function EquipmentSwapSheet({ open, onClose, exerciseName, alternatives, onSwap, currentSwapId }: Props) {
  return (
    <Sheet open={open} onClose={onClose} title="Machine busy?">
      <div className="space-y-2">
        <p className="text-xs mb-3" style={{ color: 'var(--text-tertiary)' }}>
          Alternatives for {exerciseName}:
        </p>
        {alternatives.map(alternative => {
          const isActive = currentSwapId === alternative.id
          return (
            <button
              key={alternative.id}
              onClick={() => onSwap(alternative)}
              className="w-full text-left px-4 py-3 rounded-xl text-sm font-medium transition-colors flex items-center justify-between"
              style={{
                background: isActive ? 'rgba(245,158,11,0.1)' : 'var(--bg-surface)',
                color: isActive ? 'var(--accent-orange)' : 'var(--text-primary)',
                border: `1px solid ${isActive ? 'rgba(245,158,11,0.4)' : 'var(--border)'}`,
              }}
            >
              {alternative.name}
              {isActive && <span className="text-xs font-semibold ml-2" style={{ color: 'var(--accent-orange)' }}>Active ↕</span>}
            </button>
          )
        })}
      </div>
    </Sheet>
  )
}
