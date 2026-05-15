type PR = {
  id: string
  exercise_name: string
  record_type: string
  value: number
  set_on: string
}

interface Props {
  prs: PR[]
}

const MUSCLE_GROUPS: Record<string, string[]> = {
  'Chest': ['Barbell Bench Press', 'Incline DB Press', 'Cable Fly — Low Cable Cross', 'Pec Deck Fly', 'Incline Barbell Press'],
  'Back': ['Barbell Bent-Over Row', 'Lat Pulldown — Wide Grip', 'Seated Cable Row — Close Grip', 'T-Bar Row or Chest-Supported DB Row', 'Single-Arm DB Row', 'Face Pulls — Cable Rope'],
  'Shoulders': ['Overhead Press — Barbell or Smith', 'DB Lateral Raises'],
  'Arms': ['DB Bicep Curl', 'Hammer Curl', 'Reverse Curl — EZ Bar', 'Tricep Pushdown — Rope'],
  'Calisthenics': ['Dip — Assisted Machine', 'Assisted Pull-up — Overhand Wide', 'Assisted Chin-up — Underhand'],
  'Legs': ['Goblet Squat', 'Leg Press', 'DB Romanian Deadlift', 'Barbell Romanian Deadlift', 'Smith Machine Squat', 'Bulgarian Split Squat — DB', 'Prone Leg Curl'],
}

export default function PRBoard({ prs }: Props) {
  if (!prs.length) {
    return (
      <div className="rounded-2xl p-4 text-center" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}>
        <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>Log your first session to start tracking PRs.</p>
      </div>
    )
  }

  const prMap = new Map(prs.map(p => [p.exercise_name, p]))

  return (
    <div className="space-y-3">
      {Object.entries(MUSCLE_GROUPS).map(([group, exercises]) => {
        const groupPRs = exercises.filter(e => prMap.has(e))
        if (!groupPRs.length) return null

        return (
          <div key={group} className="rounded-2xl overflow-hidden"
            style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}>
            <div className="px-4 py-2 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
              <p className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>{group}</p>
            </div>
            <div className="divide-y" style={{ borderColor: 'var(--border-subtle)' }}>
              {groupPRs.map(exName => {
                const pr = prMap.get(exName)!
                return (
                  <div key={exName} className="flex items-center justify-between px-4 py-2.5">
                    <p className="text-sm flex-1 mr-3" style={{ color: 'var(--text-primary)' }}>{exName}</p>
                    <div className="text-right">
                      <p className="text-sm font-mono font-semibold" style={{ color: 'var(--accent-orange)' }}>
                        {pr.record_type === 'max_duration_secs' ? `${pr.value}s` : `${pr.value}kg`}
                      </p>
                      <p className="text-[10px]" style={{ color: 'var(--text-tertiary)' }}>
                        {new Date(pr.set_on).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}
