'use client'

import { useState } from 'react'
import Link from 'next/link'
import type { WeeklyProgram } from '@/types'
import Button, { buttonClassName } from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import { Chip } from '@/components/ui/Chip'
import EmptyState from '@/components/ui/EmptyState'
import { ArrowRightIcon, PlusIcon, ProgramIcon, SparkIcon } from '@/components/ui/Icon'
import CreateWorkoutSheet from './CreateWorkoutSheet'
import WeekSchedule from './WeekSchedule'
import { PROTOCOL_LABELS } from './programLabels'

/** Weekly schedule plus the user's workout templates. */
export default function ProgramView({ program }: { program: WeeklyProgram }) {
  const [isCreating, setIsCreating] = useState(false)
  const { workouts, workoutLimit } = program
  const isAtLimit = workoutLimit !== null && workouts.length >= workoutLimit

  return (
    <div className="mx-auto flex max-w-lg flex-col gap-6 px-4 pb-6 pt-6">
      <header className="flex items-center justify-between gap-3">
        <h1 className="text-xl font-semibold">Program</h1>
        <div className="flex items-center gap-1">
          <Link href="/exercises" className={buttonClassName({ variant: 'ghost', size: 'sm' })}>Exercises</Link>
          <Link href="/coach" className={buttonClassName({ variant: 'secondary', size: 'sm' })}><SparkIcon size={16} />AI Coach</Link>
        </div>
      </header>

      <section aria-labelledby="week-heading" className="flex flex-col gap-3">
        <h2 id="week-heading" className="text-xs font-semibold uppercase tracking-wide text-[var(--text-tertiary)]">This week</h2>
        <WeekSchedule program={program} />
      </section>

      <section aria-labelledby="workouts-heading" className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-3">
          <h2 id="workouts-heading" className="text-xs font-semibold uppercase tracking-wide text-[var(--text-tertiary)]">Workouts</h2>
          {workoutLimit !== null && (
            <Chip tone={isAtLimit ? 'warning' : 'neutral'}>
              <span className="font-mono">{workouts.length} / {workoutLimit}</span> workouts
            </Chip>
          )}
        </div>
        {workouts.length === 0 ? (
          <Card>
            <EmptyState
              icon={<ProgramIcon />}
              title="No workouts yet"
              description="Let the AI Coach draft a week around your constraints, or build one yourself."
              action={
                <div className="flex flex-col gap-2 sm:flex-row">
                  <Link href="/coach" className={buttonClassName()}><SparkIcon size={18} />Try the AI Coach</Link>
                  <Button variant="secondary" onClick={() => setIsCreating(true)}>Build manually</Button>
                </div>
              }
            />
          </Card>
        ) : (
          <ul className="flex flex-col gap-2">
            {workouts.map(workout => (
              <li key={workout.id}>
                <Link
                  href={`/program/${workout.id}`}
                  className="flex min-h-16 items-center gap-3 rounded-[var(--radius-lg)] border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-4 py-3 transition-colors duration-150 hover:border-[var(--border)]"
                >
                  <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <span className="truncate text-sm font-semibold">{workout.name}</span>
                    <span className="truncate text-xs text-[var(--text-secondary)]">
                      <span className="font-mono">{workout.exerciseCount}</span> exercises
                      {workout.focus && ` · ${workout.focus}`}
                    </span>
                  </span>
                  <Chip>{PROTOCOL_LABELS[workout.protocol]}</Chip>
                  <ArrowRightIcon size={16} className="shrink-0 text-[var(--text-tertiary)]" />
                </Link>
              </li>
            ))}
          </ul>
        )}
        {workouts.length > 0 && (
          <Button variant="secondary" isFullWidth onClick={() => setIsCreating(true)}>
            <PlusIcon size={18} />
            New workout
          </Button>
        )}
      </section>

      <CreateWorkoutSheet open={isCreating} onClose={() => setIsCreating(false)} isAtLimit={isAtLimit} workoutLimit={workoutLimit} />
    </div>
  )
}
