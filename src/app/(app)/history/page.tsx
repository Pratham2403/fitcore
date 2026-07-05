import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import CalendarHeatmap from '@/components/history/CalendarHeatmap'
import SessionList from '@/components/history/SessionList'
import PRBoard from '@/components/history/PRBoard'
import VolumeChart from '@/components/history/VolumeChart'
import CalisthenicsTracker from '@/components/history/CalisthenicsTracker'
import ImbalanceAlert from '@/components/history/ImbalanceAlert'
import { detectImbalances } from '@/lib/analytics/imbalance'

export const dynamic = 'force-dynamic'

const CALISTHENICS_EXERCISES = [
  'Dip — Assisted Machine',
  'Assisted Pull-up — Overhand Wide',
  'Assisted Chin-up — Underhand',
]

const UNILATERAL_EXERCISES = [
  'Single-Arm DB Row',
  'Lateral Lunge (DB)',
]

type Session = { id: string; date: string; total_volume_kg: number | null }
type CalSet = { session_id: string; exercise_name: string; weight_kg: number | null }

function mondayOfWeek(date: Date): Date {
  const d = new Date(date)
  const day = d.getDay()
  d.setDate(d.getDate() + (day === 0 ? -6 : 1 - day))
  d.setHours(0, 0, 0, 0)
  return d
}

function buildWeeklyVolume(sessions: Session[]): { week: string; volume: number }[] {
  const thisMonday = mondayOfWeek(new Date())
  return Array.from({ length: 8 }, (_, i) => {
    const weekStart = new Date(thisMonday)
    weekStart.setDate(weekStart.getDate() - (7 - i) * 7)
    const weekEnd = new Date(weekStart)
    weekEnd.setDate(weekStart.getDate() + 7)
    const volume = sessions
      .filter(s => { const d = new Date(s.date); return d >= weekStart && d < weekEnd })
      .reduce((sum, s) => sum + (s.total_volume_kg ?? 0), 0)
    return {
      week: weekStart.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
      volume: Math.round(volume),
    }
  })
}

function buildCalisthenicsData(
  sets: CalSet[],
  sessionDateMap: Record<string, string>,
): { date: string; dip?: number; pullup?: number; chinup?: number }[] {
  const byDate = new Map<string, { dip?: number; pullup?: number; chinup?: number }>()

  for (const set of sets) {
    const date = sessionDateMap[set.session_id]
    if (!date || set.weight_kg === null) continue
    if (!byDate.has(date)) byDate.set(date, {})
    const entry = byDate.get(date)!
    const w = set.weight_kg

    if (set.exercise_name === 'Dip — Assisted Machine') {
      entry.dip = entry.dip === undefined ? w : Math.min(entry.dip, w)
    } else if (set.exercise_name === 'Assisted Pull-up — Overhand Wide') {
      entry.pullup = entry.pullup === undefined ? w : Math.min(entry.pullup, w)
    } else if (set.exercise_name === 'Assisted Chin-up — Underhand') {
      entry.chinup = entry.chinup === undefined ? w : Math.min(entry.chinup, w)
    }
  }

  return Array.from(byDate.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, values]) => ({
      date: new Date(date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
      ...values,
    }))
}

export default async function HistoryPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const twelveWeeksAgo = new Date()
  twelveWeeksAgo.setDate(twelveWeeksAgo.getDate() - 84)
  const startDate = twelveWeeksAgo.toISOString().split('T')[0]

  const [{ data: sessions }, { data: prs }] = await Promise.all([
    supabase.from('workout_sessions').select('*').gte('date', startDate).order('date', { ascending: false }),
    supabase.from('personal_records').select('*').order('set_on', { ascending: false }),
  ])

  const sessionIds = (sessions ?? []).map((s: Session) => s.id)
  let calSets: CalSet[] = []
  let unilateralSets: { exercise_name: string; side: string | null; weight_kg: number | null }[] = []
  if (sessionIds.length > 0) {
    const [calResult, uniResult] = await Promise.all([
      supabase.from('set_logs').select('session_id, exercise_name, weight_kg')
        .in('session_id', sessionIds).in('exercise_name', CALISTHENICS_EXERCISES),
      supabase.from('set_logs').select('exercise_name, side, weight_kg')
        .in('session_id', sessionIds).in('exercise_name', UNILATERAL_EXERCISES).not('side', 'is', null),
    ])
    calSets = (calResult.data as CalSet[]) ?? []
    unilateralSets = (uniResult.data as typeof unilateralSets) ?? []
  }

  const weeklyVolumeData = buildWeeklyVolume((sessions as Session[]) ?? [])
  const sessionDateMap = Object.fromEntries(((sessions ?? []) as Session[]).map(s => [s.id, s.date]))
  const calisthenicsData = buildCalisthenicsData(calSets, sessionDateMap)
  const imbalances = detectImbalances(unilateralSets)

  return (
    <div className="px-4 pt-5 pb-4 max-w-lg mx-auto space-y-6">
      <h1 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>History</h1>

      <section>
        <h2 className="text-xs font-medium mb-3" style={{ color: 'var(--text-secondary)' }}>12 WEEKS</h2>
        <CalendarHeatmap sessions={sessions ?? []} />
      </section>

      <section>
        <h2 className="text-xs font-medium mb-3" style={{ color: 'var(--text-secondary)' }}>WEEKLY VOLUME</h2>
        <VolumeChart data={weeklyVolumeData} />
      </section>

      <section>
        <h2 className="text-xs font-medium mb-3" style={{ color: 'var(--text-secondary)' }}>CALISTHENICS PROGRESS</h2>
        <CalisthenicsTracker data={calisthenicsData} />
      </section>

      {imbalances.length > 0 && (
        <section>
          <h2 className="text-xs font-medium mb-3" style={{ color: 'var(--text-secondary)' }}>IMBALANCE ALERTS</h2>
          <ImbalanceAlert imbalances={imbalances} />
        </section>
      )}

      <section>
        <h2 className="text-xs font-medium mb-3" style={{ color: 'var(--text-secondary)' }}>PERSONAL RECORDS</h2>
        <PRBoard prs={prs ?? []} />
      </section>

      <section>
        <h2 className="text-xs font-medium mb-3" style={{ color: 'var(--text-secondary)' }}>SESSIONS</h2>
        <SessionList sessions={sessions ?? []} />
      </section>
    </div>
  )
}
