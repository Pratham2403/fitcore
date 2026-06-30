interface Props {
  acwr: number
  acuteLoad: number
  chronicLoad: number
}

export default function DeloadAlert({ acwr, acuteLoad, chronicLoad }: Props) {
  const severity = acwr > 1.5 ? 'high' : 'moderate'
  const accentColor = severity === 'high' ? '#EF4444' : '#F59E0B'
  const bgColor = severity === 'high' ? 'rgba(239,68,68,0.08)' : 'rgba(245,158,11,0.08)'
  const borderColor = severity === 'high' ? 'rgba(239,68,68,0.25)' : 'rgba(245,158,11,0.25)'

  return (
    <div className="rounded-2xl p-4" style={{ background: bgColor, border: `1px solid ${borderColor}` }}>
      <p className="text-[10px] font-semibold uppercase tracking-wide mb-1" style={{ color: accentColor }}>
        {severity === 'high' ? '⚠ High Load — Consider a Deload' : '⚠ Training Spike Detected'}
      </p>
      <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
        {severity === 'high'
          ? 'Volume spiked hard. Cut load by 40–50% this week to protect your joints.'
          : 'Workload jumped above your rolling baseline. A lighter session today could help.'}
      </p>
      <div className="flex gap-5 mt-2.5">
        <div>
          <p className="text-[10px]" style={{ color: 'var(--text-tertiary)' }}>This week</p>
          <p className="text-xs font-mono font-semibold" style={{ color: 'var(--text-primary)' }}>
            {acuteLoad.toLocaleString()} kg
          </p>
        </div>
        <div>
          <p className="text-[10px]" style={{ color: 'var(--text-tertiary)' }}>4-wk avg / wk</p>
          <p className="text-xs font-mono font-semibold" style={{ color: 'var(--text-primary)' }}>
            {chronicLoad.toLocaleString()} kg
          </p>
        </div>
        <div>
          <p className="text-[10px]" style={{ color: 'var(--text-tertiary)' }}>ACWR</p>
          <p className="text-xs font-mono font-semibold" style={{ color: accentColor }}>
            {acwr.toFixed(2)}
          </p>
        </div>
      </div>
    </div>
  )
}
