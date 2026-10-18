import { createClient, getOptionalUserId } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import CalendarHeatmap from '@/components/history/CalendarHeatmap'
import SessionList from '@/components/history/SessionList'
import PRBoard from '@/components/history/PRBoard'
import VolumeChart from '@/components/history/VolumeChart'
import CalisthenicsTracker from '@/components/history/CalisthenicsTracker'
import ImbalanceAlert from '@/components/history/ImbalanceAlert'
import { getHistorySnapshot } from '@/lib/history/snapshot'
import { toISODate } from '@/lib/utils'

export const dynamic = 'force-dynamic'

const HISTORY_DAYS = 84
const VOLUME_WEEKS = 8

type Session = { id: string; date: string; total_volume_kg: number | null }

function mondayOfWeek(date: Date): Date {
  const d = new Date(date)
  const day = d.getDay()
  d.setDate(d.getDate() + (day === 0 ? -6 : 1 - day))
  d.setHours(0, 0, 0, 0)
  return d
}

function buildWeeklyVolume(sessions: Session[]): { week: string; volume: number }[] {
  const thisMonday = mondayOfWeek(new Date())
  return Array.from({ length: VOLUME_WEEKS }, (_, i) => {
    const weekStart = new Date(thisMonday)
    weekStart.setDate(weekStart.getDate() - (VOLUME_WEEKS - 1 - i) * 7)
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

const formatShortDate = (isoDate: string) => new Date(isoDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })

export default async function HistoryPage() {
  const supabase = await createClient()
  const userId = await getOptionalUserId(supabase)
  if (!userId) redirect('/login')

  const since = new Date()
  since.setDate(since.getDate() - HISTORY_DAYS)
  const { sessions, prs, calisthenicsSeries, calisthenicsPoints, imbalances } = await getHistorySnapshot(supabase, userId, toISODate(since))

  const weeklyVolumeData = buildWeeklyVolume(sessions)
  const calisthenicsData = calisthenicsPoints.map(point => ({ ...point, date: formatShortDate(point.date) }))

  return (
    <div className="px-4 pt-5 pb-4 max-w-lg mx-auto space-y-6">
      <h1 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>History</h1>

      <section>
        <h2 className="text-xs font-medium mb-3" style={{ color: 'var(--text-secondary)' }}>12 WEEKS</h2>
        <CalendarHeatmap sessions={sessions} />
      </section>

      <section>
        <h2 className="text-xs font-medium mb-3" style={{ color: 'var(--text-secondary)' }}>WEEKLY VOLUME</h2>
        <VolumeChart data={weeklyVolumeData} />
      </section>

      <section>
        <h2 className="text-xs font-medium mb-3" style={{ color: 'var(--text-secondary)' }}>CALISTHENICS PROGRESS</h2>
        <CalisthenicsTracker data={calisthenicsData} series={calisthenicsSeries} />
      </section>

      {imbalances.length > 0 && (
        <section>
          <h2 className="text-xs font-medium mb-3" style={{ color: 'var(--text-secondary)' }}>IMBALANCE ALERTS</h2>
          <ImbalanceAlert imbalances={imbalances} />
        </section>
      )}

      <section>
        <h2 className="text-xs font-medium mb-3" style={{ color: 'var(--text-secondary)' }}>PERSONAL RECORDS</h2>
        <PRBoard prs={prs} />
      </section>

      <section>
        <h2 className="text-xs font-medium mb-3" style={{ color: 'var(--text-secondary)' }}>SESSIONS</h2>
        <SessionList sessions={sessions} />
      </section>
    </div>
  )
}
