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
  'Chest': ['DB Flat Bench Press', 'Incline DB Press (30°)', 'Incline DB Press (45°)', 'Pec Deck Fly', 'Cable Fly — Low Cable Cross'],
  'Shoulders': ['DB Lateral Raises', 'Shoulder Press Machine', 'Rear Delt Fly Machine', 'Cable Face Pulls'],
  'Back': ['Lat Pulldown — Wide Grip', 'Lat Pulldown — Underhand', 'Seated Cable Row — Close Grip', 'Seated Cable Row — Wide Grip', 'Single-Arm DB Row'],
  'Arms': ['DB Bicep Curl', 'DB Hammer Curl', 'EZ Bar Reverse Curl', 'Tricep Pushdown — Rope', 'Tricep Pushdown Machine', 'Wrist Curls — Both Directions'],
  'Calisthenics': ['Dip — Assisted Machine', 'Assisted Pull-up — Overhand Wide', 'Assisted Chin-up — Underhand'],
  'Legs': ['Sumo Goblet Squat', 'Leg Press', 'Leg Press — Wide Stance', 'DB Romanian Deadlift', 'Smith Machine Hip Thrust', 'Leg Extension — PARTIAL 0 to 90° ONLY', 'Lateral Lunge (DB)', 'Hip Abduction Machine', 'Hip Adduction Machine'],
  'Calves': ['Seated Calf Raises', 'Smith Machine Calf Raises'],
  'Core': ['Weighted Ab Crunch Machine', 'Kegels', 'Decline Leg Raises', 'Hyperextension — Bodyweight'],
  'Cardio': ['Stationary Bike — Cardio'],
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
