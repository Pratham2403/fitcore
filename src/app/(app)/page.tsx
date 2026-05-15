import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import QuoteCard from '@/components/home/QuoteCard'
import StreakBadge from '@/components/home/StreakBadge'
import WellnessScore from '@/components/home/WellnessScore'
import MuscleHeatmap from '@/components/home/MuscleHeatmap'
import { getGreeting, getTodayDayType, getDayLabel, toISODate, getWeekStart } from '@/lib/utils'

export const dynamic = 'force-dynamic'

export default async function HomePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Parallel fetches
  const today = toISODate()
  const weekStart = getWeekStart()
  const dayType = getTodayDayType()

  const [
    { data: streakData },
    { data: todaySession },
    { data: weekSessions },
    { data: latestWeight },
  ] = await Promise.all([
    supabase.from('streaks').select('*').single(),
    supabase.from('workout_sessions').select('*').eq('date', today).order('created_at', { ascending: false }).limit(1).single(),
    supabase.from('workout_sessions').select('day_type').gte('date', weekStart).eq('status', 'completed'),
    supabase.from('body_metrics').select('weight_kg').order('date', { ascending: false }).limit(1).single(),
  ])

  const streak = streakData ?? { current_streak: 0, longest_streak: 0, total_sessions: 0 }
  const weekCount = weekSessions?.length ?? 0
  const currentWeight = latestWeight?.weight_kg ?? null
  const wellnessScore = (todaySession as { wellness_score?: number } | null)?.wellness_score ?? null
  const trainedThisWeek = (weekSessions ?? []).map((s: { day_type: string }) => s.day_type)
  const isRestDay = dayType === 'rest'

  const greeting = getGreeting()
  const sessionLabel = isRestDay ? 'Rest Day — Full Recovery' : getDayLabel(dayType)

  return (
    <div className="px-4 pt-6 pb-4 max-w-lg mx-auto space-y-4">
      {/* Greeting */}
      <div>
        <h1 className="text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>
          {greeting}, Pratham
        </h1>
        <p className="text-sm mt-0.5" style={{ color: 'var(--text-tertiary)' }}>
          {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}
        </p>
      </div>

      {/* Quote */}
      <QuoteCard />

      {/* Today's workout CTA */}
      <div className="rounded-2xl p-4" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}>
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-medium mb-0.5" style={{ color: 'var(--text-tertiary)' }}>TODAY</p>
            <p className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>{sessionLabel}</p>
          </div>
          {!isRestDay && (
            <Link
              href="/workout"
              className="px-4 py-2 rounded-xl text-sm font-semibold"
              style={{ background: 'var(--accent-emerald)', color: '#fff' }}
            >
              Start
            </Link>
          )}
        </div>
        {isRestDay && (
          <p className="text-xs mt-2" style={{ color: 'var(--text-tertiary)' }}>
            Recovery is where the muscle is built. Eat, sleep, hydrate.
          </p>
        )}
      </div>

      {/* Streak row */}
      <StreakBadge
        current={streak.current_streak ?? 0}
        longest={streak.longest_streak ?? 0}
        weekCount={weekCount}
      />

      {/* Quick stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-2xl p-3 text-center" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}>
          <p className="text-lg font-mono font-semibold" style={{ color: 'var(--text-primary)' }}>
            {currentWeight ? `${currentWeight}` : '—'}
          </p>
          <p className="text-[10px] mt-0.5" style={{ color: 'var(--text-tertiary)' }}>kg</p>
        </div>
        <div className="rounded-2xl p-3 text-center" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}>
          <p className="text-lg font-mono font-semibold" style={{ color: 'var(--text-primary)' }}>
            {streak.total_sessions ?? 0}
          </p>
          <p className="text-[10px] mt-0.5" style={{ color: 'var(--text-tertiary)' }}>sessions</p>
        </div>
        <div className="rounded-2xl p-3 text-center" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}>
          <p className="text-lg font-mono font-semibold" style={{ color: 'var(--text-primary)' }}>
            {weekCount}
          </p>
          <p className="text-[10px] mt-0.5" style={{ color: 'var(--text-tertiary)' }}>this week</p>
        </div>
      </div>

      {/* Wellness score */}
      <WellnessScore score={wellnessScore} />

      {/* Muscle heatmap */}
      <MuscleHeatmap trainedDayTypes={trainedThisWeek} isRestDay={isRestDay} />
    </div>
  )
}
