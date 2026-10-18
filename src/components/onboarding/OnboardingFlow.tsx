'use client'

import { useState, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { AnimatePresence, motion } from 'framer-motion'
import type { ExperienceLevel, ProfileView } from '@/types'
import type { ConstraintInput } from '@/lib/profile/schema'
import { completeOnboarding } from '@/lib/profile/actions'
import { claimCoachBuild } from '@/lib/coach/actions'
import Button from '@/components/ui/Button'
import ProgressDots from '@/components/ui/ProgressDots'
import SegmentedControl from '@/components/ui/SegmentedControl'
import { AlertIcon } from '@/components/ui/Icon'
import { DURATION, EASE, EXIT } from '@/components/ui/motion'
import { useToast } from '@/components/ui/Toast'
import ConstraintEditor from '@/components/profile/ConstraintEditor'
import EquipmentPicker from '@/components/profile/EquipmentPicker'
import GoalPicker from '@/components/profile/GoalPicker'
import SchedulePicker from '@/components/profile/SchedulePicker'
import {
  EXPERIENCE_SEGMENTS, GOAL_OPTIONS, SEX_SEGMENTS, toEquipmentList, type Equipment, type Goal,
} from '@/components/profile/trainingOptions'
import { clearPendingBuildId, coachBuildPath, readPendingBuildId } from '@/components/coach/pendingBuild'
import BasicsStep from './BasicsStep'
import StartChoices from './StartChoices'
import { validateBasics, type BasicsErrors, type BasicsForm } from './basics'

const STEPS = [
  { title: 'The basics', subtitle: 'So your numbers make sense.' },
  { title: 'Goal & experience', subtitle: 'What are you training for?' },
  { title: 'Your schedule', subtitle: 'Be realistic — consistency beats ambition.' },
  { title: 'Equipment', subtitle: 'We only suggest exercises you can actually do.' },
  { title: 'Anything to work around?', subtitle: 'Optional. We adapt exercises and range of motion to what you select.' },
  { title: 'How do you want to start?', subtitle: 'You’re set up. Pick a starting point — you can do the others any time.' },
] as const

const CONSTRAINTS_STEP = 4
const START_STEP = 5
const STEP_OFFSET_PX = 24
const DEFAULT_DAYS_PER_WEEK = 3
const DEFAULT_SESSION_MINUTES = 60
const MIN_ROM_CAP = 30
const MAX_ROM_CAP = 180

function textOf(value: number | null): string {
  return value === null ? '' : String(value)
}

function initialBasics(profile: ProfileView): BasicsForm {
  return {
    name: profile.name ?? '',
    age: textOf(profile.age),
    sex: SEX_SEGMENTS.find(segment => segment.value === profile.sex)?.value ?? null,
    heightCm: textOf(profile.heightCm),
    startingWeightKg: textOf(profile.startingWeightKg),
  }
}

function hasInvalidRomCap(constraints: readonly ConstraintInput[]): boolean {
  return constraints.some(({ romCapDegrees }) =>
    romCapDegrees !== null && romCapDegrees !== undefined
    && (!Number.isInteger(romCapDegrees) || romCapDegrees < MIN_ROM_CAP || romCapDegrees > MAX_ROM_CAP))
}

interface OnboardingFlowProps {
  profile: ProfileView
  /** Already-onboarded users land straight on the "how to start" step. */
  isOnboarded: boolean
}

/** Multi-step onboarding; saves everything in one call before the final "how to start" step. */
export default function OnboardingFlow({ profile, isOnboarded }: OnboardingFlowProps) {
  const router = useRouter()
  const showToast = useToast()
  const [step, setStep] = useState(isOnboarded ? START_STEP : 0)
  const [direction, setDirection] = useState(1)
  const [basics, setBasics] = useState(() => initialBasics(profile))
  const [basicsErrors, setBasicsErrors] = useState<BasicsErrors>({})
  const [goal, setGoal] = useState<Goal | null>(GOAL_OPTIONS.find(option => option.value === profile.goal)?.value ?? null)
  const [experience, setExperience] = useState<ExperienceLevel>(profile.experienceLevel ?? 'beginner')
  const [daysPerWeek, setDaysPerWeek] = useState(profile.trainingDaysPerWeek ?? DEFAULT_DAYS_PER_WEEK)
  const [sessionMinutes, setSessionMinutes] = useState(profile.sessionMinutes ?? DEFAULT_SESSION_MINUTES)
  const [equipment, setEquipment] = useState<Equipment[]>(() => toEquipmentList(profile.equipment))
  const [constraints, setConstraints] = useState<ConstraintInput[]>(profile.constraints)
  const [stepError, setStepError] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  function goTo(nextStep: number) {
    setDirection(nextStep > step ? 1 : -1)
    setStepError('')
    setStep(nextStep)
  }

  /** Returns an error message for the current step, or '' when it can be left. */
  function validateStep(): string {
    if (step === 0) {
      const { errors } = validateBasics(basics)
      setBasicsErrors(errors)
      return Object.keys(errors).length > 0 ? 'Check the highlighted fields.' : ''
    }
    if (step === 1 && !goal) return 'Pick a goal to continue.'
    if (step === 3 && equipment.length === 0) return 'Pick at least one option — “Bodyweight” counts.'
    if (step === CONSTRAINTS_STEP && hasInvalidRomCap(constraints)) return `Knee bend limit must be between ${MIN_ROM_CAP}° and ${MAX_ROM_CAP}°.`
    return ''
  }

  async function save() {
    const { values } = validateBasics(basics)
    if (!values || !goal) return
    setIsSaving(true)
    try {
      const result = await completeOnboarding({
        ...values, goal, experienceLevel: experience, trainingDaysPerWeek: daysPerWeek, sessionMinutes, equipment, constraints,
      })
      if (!result.ok) {
        setStepError(result.error.message)
        return
      }
      const pendingBuildId = readPendingBuildId()
      if (pendingBuildId) {
        clearPendingBuildId()
        const claim = await claimCoachBuild(pendingBuildId)
        if (claim.ok) {
          router.push(coachBuildPath(pendingBuildId))
          return
        }
        showToast('We couldn’t find the plan you drafted before signing up.', 'error')
      }
      goTo(START_STEP)
    } catch {
      setStepError('Something went wrong saving your answers. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  function next() {
    const error = validateStep()
    if (error) {
      setStepError(error)
      return
    }
    if (step === CONSTRAINTS_STEP) {
      save()
      return
    }
    goTo(step + 1)
  }

  const stepContent: Record<number, ReactNode> = {
    0: <BasicsStep form={basics} errors={basicsErrors} onChange={setBasics} />,
    1: (
      <div className="flex flex-col gap-6">
        <GoalPicker value={goal} onChange={setGoal} />
        <div className="flex flex-col gap-2">
          <p className="text-xs font-medium text-[var(--text-secondary)]">Training experience</p>
          <SegmentedControl label="Training experience" segments={EXPERIENCE_SEGMENTS} value={experience} onChange={setExperience} />
        </div>
      </div>
    ),
    2: (
      <SchedulePicker
        daysPerWeek={daysPerWeek}
        sessionMinutes={sessionMinutes}
        onDaysPerWeekChange={setDaysPerWeek}
        onSessionMinutesChange={setSessionMinutes}
      />
    ),
    3: <EquipmentPicker selected={equipment} onChange={setEquipment} />,
    4: <ConstraintEditor value={constraints} onChange={setConstraints} />,
    5: <StartChoices />,
  }

  const { title, subtitle } = STEPS[step]
  const isStartStep = step === START_STEP

  return (
    <div className="mx-auto flex min-h-[100dvh] w-full max-w-lg flex-col px-4 pt-[max(1rem,env(safe-area-inset-top))]">
      <header className="flex min-h-12 items-center justify-between">
        {step > 0 && !isStartStep ? (
          <Button variant="ghost" size="sm" className="-ml-2 min-h-11" onClick={() => goTo(step - 1)}>
            Back
          </Button>
        ) : <span />}
        <ProgressDots total={STEPS.length} current={step} label="Onboarding progress" />
      </header>

      <AnimatePresence mode="wait" initial={false} custom={direction}>
        <motion.section
          key={step}
          custom={direction}
          initial={{ opacity: 0, x: direction * STEP_OFFSET_PX }}
          animate={{ opacity: 1, x: 0, transition: { duration: DURATION.medium, ease: EASE.outQuart } }}
          exit={{ opacity: 0, x: direction * -STEP_OFFSET_PX, transition: EXIT }}
          aria-labelledby="onboarding-step-title"
          className="flex flex-1 flex-col gap-6 pb-32 pt-6"
        >
          <div>
            <h1 id="onboarding-step-title" className="text-2xl font-semibold tracking-tight">{title}</h1>
            <p className="mt-1 text-sm text-[var(--text-secondary)]">{subtitle}</p>
          </div>
          {stepContent[step]}
        </motion.section>
      </AnimatePresence>

      {!isStartStep && (
        <footer className="fixed inset-x-0 bottom-0 border-t border-[var(--border-subtle)] bg-[color-mix(in_srgb,var(--bg-primary)_92%,transparent)] px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur-md">
          <div className="mx-auto flex max-w-lg flex-col gap-2">
            {stepError && (
              <p role="alert" className="flex items-center gap-1.5 text-xs text-[var(--destructive)]">
                <AlertIcon size={14} />
                {stepError}
              </p>
            )}
            <Button size="lg" isFullWidth isLoading={isSaving} loadingLabel="Saving…" onClick={next}>
              {step === CONSTRAINTS_STEP ? 'Finish setup' : 'Continue'}
            </Button>
          </div>
        </footer>
      )}
    </div>
  )
}
