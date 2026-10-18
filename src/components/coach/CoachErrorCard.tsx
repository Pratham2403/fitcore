'use client'

import Link from 'next/link'
import type { ReactNode } from 'react'
import { joinWaitlist } from '@/lib/waitlist/actions'
import Button, { buttonClassName } from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import { AlertIcon, InfoIcon, SparkIcon } from '@/components/ui/Icon'
import WaitlistForm, { type WaitlistResult } from '@/components/ui/WaitlistForm'
import type { CoachFailure } from './coachOutcome'

const FREE_WORKOUT_LIMIT = 7

interface CoachErrorCardProps {
  failure: CoachFailure
  /** Repeats the call that failed; offered for transient failures. */
  onRetry?: () => void
  /** Returns to an empty questionnaire. */
  onStartOver?: () => void
  /** Saves again, replacing workouts on the plan's days; offered when that makes room under the workout cap. */
  onReplaceAndSave?: () => void
}

async function submitCoachWaitlist(email: string): Promise<WaitlistResult> {
  const result = await joinWaitlist(email, 'coach')
  if (!result.ok) return { ok: false, message: result.error.message }
  return { ok: true, message: 'You’re on the list — we’ll email you when Pro opens.' }
}

function ErrorLayout({ icon, title, message, children }: { icon: ReactNode; title: string; message: string; children: ReactNode }) {
  return (
    <Card padding="lg" role="alert" className="flex flex-col gap-4">
      <div className="flex items-start gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[var(--bg-elevated)] text-[var(--accent-orange)]">
          {icon}
        </span>
        <div className="flex flex-col gap-1">
          <h2 className="text-base font-semibold text-[var(--text-primary)]">{title}</h2>
          <p className="text-sm text-[var(--text-secondary)]">{message}</p>
        </div>
      </div>
      {children}
    </Card>
  )
}

function ProWaitlist({ pitch }: { pitch: string }) {
  return (
    <div className="flex flex-col gap-3 rounded-[var(--radius-md)] border border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-4">
      <p className="text-sm text-[var(--text-secondary)]">{pitch}</p>
      <WaitlistForm onSubmit={submitCoachWaitlist} submitLabel="Join the Pro waitlist" />
    </div>
  )
}

/** Friendly explanation and next step for a failed coach call. */
export default function CoachErrorCard({ failure, onRetry, onStartOver, onReplaceAndSave }: CoachErrorCardProps) {
  const startOverButton = onStartOver && (
    <Button variant="secondary" isFullWidth onClick={onStartOver}>Start over</Button>
  )

  if (failure.code === 'RATE_LIMITED') {
    return (
      <ErrorLayout icon={<SparkIcon size={20} />} title="You’ve used your free AI builds" message={failure.message}>
        <ProWaitlist pitch="Pro will include more AI builds and revisions. Join the waitlist and we’ll email you when it opens." />
        <Link href="/program" className={buttonClassName({ variant: 'ghost', isFullWidth: true })}>Build a plan by hand</Link>
      </ErrorLayout>
    )
  }

  if (failure.code === 'AI_UNAVAILABLE') {
    return (
      <ErrorLayout icon={<SparkIcon size={20} />} title="The AI Coach is taking a break" message={failure.message}>
        {onRetry && <Button isFullWidth onClick={onRetry}>Try again</Button>}
        <div className="grid grid-cols-2 gap-2">
          <Link href="/program" className={buttonClassName({ variant: 'secondary' })}>Build manually</Link>
          <Link href="/exercises" className={buttonClassName({ variant: 'secondary' })}>Browse exercises</Link>
        </div>
      </ErrorLayout>
    )
  }

  if (failure.code === 'WORKOUT_REPLACE_REQUIRED' || failure.code === 'WORKOUT_LIMIT_REACHED') {
    return (
      <ErrorLayout
        icon={<InfoIcon size={20} />}
        title={`The free plan holds ${FREE_WORKOUT_LIMIT} workouts`}
        message={failure.message}
      >
        {failure.code === 'WORKOUT_REPLACE_REQUIRED' && onReplaceAndSave && (
          <Button isFullWidth onClick={onReplaceAndSave}>Replace workouts on these days and save</Button>
        )}
        {failure.code === 'WORKOUT_LIMIT_REACHED' && (
          <Link href="/program" className={buttonClassName({ variant: 'secondary', isFullWidth: true })}>Manage your workouts</Link>
        )}
        <ProWaitlist pitch="Pro removes the workout limit. Join the waitlist and we’ll email you when it opens." />
      </ErrorLayout>
    )
  }

  if (failure.code === 'NOT_FOUND') {
    return (
      <ErrorLayout icon={<AlertIcon size={20} />} title="We couldn’t find that plan" message="It may belong to another account or device, or the link is incomplete.">
        {startOverButton}
      </ErrorLayout>
    )
  }

  if (failure.code === 'VALIDATION') {
    return (
      <ErrorLayout icon={<AlertIcon size={20} />} title="That didn’t work" message={failure.message}>
        {startOverButton}
      </ErrorLayout>
    )
  }

  return (
    <ErrorLayout icon={<AlertIcon size={20} />} title="Something went wrong" message={failure.message}>
      {onRetry && <Button isFullWidth onClick={onRetry}>Try again</Button>}
      {startOverButton}
    </ErrorLayout>
  )
}
