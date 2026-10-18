const WIDTH = 280
const HEIGHT = 60
const PADDING_KG = 0.5

function formatShortDate(date: string): string {
  return new Date(date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
}

/** Minimal body-weight trend line; needs at least two entries. */
export default function WeightSparkline({ weights }: { weights: ReadonlyArray<{ date: string; weightKg: number }> }) {
  const values = weights.map(entry => entry.weightKg)
  const min = Math.min(...values) - PADDING_KG
  const max = Math.max(...values) + PADDING_KG
  const range = max - min
  const toY = (value: number) => HEIGHT - ((value - min) / range) * HEIGHT
  const points = values.map((value, index) => `${(index / (values.length - 1)) * WIDTH},${toY(value)}`).join(' ')
  const latest = values[values.length - 1]

  return (
    <figure>
      <svg width="100%" height={HEIGHT} viewBox={`0 0 ${WIDTH} ${HEIGHT}`} preserveAspectRatio="none" role="img" aria-label={`Weight trend, latest ${latest} kg`}>
        <polyline points={points} fill="none" stroke="var(--accent-emerald)" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
        <circle cx={WIDTH} cy={toY(latest)} r="3" fill="var(--accent-emerald)" />
      </svg>
      <figcaption className="mt-1 flex justify-between text-[11px] text-[var(--text-tertiary)]">
        <span>{formatShortDate(weights[0].date)}</span>
        <span className="font-mono text-xs font-semibold text-[var(--accent-emerald)]">{latest} kg</span>
        <span>{formatShortDate(weights[weights.length - 1].date)}</span>
      </figcaption>
    </figure>
  )
}
