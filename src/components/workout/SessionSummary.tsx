'use client'

interface Props {
  dayLabel: string
  durationMin: number
  totalVolume: number
  prCount: number
  wellnessScore: number
  streakCount: number
  onClose: () => void
}

export default function SessionSummary({
  dayLabel, durationMin, totalVolume, prCount, wellnessScore, streakCount, onClose,
}: Props) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ background: 'rgba(15,15,15,0.96)' }}>
      <div className="w-full max-w-sm rounded-3xl p-6 space-y-4"
        style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>

        <div className="text-center">
          <div className="text-4xl mb-3">🏆</div>
          <h2 className="text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>Session complete!</h2>
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>{dayLabel}</p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <StatBox label="Duration" value={`${durationMin}m`} />
          <StatBox label="Volume" value={`${Math.round(totalVolume).toLocaleString()} kg`} />
          <StatBox label="PRs hit" value={prCount.toString()} highlight={prCount > 0} />
          <StatBox label="Wellness" value={wellnessScore.toFixed(1)} />
        </div>

        {streakCount > 0 && (
          <div className="text-center py-3 rounded-2xl"
            style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)' }}>
            <p className="text-sm font-semibold" style={{ color: 'var(--accent-orange)' }}>
              🔥 {streakCount} day streak!
            </p>
          </div>
        )}

        <button
          onClick={onClose}
          className="w-full py-3 rounded-2xl text-sm font-semibold"
          style={{ background: 'var(--accent-emerald)', color: '#fff' }}
        >
          Done
        </button>
      </div>
    </div>
  )
}

function StatBox({ label, value, highlight = false }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="rounded-2xl p-3 text-center" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}>
      <p className="text-xl font-mono font-semibold" style={{ color: highlight ? 'var(--accent-orange)' : 'var(--text-primary)' }}>
        {value}
      </p>
      <p className="text-xs mt-0.5" style={{ color: 'var(--text-tertiary)' }}>{label}</p>
    </div>
  )
}
