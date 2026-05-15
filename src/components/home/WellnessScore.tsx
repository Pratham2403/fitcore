interface Props {
  score: number | null
}

export default function WellnessScore({ score }: Props) {
  const display = score === null ? '—' : score.toFixed(1)
  const color = score === null
    ? 'var(--text-tertiary)'
    : score >= 2.5
      ? 'var(--accent-green)'
      : score >= 1.5
        ? 'var(--accent-orange)'
        : 'var(--destructive)'

  const label = score === null
    ? 'No session today yet'
    : score >= 2.5
      ? 'Feeling great'
      : score >= 1.5
        ? 'Moderate — listen to your body'
        : 'Low — consider going lighter today'

  return (
    <div className="rounded-2xl p-4 flex items-center justify-between" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}>
      <div>
        <p className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>Today&apos;s wellness</p>
        <p className="text-xs mt-0.5" style={{ color: 'var(--text-tertiary)' }}>{label}</p>
      </div>
      <p className="text-3xl font-mono font-semibold" style={{ color }}>{display}</p>
    </div>
  )
}
