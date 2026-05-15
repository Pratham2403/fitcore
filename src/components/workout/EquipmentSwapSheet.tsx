'use client'

import BottomSheet from '@/components/ui/BottomSheet'

interface Props {
  open: boolean
  onClose: () => void
  exerciseName: string
  alternatives: string[]
  onSwap: (alt: string) => void
}

export default function EquipmentSwapSheet({ open, onClose, exerciseName, alternatives, onSwap }: Props) {
  return (
    <BottomSheet open={open} onClose={onClose} title="Machine busy?">
      <div className="space-y-2">
        <p className="text-xs mb-3" style={{ color: 'var(--text-tertiary)' }}>
          Swap {exerciseName} with:
        </p>
        {alternatives.map(alt => (
          <button
            key={alt}
            onClick={() => { onSwap(alt); onClose() }}
            className="w-full text-left px-4 py-3 rounded-xl text-sm font-medium transition-colors"
            style={{ background: 'var(--bg-surface)', color: 'var(--text-primary)', border: '1px solid var(--border)' }}
          >
            {alt}
          </button>
        ))}
      </div>
    </BottomSheet>
  )
}
