import { createClient, getOptionalUserId } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import QuoteCard from '@/components/home/QuoteCard'
import StreakBadge from '@/components/home/StreakBadge'
import WellnessScore from '@/components/home/WellnessScore'
import MuscleHeatmap from '@/components/home/MuscleHeatmap'
import { getGreeting, toISODate, getWeekStart, getLastWeekStart } from '@/lib/utils'
import DeloadAlert from '@/components/home/DeloadAlert'
import { computeACWR } from '@/lib/analytics/acwr'
import { getWeeklyProgram } from '@/lib/program/actions'
import { getHomeDashboard } from '@/lib/home/dashboard'
import TodayCard from '@/components/home/TodayCard'

export const dynamic = 'force-dynamic'

const ACWR_WINDOW_DAYS = 28
const MS_PER_DAY = 86_400_000

export default async function HomePage() {
  const supabase = await createClient()
  const userId = await getOptionalUserId(supabase)
  if (!userId) redirect('/login')

  const [dashboard, program] = await Promise.all([
    getHomeDashboard(supabase, userId, {
      today: toISODate(),
      weekStart: getWeekStart(),
      lastWeekStart: getLastWeekStart(),
      fourWeeksAgo: toISODate(new Date(Date.now() - ACWR_WINDOW_DAYS * MS_PER_DAY)),
    }),
    getWeeklyProgram(),
  ])
  const {
    profileName, streak, weekCount, currentWeightKg: currentWeight, wellnessScore, sessionsPerMuscle,
    thisWeekVolumeKg: thisWeekVol, lastWeekVolumeKg: lastWeekVol, latestPR,
  } = dashboard
  const volDelta = lastWeekVol > 0 ? Math.round(((thisWeekVol - lastWeekVol) / lastWeekVol) * 100) : null
  const acwrResult = computeACWR(dashboard.recentSessions)

  const greeting = getGreeting()

  return (
    <div className="px-4 pt-6 pb-4 max-w-lg mx-auto space-y-4">
      {/* Greeting */}
      <div>
        <h1 className="text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>
          {greeting}{profileName ? `, ${profileName}` : ''}
        </h1>
        <p className="text-sm mt-0.5" style={{ color: 'var(--text-tertiary)' }}>
          {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}
        </p>
      </div>

      {/* Quote */}
      <QuoteCard />

      <TodayCard program={program} />

      {/* Streak row */}
      <StreakBadge
        current={streak.current}
        longest={streak.longest}
        weekCount={weekCount}
      />

      {/* Volume trend */}
      <div className="rounded-2xl px-4 py-3 flex items-center justify-between"
        style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}>
        <div>
          <p className="text-[10px] font-medium uppercase tracking-wide mb-0.5" style={{ color: 'var(--text-tertiary)' }}>
            Weekly Volume
          </p>
          <div className="flex items-baseline gap-2">
            <span className="text-base font-mono font-semibold" style={{ color: 'var(--text-primary)' }}>
              {thisWeekVol > 0 ? `${Math.round(thisWeekVol).toLocaleString()}kg` : '—'}
            </span>
            {volDelta !== null && (
              <span className="text-xs font-semibold" style={{ color: volDelta >= 0 ? 'var(--accent-emerald)' : 'var(--destructive)' }}>
                {volDelta >= 0 ? '+' : ''}{volDelta}%
              </span>
            )}
            {lastWeekVol > 0 && (
              <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>vs last week</span>
            )}
          </div>
        </div>
        <div className="text-right">
          <p className="text-[10px] font-medium uppercase tracking-wide mb-0.5" style={{ color: 'var(--text-tertiary)' }}>
            This Week
          </p>
          <span className="text-base font-mono font-semibold" style={{ color: 'var(--text-primary)' }}>
            {weekCount}
            <span className="text-xs font-normal ml-0.5" style={{ color: 'var(--text-tertiary)' }}>/7</span>
          </span>
        </div>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-2xl p-3 text-center" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}>
          <p className="text-lg font-mono font-semibold" style={{ color: 'var(--text-primary)' }}>
            {currentWeight ?? '—'}
          </p>
          <p className="text-[10px] mt-0.5" style={{ color: 'var(--text-tertiary)' }}>kg</p>
        </div>
        <div className="rounded-2xl p-3 text-center" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}>
          <p className="text-lg font-mono font-semibold" style={{ color: 'var(--text-primary)' }}>
            {streak.totalSessions}
          </p>
          <p className="text-[10px] mt-0.5" style={{ color: 'var(--text-tertiary)' }}>sessions</p>
        </div>
        <div className="rounded-2xl p-3 text-center" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}>
          <p className="text-lg font-mono font-semibold" style={{ color: 'var(--text-primary)' }}>
            {streak.current}
          </p>
          <p className="text-[10px] mt-0.5" style={{ color: 'var(--text-tertiary)' }}>day streak</p>
        </div>
      </div>

      {/* Wellness score */}
      <WellnessScore score={wellnessScore} />

      {/* Latest PR */}
      {latestPR && (
        <div className="rounded-2xl px-4 py-3"
          style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.25)' }}>
          <p className="text-[10px] font-semibold uppercase tracking-wide mb-1" style={{ color: 'var(--accent-emerald)' }}>
            Latest PR
          </p>
          <div className="flex items-baseline justify-between">
            <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
              {latestPR.exerciseName}
            </p>
            <p className="text-sm font-mono font-semibold" style={{ color: 'var(--accent-emerald)' }}>
              {latestPR.value}kg
            </p>
          </div>
          <p className="text-[10px] mt-0.5" style={{ color: 'var(--text-tertiary)' }}>
            {new Date(latestPR.setOn).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
          </p>
        </div>
      )}

      {/* Deload alert */}
      {acwrResult.shouldDeload && (
        <DeloadAlert
          acwr={acwrResult.acwr}
          acuteLoad={acwrResult.acuteLoad}
          chronicLoad={acwrResult.chronicLoad}
        />
      )}

      {/* Muscle heatmap */}
      <MuscleHeatmap sessionsPerMuscle={sessionsPerMuscle} />
    </div>
  )
}
