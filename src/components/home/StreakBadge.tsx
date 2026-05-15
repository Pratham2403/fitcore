interface Props {
  current: number
  longest: number
  weekCount: number
}

export default function StreakBadge({ current, longest, weekCount }: Props) {
  return (
    <div className="grid grid-cols-3 gap-3">
      <div className="rounded-2xl p-3 text-center" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}>
        <p className="text-2xl font-mono font-semibold" style={{ color: 'var(--accent-orange)' }}>{current}</p>
        <p className="text-[10px] mt-0.5" style={{ color: 'var(--text-tertiary)' }}>Current streak</p>
      </div>
      <div className="rounded-2xl p-3 text-center" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}>
        <p className="text-2xl font-mono font-semibold" style={{ color: 'var(--accent-blue)' }}>{longest}</p>
        <p className="text-[10px] mt-0.5" style={{ color: 'var(--text-tertiary)' }}>Best streak</p>
      </div>
      <div className="rounded-2xl p-3 text-center" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}>
        <p className="text-2xl font-mono font-semibold" style={{ color: 'var(--accent-emerald)' }}>{weekCount}<span className="text-base">/6</span></p>
        <p className="text-[10px] mt-0.5" style={{ color: 'var(--text-tertiary)' }}>This week</p>
      </div>
    </div>
  )
}
