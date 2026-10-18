'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import type { DayOfWeek, WeeklyProgram } from '@/types'
import { buttonClassName } from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import EmptyState from '@/components/ui/EmptyState'
import { ProgramIcon, SparkIcon } from '@/components/ui/Icon'
import Skeleton from '@/components/ui/Skeleton'
import { toDayOfWeek } from '@/components/program/programLabels'

/** Today's scheduled workout, resolved in the viewer's timezone; nudges new users toward a first plan. */
export default function TodayCard({ program }: { program: WeeklyProgram }) {
  const [today, setToday] = useState<DayOfWeek | null>(null)
  useEffect(() => setToday(toDayOfWeek(new Date().getDay())), [])

  if (program.workouts.length === 0) {
    return (
      <Card>
        <EmptyState
          icon={<ProgramIcon />}
          title="Let’s set up your week"
          description="Have the AI Coach draft a plan around your constraints, or build workouts yourself."
          action={
            <div className="flex flex-col gap-2">
              <Link href="/coach" className={buttonClassName()}><SparkIcon size={18} />Try the AI Coach</Link>
              <Link href="/program" className={buttonClassName({ variant: 'secondary' })}>Build manually</Link>
            </div>
          }
        />
      </Card>
    )
  }

  const workout = today === null ? null : program.schedule[today]
  return (
    <Card className="flex items-center justify-between gap-3">
      <div className="min-w-0">
        <p className="text-xs font-medium uppercase tracking-wide text-[var(--text-tertiary)]">Today</p>
        {today === null ? <Skeleton className="mt-1 h-5 w-40" /> : (
          <p className="truncate text-base font-semibold">
            {workout ? [workout.name, workout.focus].filter(Boolean).join(' — ') : 'Rest day'}
          </p>
        )}
      </div>
      <Link href="/workout" className={buttonClassName({ variant: workout ? 'primary' : 'secondary' })}>
        {workout || today === null ? 'Start' : 'Train anyway'}
      </Link>
    </Card>
  )
}
