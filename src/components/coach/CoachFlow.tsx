'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import type { DayOfWeek } from '@/types'
import type { CoachBuildInput } from '@/lib/coach/schema'
import type { CoachDraft } from '@/lib/coach/types'
import { getCoachBuild, getResumableCoachBuild, startCoachBuild } from '@/lib/coach/actions'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import Skeleton from '@/components/ui/Skeleton'
import { SparkIcon } from '@/components/ui/Icon'
import CoachErrorCard from './CoachErrorCard'
import CoachLoading, { START_STEPS } from './CoachLoading'
import CoachQuestionnaire from './CoachQuestionnaire'
import CoachReview from './CoachReview'
import type { CoachFormValues } from './coachForm'
import { runCoachAction, type CoachFailure } from './coachOutcome'
import { coachBuildPath } from './pendingBuild'

const BUILD_PARAM = 'build'
const COACH_PATH = '/coach'

type CoachPhase =
  | { kind: 'questionnaire'; submitError?: string }
  | { kind: 'building' }
  | { kind: 'resuming' }
  | { kind: 'review'; draft: CoachDraft; isResumed: boolean }
  | { kind: 'failed'; failure: CoachFailure; retryInput?: CoachBuildInput }

// A malformed build id in the URL is, for the visitor, just a plan that doesn't exist.
function toResumeFailure(failure: CoachFailure): CoachFailure {
  if (failure.code !== 'VALIDATION') return failure
  return { ...failure, code: 'NOT_FOUND' }
}

interface CoachFlowProps {
  /** Questionnaire defaults, prefilled from the profile when signed in. */
  initialValues: CoachFormValues
  isSignedIn: boolean
  /** Days that already have a workout scheduled; empty when signed out. */
  occupiedDays: readonly DayOfWeek[]
}

/** Skeleton shown while a saved draft loads. */
export function CoachReviewSkeleton() {
  return (
    <div aria-busy className="flex flex-col gap-4">
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-8 w-3/4" />
      <Skeleton className="h-16 w-full" />
      <Skeleton className="h-48 w-full rounded-[var(--radius-lg)]" />
      <Skeleton className="h-48 w-full rounded-[var(--radius-lg)]" />
    </div>
  )
}

/**
 * The AI Coach journey: questionnaire → drafting → review. `?build=<id>` resumes that draft; without it a
 * signed-in user's latest unsaved draft is resumed.
 */
export default function CoachFlow({ initialValues, isSignedIn, occupiedDays }: CoachFlowProps) {
  const router = useRouter()
  const buildParam = useSearchParams().get(BUILD_PARAM)
  const [formValues, setFormValues] = useState(initialValues)
  const [phase, setPhase] = useState<CoachPhase>(() => (buildParam || isSignedIn ? { kind: 'resuming' } : { kind: 'questionnaire' }))
  // The build currently on screen, so the URL update after drafting doesn't trigger a reload of the same build.
  const shownBuildIdRef = useRef<string | null>(null)

  useEffect(() => {
    if (!buildParam || buildParam === shownBuildIdRef.current) return
    let isCurrent = true
    setPhase({ kind: 'resuming' })
    runCoachAction(() => getCoachBuild(buildParam)).then(outcome => {
      if (!isCurrent) return
      if (!outcome.ok) {
        setPhase({ kind: 'failed', failure: toResumeFailure(outcome.failure) })
        return
      }
      shownBuildIdRef.current = buildParam
      setPhase({ kind: 'review', draft: outcome.value, isResumed: true })
    })
    return () => {
      isCurrent = false
    }
  }, [buildParam])

  // Only the initial signed-in visit without ?build looks for a draft, so "Start a new plan" stays on the questionnaire.
  const isLookingForResumableBuild = phase.kind === 'resuming' && !buildParam
  useEffect(() => {
    if (!isLookingForResumableBuild) return
    let isCurrent = true
    runCoachAction(getResumableCoachBuild).then(outcome => {
      if (!isCurrent) return
      if (!outcome.ok) {
        setPhase({ kind: 'failed', failure: outcome.failure })
        return
      }
      if (!outcome.value) {
        setPhase({ kind: 'questionnaire' })
        return
      }
      shownBuildIdRef.current = outcome.value.buildId
      setPhase({ kind: 'review', draft: outcome.value, isResumed: true })
      router.replace(coachBuildPath(outcome.value.buildId), { scroll: false })
    })
    return () => {
      isCurrent = false
    }
  }, [isLookingForResumableBuild, router])

  async function build(input: CoachBuildInput) {
    setPhase({ kind: 'building' })
    window.scrollTo({ top: 0 })
    const outcome = await runCoachAction(() => startCoachBuild(input))
    if (outcome.ok) {
      shownBuildIdRef.current = outcome.value.buildId
      setPhase({ kind: 'review', draft: outcome.value, isResumed: false })
      router.replace(coachBuildPath(outcome.value.buildId), { scroll: false })
      return
    }
    if (outcome.failure.code === 'VALIDATION') {
      setPhase({ kind: 'questionnaire', submitError: outcome.failure.message })
      return
    }
    setPhase({ kind: 'failed', failure: outcome.failure, retryInput: input })
  }

  function startOver() {
    shownBuildIdRef.current = null
    setPhase({ kind: 'questionnaire' })
    window.scrollTo({ top: 0 })
    router.replace(COACH_PATH, { scroll: false })
  }

  if (phase.kind === 'building') return <CoachLoading title="Building your plan" steps={START_STEPS} />
  if (phase.kind === 'resuming') return <CoachReviewSkeleton />
  if (phase.kind === 'review') {
    return (
      <div className="flex flex-col gap-6">
        {phase.isResumed && (
          <Card className="flex flex-col gap-3">
            <p className="text-sm text-[var(--text-secondary)]">
              <span className="font-semibold text-[var(--text-primary)]">Picking up your unsaved plan.</span> Keep editing it, or start over with new answers.
            </p>
            <Button variant="secondary" isFullWidth onClick={startOver}>Start a new plan</Button>
          </Card>
        )}
        <CoachReview
          key={phase.draft.buildId}
          initialDraft={phase.draft}
          isSignedIn={isSignedIn}
          occupiedDays={occupiedDays}
          onStartOver={startOver}
        />
      </div>
    )
  }
  if (phase.kind === 'failed') {
    const { retryInput } = phase
    return (
      <CoachErrorCard
        failure={phase.failure}
        onRetry={retryInput && (() => build(retryInput))}
        onStartOver={startOver}
      />
    )
  }

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-3">
        <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-[var(--accent-emerald)]">
          <SparkIcon size={14} />
          AI Coach
        </p>
        <h1 className="text-2xl font-semibold tracking-tight text-[var(--text-primary)]">Get a weekly plan built around you</h1>
        <p className="text-sm leading-relaxed text-[var(--text-secondary)]">
          Answer a few questions. The coach drafts a week of workouts from our exercise catalog, checks each one against
          your constraints, and shows you every swap it made so you can keep or reject it.
        </p>
      </header>
      {!isSignedIn && (
        <Card className="text-sm text-[var(--text-secondary)]">
          <span className="font-semibold text-[var(--text-primary)]">Free to try.</span> No account needed until you save the plan.
        </Card>
      )}
      <CoachQuestionnaire
        initialValues={formValues}
        submitError={phase.submitError}
        onSubmit={(values, input) => {
          setFormValues(values)
          build(input)
        }}
      />
    </div>
  )
}
