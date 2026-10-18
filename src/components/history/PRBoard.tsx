import { PR_GROUPS, type PrGroup } from '@/lib/muscles'
import type { RecordType } from '@/types'

const RECORD_UNITS: Record<RecordType, string> = { max_weight: 'kg', max_reps: ' reps', max_duration_secs: 's' }

type PR = {
  id: string
  exercise_name: string
  record_type: RecordType
  value: number
  set_on: string
  group: PrGroup
}

interface Props {
  prs: PR[]
}

export default function PRBoard({ prs }: Props) {
  if (!prs.length) {
    return (
      <div className="rounded-2xl p-4 text-center" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}>
        <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>Log your first session to start tracking PRs.</p>
      </div>
    )
  }


  return (
    <div className="space-y-3">
      {PR_GROUPS.map(group => {
        const groupPRs = prs.filter(pr => pr.group === group)
        if (!groupPRs.length) return null

        return (
          <div key={group} className="rounded-2xl overflow-hidden"
            style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}>
            <div className="px-4 py-2 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
              <p className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>{group}</p>
            </div>
            <div className="divide-y" style={{ borderColor: 'var(--border-subtle)' }}>
              {groupPRs.map(pr => {
                return (
                  <div key={pr.id} className="flex items-center justify-between px-4 py-2.5">
                    <p className="text-sm flex-1 mr-3" style={{ color: 'var(--text-primary)' }}>{pr.exercise_name}</p>
                    <div className="text-right">
                      <p className="text-sm font-mono font-semibold" style={{ color: 'var(--accent-orange)' }}>
                        {pr.value}{RECORD_UNITS[pr.record_type]}
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
