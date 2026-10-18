'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import type { ConstraintAction, ConstraintWarning, DayOfWeek } from '@/types'
import type { CoachDraft, CoachExercise } from '@/lib/coach/types'
import type { SubstitutionDecision } from '@/lib/coach/schema'
import { finalizeCoachBuild, reviseCoachBuild } from '@/lib/coach/actions'
import { decidePlanSchedule, type PlanScheduleOutcome } from '@/lib/coach/planSchedule'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import { Chip } from '@/components/ui/Chip'
import { TextArea } from '@/components/ui/Field'
import { AlertIcon, ArrowRightIcon, CheckIcon, CloseIcon, InfoIcon, ShieldIcon, SparkIcon, SwapIcon } from '@/components/ui/Icon'
import Sheet from '@/components/ui/Sheet'
import { useToast } from '@/components/ui/Toast'
import { DAY_NAMES } from '@/components/program/programLabels'
import { CONSTRAINT_INFO } from '@/components/profile/trainingOptions'
import CoachErrorCard from './CoachErrorCard'
import CoachLoading, { REVISE_STEPS } from './CoachLoading'
import { MAX_FREE_TEXT_LENGTH } from './coachForm'
import { runCoachAction, type CoachFailure } from './coachOutcome'
import { savePendingBuildId } from './pendingBuild'

type Decision = SubstitutionDecision['decision']

const PROGRAM_PATH = '/program'
const LOGIN_PATH = '/login'

const WARNING_STYLES: Record<ConstraintAction, string> = {
  cap_rom: 'border-[color-mix(in_srgb,var(--destructive)_40%,transparent)] bg-[var(--destructive-soft)] text-[var(--destructive)]',
  warn: 'border-[color-mix(in_srgb,var(--accent-orange)_35%,transparent)] bg-[color-mix(in_srgb,var(--accent-orange)_10%,transparent)] text-[var(--accent-orange)]',
  substitute: 'border-[color-mix(in_srgb,var(--accent-orange)_35%,transparent)] bg-[color-mix(in_srgb,var(--accent-orange)_10%,transparent)] text-[var(--accent-orange)]',
}

interface CoachReviewProps {
  initialDraft: CoachDraft
  isSignedIn: boolean
  /** Days that already have a workout scheduled. */
  occupiedDays: readonly DayOfWeek[]
  onStartOver: () => void
}

const decisionKey = (dayOfWeek: number, exerciseId: string) => `${dayOfWeek}:${exerciseId}`

const dayListLabel = (days: readonly DayOfWeek[]) => days.map(day => DAY_NAMES[day]).join(', ')

/** States where the plan's workouts land: the days it schedules, and the days that keep their existing workout. */
function scheduleSummary({ scheduledDays, keptDays }: PlanScheduleOutcome) {
  const scheduledPart = scheduledDays.length > 0 ? `Scheduled on ${dayListLabel(scheduledDays)}.` : 'No days are scheduled.'
  if (keptDays.length === 0) return scheduledPart
  const keptPart = keptDays.length === 1
    ? `${dayListLabel(keptDays)} keeps its workout; the new one is saved unscheduled.`
    : `${dayListLabel(keptDays)} keep their workouts; the new ones are saved unscheduled.`
  return `${scheduledPart} ${keptPart}`
}

function revisionsLeftLabel(turnsRemaining: number) {
  if (turnsRemaining === 0) return 'No revisions left'
  return `${turnsRemaining} ${turnsRemaining === 1 ? 'revision' : 'revisions'} left`
}

function WarningBlock({ warning }: { warning: ConstraintWarning }) {
  return (
    <div className={`flex items-start gap-2 rounded-[var(--radius-sm)] border px-3 py-2 text-xs ${WARNING_STYLES[warning.action]}`}>
      <AlertIcon size={14} className="mt-px shrink-0" />
      <div className="flex flex-col gap-0.5">
        <p className="font-semibold">{warning.warning}</p>
        {warning.rationale && <p className="text-[var(--text-secondary)]">{warning.rationale}</p>}
      </div>
    </div>
  )
}

interface SubstitutionPanelProps {
  exercise: CoachExercise
  decision: Decision | undefined
  canReject: boolean
  onDecide: (decision: Decision | undefined) => void
}

function SubstitutionPanel({ exercise, decision, canReject, onDecide }: SubstitutionPanelProps) {
  const { substitution } = exercise
  if (!substitution) return null
  const isPending = substitution.status === 'pending'
  return (
    <div className="flex flex-col gap-2 rounded-[var(--radius-md)] border border-[color-mix(in_srgb,var(--accent-orange)_35%,transparent)] bg-[color-mix(in_srgb,var(--accent-orange)_6%,transparent)] p-3">
      <p className="flex items-center gap-1.5 text-xs font-semibold text-[var(--accent-orange)]">
        <SwapIcon size={14} />
        Swapped for your {CONSTRAINT_INFO[substitution.constraintType].label.toLowerCase()}
      </p>
      <p className="flex flex-wrap items-center gap-1.5 text-sm">
        <span className="text-[var(--text-tertiary)] line-through">{substitution.originalName}</span>
        <ArrowRightIcon size={14} className="text-[var(--text-tertiary)]" />
        <span className="font-semibold text-[var(--accent-emerald)]">{exercise.name}</span>
      </p>
      <p className="text-xs text-[var(--text-secondary)]">{substitution.rationale}</p>
      {isPending && (
        <div role="group" aria-label={`Swap to ${exercise.name}`} className="grid grid-cols-2 gap-2">
          <Button
            size="sm"
            variant={decision === 'approve' ? 'primary' : 'secondary'}
            aria-pressed={decision === 'approve'}
            onClick={() => onDecide(decision === 'approve' ? undefined : 'approve')}
            className="min-h-11"
          >
            <CheckIcon size={16} />
            Keep swap
          </Button>
          <Button
            size="sm"
            variant={decision === 'reject' ? 'danger' : 'secondary'}
            aria-pressed={decision === 'reject'}
            disabled={!canReject}
            onClick={() => onDecide(decision === 'reject' ? undefined : 'reject')}
            className="min-h-11"
          >
            <CloseIcon size={16} />
            Reject
          </Button>
        </div>
      )}
      {!isPending && (
        <Chip tone={substitution.status === 'approved' ? 'accent' : 'danger'}>
          {substitution.status === 'approved' ? 'You kept this swap' : 'You rejected this swap'}
        </Chip>
      )}
    </div>
  )
}

/** Human-in-the-loop review of a coach draft: approve or reject swaps, revise with feedback, then save it. */
export default function CoachReview({ initialDraft, isSignedIn, occupiedDays, onStartOver }: CoachReviewProps) {
  const router = useRouter()
  const showToast = useToast()
  const [draft, setDraft] = useState(initialDraft)
  const [decisions, setDecisions] = useState<Record<string, Decision>>({})
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false)
  const [feedback, setFeedback] = useState('')
  const [reviseError, setReviseError] = useState<string>()
  const [isRevising, setIsRevising] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isSaveSheetOpen, setIsSaveSheetOpen] = useState(false)
  const [shouldReplaceWorkouts, setShouldReplaceWorkouts] = useState(false)
  const [failure, setFailure] = useState<CoachFailure | null>(null)
  const failureRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (failure) failureRef.current?.scrollIntoView({ block: 'start' })
  }, [failure])

  const days = [...draft.days].sort((left, right) => left.dayOfWeek - right.dayOfWeek)
  const planDays = days.map(day => day.dayOfWeek)
  const occupiedPlanDays = planDays.filter(day => occupiedDays.includes(day))
  const plannedSchedule = decidePlanSchedule({ planDays, occupiedDays: new Set(occupiedDays), takeOverDays: shouldReplaceWorkouts })
  const pendingSwapCount = days.flatMap(day => day.exercises).filter(exercise => exercise.substitution?.status === 'pending').length
  const hasRejections = Object.values(decisions).includes('reject')
  const canRevise = draft.turnsRemaining > 0

  function decide(dayOfWeek: number, exerciseId: string, decision: Decision | undefined) {
    const key = decisionKey(dayOfWeek, exerciseId)
    setDecisions(current => {
      const rest = Object.fromEntries(Object.entries(current).filter(([existingKey]) => existingKey !== key))
      return decision ? { ...rest, [key]: decision } : rest
    })
  }

  async function revise() {
    const decisionList: SubstitutionDecision[] = days.flatMap(day => day.exercises.flatMap(exercise => {
      const decision = decisions[decisionKey(day.dayOfWeek, exercise.exerciseId)]
      return decision ? [{ dayOfWeek: day.dayOfWeek, exerciseId: exercise.exerciseId, decision }] : []
    }))
    if (decisionList.length === 0 && feedback.trim() === '') {
      setReviseError('Tell the coach what to change, or keep or reject a swap.')
      return
    }
    setReviseError(undefined)
    setFailure(null)
    setIsRevising(true)
    window.scrollTo({ top: 0 })
    const outcome = await runCoachAction(() => reviseCoachBuild(draft.buildId, decisionList, feedback.trim()))
    setIsRevising(false)
    if (!outcome.ok) {
      setFailure(outcome.failure)
      return
    }
    setDraft(outcome.value)
    setDecisions({})
    setFeedback('')
    setIsFeedbackOpen(false)
  }

  async function save(replaceScheduledWorkouts: boolean) {
    setIsSaveSheetOpen(false)
    setFailure(null)
    setIsSaving(true)
    const outcome = await runCoachAction(() => finalizeCoachBuild(draft.buildId, { replaceScheduledWorkouts }))
    if (outcome.ok) {
      showToast(`Plan saved. ${scheduleSummary(outcome.value)}`, 'success')
      router.push(PROGRAM_PATH)
      return
    }
    if (outcome.failure.code === 'UNAUTHENTICATED') {
      savePendingBuildId(draft.buildId)
      router.push(`/signup?build=${encodeURIComponent(draft.buildId)}`)
      return
    }
    setIsSaving(false)
    setFailure(outcome.failure)
  }

  function requestSave() {
    if (isSignedIn) {
      setIsSaveSheetOpen(true)
      return
    }
    save(false)
  }

  function replaceAndSave() {
    setShouldReplaceWorkouts(true)
    save(true)
  }

  if (isRevising) return <CoachLoading title="Revising your plan" steps={REVISE_STEPS} />

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-3">
        <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-[var(--accent-emerald)]">
          <SparkIcon size={14} />
          Draft plan
        </p>
        <h1 className="text-2xl font-semibold tracking-tight text-[var(--text-primary)]">Your week, drafted</h1>
        <p className="text-sm leading-relaxed text-[var(--text-secondary)]">{draft.summary}</p>
        <div className="flex flex-wrap gap-2">
          <Chip><span className="font-mono">{days.length}</span> days a week</Chip>
          <Chip tone={canRevise ? 'neutral' : 'warning'}>{revisionsLeftLabel(draft.turnsRemaining)}</Chip>
          {pendingSwapCount > 0 && (
            <Chip tone="warning" icon={<SwapIcon size={12} />}>
              <span className="font-mono">{pendingSwapCount}</span> {pendingSwapCount === 1 ? 'swap' : 'swaps'} to review
            </Chip>
          )}
        </div>
      </header>

      <ol className="flex flex-col gap-4">
        {days.map(day => (
          <li key={day.dayOfWeek}>
            <Card padding="none">
              <div className="border-b border-[var(--border-subtle)] px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">{DAY_NAMES[day.dayOfWeek]}</p>
                <h2 className="text-base font-semibold text-[var(--text-primary)]">{day.name}</h2>
                {day.focus && <p className="text-xs text-[var(--text-secondary)]">{day.focus}</p>}
              </div>
              <ul className="divide-y divide-[var(--border-subtle)]">
                {day.exercises.map(exercise => (
                  <li key={exercise.exerciseId} className="flex flex-col gap-2 px-4 py-3">
                    <div className="flex items-start justify-between gap-3">
                      <p className="text-sm font-semibold text-[var(--text-primary)]">{exercise.name}</p>
                      {exercise.isMandatory && <Chip tone="accent" icon={<ShieldIcon size={12} />}>Required</Chip>}
                    </div>
                    <p className="flex flex-wrap gap-x-3 font-mono text-xs text-[var(--text-secondary)]">
                      <span>{exercise.sets} × {exercise.reps}</span>
                      <span>{exercise.restSecs}s rest</span>
                    </p>
                    {exercise.rationale && <p className="text-xs text-[var(--text-tertiary)]">{exercise.rationale}</p>}
                    {exercise.warnings.map(warning => (
                      <WarningBlock key={`${warning.constraintType}:${warning.action}`} warning={warning} />
                    ))}
                    <SubstitutionPanel
                      exercise={exercise}
                      decision={decisions[decisionKey(day.dayOfWeek, exercise.exerciseId)]}
                      canReject={canRevise}
                      onDecide={decision => decide(day.dayOfWeek, exercise.exerciseId, decision)}
                    />
                  </li>
                ))}
              </ul>
            </Card>
          </li>
        ))}
      </ol>

      <p className="flex items-start gap-2 text-xs text-[var(--text-tertiary)]">
        <ShieldIcon size={14} className="mt-px shrink-0" />
        {draft.disclaimer}
      </p>

      <Card className="flex flex-col gap-3">
        <h2 className="text-base font-semibold text-[var(--text-primary)]">Want changes?</h2>
        {!canRevise && <p className="text-sm text-[var(--text-secondary)]">You’ve used all the revisions for this plan.</p>}
        {canRevise && !isFeedbackOpen && (
          <>
            <p className="text-sm text-[var(--text-secondary)]">
              Rejected swaps get a different exercise. You can also tell the coach what else to change.
            </p>
            <Button variant="secondary" onClick={() => setIsFeedbackOpen(true)}>Revise plan</Button>
          </>
        )}
        {canRevise && isFeedbackOpen && (
          <>
            <TextArea
              label="What should the coach change? (optional)"
              placeholder="e.g. “Shorter leg day” or “More back work”"
              rows={3}
              maxLength={MAX_FREE_TEXT_LENGTH}
              value={feedback}
              onChange={event => {
                setFeedback(event.target.value)
                setReviseError(undefined)
              }}
              error={reviseError}
              hint={<span className="font-mono">{feedback.length}/{MAX_FREE_TEXT_LENGTH}</span>}
            />
            <div className="grid grid-cols-2 gap-2">
              <Button variant="ghost" onClick={() => setIsFeedbackOpen(false)}>Cancel</Button>
              <Button onClick={revise}>Send to coach</Button>
            </div>
            <p className="text-xs text-[var(--text-tertiary)]">Uses one of your {revisionsLeftLabel(draft.turnsRemaining).toLowerCase()}.</p>
          </>
        )}
      </Card>

      {failure && (
        <div ref={failureRef} className="scroll-mt-6">
          <CoachErrorCard
            failure={failure}
            onStartOver={onStartOver}
            onReplaceAndSave={replaceAndSave}
          />
        </div>
      )}

      <div className="flex flex-col gap-3">
        {hasRejections && (
          <p className="flex items-start gap-2 text-sm text-[var(--accent-orange)]">
            <InfoIcon size={16} className="mt-0.5 shrink-0" />
            Revise the plan to replace the exercises you rejected, or undo the rejection to save as is.
          </p>
        )}
        <Button size="lg" isFullWidth isLoading={isSaving} loadingLabel="Saving…" disabled={hasRejections} onClick={requestSave}>
          Save plan
        </Button>
        {pendingSwapCount > 0 && !hasRejections && (
          <p className="text-center text-xs text-[var(--text-tertiary)]">Saving keeps any swaps you haven’t reviewed.</p>
        )}
        {!isSignedIn && (
          <p className="text-center text-sm text-[var(--text-secondary)]">
            You’ll create a free account to save it.{' '}
            <Link
              href={LOGIN_PATH}
              onClick={() => savePendingBuildId(draft.buildId)}
              className="font-semibold text-[var(--accent-emerald)] underline underline-offset-2"
            >
              I already have an account
            </Link>
          </p>
        )}
        <Button variant="ghost" isFullWidth onClick={onStartOver}>Start a new plan</Button>
      </div>

      <Sheet open={isSaveSheetOpen} onClose={() => setIsSaveSheetOpen(false)} title="Save to your schedule">
        <div className="flex flex-col gap-4">
          <p className="text-sm text-[var(--text-secondary)]">
            This plan goes on <span className="font-semibold text-[var(--text-primary)]">{dayListLabel(planDays)}</span>.
            {occupiedPlanDays.length > 0 && ` ${dayListLabel(occupiedPlanDays)} already ${occupiedPlanDays.length === 1 ? 'has a workout' : 'have workouts'}.`}
          </p>
          {occupiedPlanDays.length > 0 && (
            <button
              type="button"
              role="switch"
              aria-checked={shouldReplaceWorkouts}
              onClick={() => setShouldReplaceWorkouts(current => !current)}
              className="flex min-h-14 items-start gap-3 rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-surface)] px-4 py-3 text-left"
            >
              <span className="flex flex-1 flex-col gap-0.5">
                <span className="text-sm font-semibold text-[var(--text-primary)]">Replace workouts on {dayListLabel(occupiedPlanDays)}?</span>
                <span className="text-xs text-[var(--text-secondary)]">
                  The new workouts take these days. The old ones stay in your program unscheduled, unless the free plan
                  needs the room — then they’re deleted. Past sessions are kept.
                </span>
              </span>
              <span
                aria-hidden
                className={`relative mt-0.5 h-6 w-10 shrink-0 rounded-full transition-colors duration-150 ${
                  shouldReplaceWorkouts ? 'bg-[var(--accent-emerald)]' : 'bg-[var(--border)]'
                }`}
              >
                <span
                  className={`absolute top-0.5 h-5 w-5 rounded-full bg-[var(--text-primary)] transition-transform duration-150 motion-reduce:transition-none ${
                    shouldReplaceWorkouts ? 'translate-x-[18px]' : 'translate-x-0.5'
                  }`}
                />
              </span>
            </button>
          )}
          <p className="text-sm text-[var(--text-secondary)]">{scheduleSummary(plannedSchedule)}</p>
          <div className="grid grid-cols-2 gap-2">
            <Button variant="ghost" onClick={() => setIsSaveSheetOpen(false)}>Cancel</Button>
            <Button onClick={() => save(shouldReplaceWorkouts)}>Save plan</Button>
          </div>
        </div>
      </Sheet>
    </div>
  )
}
