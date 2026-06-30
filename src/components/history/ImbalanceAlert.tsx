import type { ImbalanceResult } from '@/lib/analytics/imbalance'

interface Props {
  imbalances: ImbalanceResult[]
}

export default function ImbalanceAlert({ imbalances }: Props) {
  if (!imbalances.length) return null

  return (
    <div className="space-y-2">
      {imbalances.map(({ exerciseName, leftAvg, rightAvg, asymmetryPct, dominantSide }) => {
        const weakSide = dominantSide === 'left' ? 'right' : 'left'
        return (
          <div
            key={exerciseName}
            className="rounded-2xl p-4"
            style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)' }}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{exerciseName}</p>
                <div className="flex gap-4 mt-1.5">
                  <span className="text-xs" style={{ color: dominantSide === 'left' ? '#10B981' : 'var(--text-secondary)' }}>
                    L {leftAvg} kg
                  </span>
                  <span className="text-xs" style={{ color: dominantSide === 'right' ? '#10B981' : 'var(--text-secondary)' }}>
                    R {rightAvg} kg
                  </span>
                </div>
                <p className="text-xs mt-1.5" style={{ color: 'var(--text-tertiary)' }}>
                  Focus extra reps on your {weakSide} side to close the gap.
                </p>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-base font-bold" style={{ color: '#EF4444' }}>{asymmetryPct}%</p>
                <p className="text-[10px]" style={{ color: 'var(--text-tertiary)' }}>imbalance</p>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
