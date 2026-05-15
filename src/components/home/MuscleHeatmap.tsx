'use client'

// Maps muscle group → SVG path IDs and fill opacity based on weekly training frequency
// Front: chest, shoulders, biceps, forearms, quads, core
// Back: back (lats/rhomboids), triceps, hamstrings, glutes, calves

interface Props {
  trainedDayTypes: string[]  // day_types completed this week
  isRestDay: boolean
}

function getOpacity(count: number): number {
  if (count === 0) return 0
  if (count === 1) return 0.4
  if (count === 2) return 0.7
  return 1.0
}

const MUSCLE_DAY_MAP: Record<string, string[]> = {
  chest: ['push_a', 'push_b'],
  shoulders: ['push_a', 'push_b'],
  triceps: ['push_a', 'push_b'],
  back: ['pull_a', 'pull_b'],
  biceps: ['pull_a', 'pull_b'],
  forearms: ['pull_a', 'pull_b'],
  quads: ['legs_a', 'legs_b'],
  hamstrings: ['legs_a', 'legs_b'],
  glutes: ['legs_a', 'legs_b'],
  calves: ['legs_a', 'legs_b'],
  core: ['legs_a', 'legs_b', 'push_a'],
}

export default function MuscleHeatmap({ trainedDayTypes, isRestDay }: Props) {
  if (isRestDay) {
    return (
      <div className="rounded-2xl p-4 text-center" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}>
        <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Rest Day — Full Recovery</p>
        <p className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>Every joint and muscle group resting today</p>
      </div>
    )
  }

  function muscleOpacity(muscle: string): number {
    const days = MUSCLE_DAY_MAP[muscle] ?? []
    const count = trainedDayTypes.filter(d => days.includes(d)).length
    return getOpacity(count)
  }

  const E = '#10B981'  // emerald

  return (
    <div className="rounded-2xl p-4" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}>
      <p className="text-xs font-medium mb-3" style={{ color: 'var(--text-secondary)' }}>Weekly muscle activation</p>
      <div className="flex justify-center gap-6">
        {/* Front body */}
        <svg width="80" height="160" viewBox="0 0 80 160" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Head */}
          <ellipse cx="40" cy="14" rx="11" ry="13" fill="#333" />
          {/* Neck */}
          <rect x="36" y="25" width="8" height="8" rx="2" fill="#333" />
          {/* Shoulders */}
          <ellipse cx="18" cy="38" rx="10" ry="8" fill={E} fillOpacity={muscleOpacity('shoulders')} stroke="#333" strokeWidth="1" />
          <ellipse cx="62" cy="38" rx="10" ry="8" fill={E} fillOpacity={muscleOpacity('shoulders')} stroke="#333" strokeWidth="1" />
          {/* Chest */}
          <path d="M25 33 Q40 28 55 33 L58 52 Q40 58 22 52 Z" fill={E} fillOpacity={muscleOpacity('chest')} stroke="#333" strokeWidth="1" />
          {/* Biceps */}
          <ellipse cx="12" cy="58" rx="7" ry="14" fill={E} fillOpacity={muscleOpacity('biceps')} stroke="#333" strokeWidth="1" />
          <ellipse cx="68" cy="58" rx="7" ry="14" fill={E} fillOpacity={muscleOpacity('biceps')} stroke="#333" strokeWidth="1" />
          {/* Forearms */}
          <ellipse cx="10" cy="82" rx="5" ry="12" fill={E} fillOpacity={muscleOpacity('forearms')} stroke="#333" strokeWidth="1" />
          <ellipse cx="70" cy="82" rx="5" ry="12" fill={E} fillOpacity={muscleOpacity('forearms')} stroke="#333" strokeWidth="1" />
          {/* Core / Abs */}
          <rect x="29" y="53" width="22" height="32" rx="4" fill={E} fillOpacity={muscleOpacity('core')} stroke="#333" strokeWidth="1" />
          {/* Quads */}
          <ellipse cx="32" cy="110" rx="10" ry="22" fill={E} fillOpacity={muscleOpacity('quads')} stroke="#333" strokeWidth="1" />
          <ellipse cx="48" cy="110" rx="10" ry="22" fill={E} fillOpacity={muscleOpacity('quads')} stroke="#333" strokeWidth="1" />
          {/* Calves front */}
          <ellipse cx="32" cy="146" rx="7" ry="11" fill={E} fillOpacity={muscleOpacity('calves')} stroke="#333" strokeWidth="1" />
          <ellipse cx="48" cy="146" rx="7" ry="11" fill={E} fillOpacity={muscleOpacity('calves')} stroke="#333" strokeWidth="1" />
        </svg>

        {/* Back body */}
        <svg width="80" height="160" viewBox="0 0 80 160" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Head */}
          <ellipse cx="40" cy="14" rx="11" ry="13" fill="#333" />
          {/* Neck */}
          <rect x="36" y="25" width="8" height="8" rx="2" fill="#333" />
          {/* Rear shoulders / traps */}
          <ellipse cx="18" cy="38" rx="10" ry="8" fill={E} fillOpacity={muscleOpacity('shoulders')} stroke="#333" strokeWidth="1" />
          <ellipse cx="62" cy="38" rx="10" ry="8" fill={E} fillOpacity={muscleOpacity('shoulders')} stroke="#333" strokeWidth="1" />
          {/* Back (lats) */}
          <path d="M22 32 Q40 28 58 32 L62 68 Q40 72 18 68 Z" fill={E} fillOpacity={muscleOpacity('back')} stroke="#333" strokeWidth="1" />
          {/* Triceps */}
          <ellipse cx="12" cy="58" rx="7" ry="14" fill={E} fillOpacity={muscleOpacity('triceps')} stroke="#333" strokeWidth="1" />
          <ellipse cx="68" cy="58" rx="7" ry="14" fill={E} fillOpacity={muscleOpacity('triceps')} stroke="#333" strokeWidth="1" />
          {/* Forearms */}
          <ellipse cx="10" cy="82" rx="5" ry="12" fill={E} fillOpacity={muscleOpacity('forearms')} stroke="#333" strokeWidth="1" />
          <ellipse cx="70" cy="82" rx="5" ry="12" fill={E} fillOpacity={muscleOpacity('forearms')} stroke="#333" strokeWidth="1" />
          {/* Glutes */}
          <path d="M26 87 Q40 82 54 87 L56 108 Q40 114 24 108 Z" fill={E} fillOpacity={muscleOpacity('glutes')} stroke="#333" strokeWidth="1" />
          {/* Hamstrings */}
          <ellipse cx="32" cy="120" rx="10" ry="20" fill={E} fillOpacity={muscleOpacity('hamstrings')} stroke="#333" strokeWidth="1" />
          <ellipse cx="48" cy="120" rx="10" ry="20" fill={E} fillOpacity={muscleOpacity('hamstrings')} stroke="#333" strokeWidth="1" />
          {/* Calves back */}
          <ellipse cx="32" cy="148" rx="8" ry="10" fill={E} fillOpacity={muscleOpacity('calves')} stroke="#333" strokeWidth="1" />
          <ellipse cx="48" cy="148" rx="8" ry="10" fill={E} fillOpacity={muscleOpacity('calves')} stroke="#333" strokeWidth="1" />
        </svg>
      </div>
      <div className="flex items-center gap-3 mt-3 justify-center">
        {[0.4, 0.7, 1.0].map((op, i) => (
          <div key={i} className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm" style={{ background: E, opacity: op }} />
            <span className="text-[10px]" style={{ color: 'var(--text-tertiary)' }}>{i === 0 ? '1×' : i === 1 ? '2×' : '3×+'}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
