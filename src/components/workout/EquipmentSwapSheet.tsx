'use client'

import BottomSheet from '@/components/ui/BottomSheet'

interface Props {
  open: boolean
  onClose: () => void
  exerciseName: string
  alternatives: string[]
  onSwap: (alt: string) => void
  currentSwap: string | null
}

export default function EquipmentSwapSheet({ open, onClose, exerciseName, alternatives, onSwap, currentSwap }: Props) {
  return (
    <BottomSheet open={open} onClose={onClose} title="Machine busy?">
      <div className="space-y-2">
        <p className="text-xs mb-3" style={{ color: 'var(--text-tertiary)' }}>
          Alternatives for {exerciseName}:
        </p>
        {alternatives.map(alt => {
          const isActive = currentSwap === alt
          return (
            <button
              key={alt}
              onClick={() => onSwap(alt)}
              className="w-full text-left px-4 py-3 rounded-xl text-sm font-medium transition-colors flex items-center justify-between"
              style={{
                background: isActive ? 'rgba(245,158,11,0.1)' : 'var(--bg-surface)',
                color: isActive ? 'var(--accent-orange)' : 'var(--text-primary)',
                border: `1px solid ${isActive ? 'rgba(245,158,11,0.4)' : 'var(--border)'}`,
              }}
            >
              {alt}
              {isActive && <span className="text-xs font-semibold ml-2" style={{ color: 'var(--accent-orange)' }}>Active ↕</span>}
            </button>
          )
        })}
      </div>
    </BottomSheet>
  )
}
