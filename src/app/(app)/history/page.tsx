import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import CalendarHeatmap from '@/components/history/CalendarHeatmap'
import SessionList from '@/components/history/SessionList'
import PRBoard from '@/components/history/PRBoard'

export const dynamic = 'force-dynamic'

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

  return (
    <div className="px-4 pt-5 pb-4 max-w-lg mx-auto space-y-6">
      <h1 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>History</h1>

      <section>
        <h2 className="text-xs font-medium mb-3" style={{ color: 'var(--text-secondary)' }}>12 WEEKS</h2>
        <CalendarHeatmap sessions={sessions ?? []} />
      </section>

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
