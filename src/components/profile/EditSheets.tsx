'use client'

import { useState, type ReactNode } from 'react'
import type { ExperienceLevel, ProfileView } from '@/types'
import type { ConstraintInput } from '@/lib/profile/schema'
import { setConstraints, updateEquipment, updateProfile } from '@/lib/profile/actions'
import Button from '@/components/ui/Button'
import SegmentedControl from '@/components/ui/SegmentedControl'
import Sheet from '@/components/ui/Sheet'
import { useToast } from '@/components/ui/Toast'
import BasicsStep from '@/components/onboarding/BasicsStep'
import { validateBasics, type BasicsErrors } from '@/components/onboarding/basics'
import ConstraintEditor from './ConstraintEditor'
import EquipmentPicker from './EquipmentPicker'
import GoalPicker from './GoalPicker'
import SchedulePicker from './SchedulePicker'
import { EXPERIENCE_SEGMENTS, GOAL_OPTIONS, SEX_SEGMENTS, toEquipmentList, type Equipment, type Goal } from './trainingOptions'
import type { ActionResult } from '@/types'

const DEFAULT_DAYS_PER_WEEK = 3
const DEFAULT_SESSION_MINUTES = 60

interface EditSheetProps {
  open: boolean
  onClose: () => void
  profile: ProfileView
}

/** Shared sheet chrome: body + save button that runs `save` and closes on success. */
function SaveSheet({ open, onClose, title, save, children }: {
  open: boolean
  onClose: () => void
  title: string
  save: () => Promise<ActionResult<void> | null>
  children: ReactNode
}) {
  const showToast = useToast()
  const [isSaving, setIsSaving] = useState(false)

  async function handleSave() {
    setIsSaving(true)
    try {
      const result = await save()
      if (result === null) return
      if (!result.ok) {
        showToast(result.error.message, 'error')
        return
      }
      showToast('Saved', 'success')
      onClose()
    } catch {
      showToast('Couldn’t save. Please try again.', 'error')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Sheet open={open} onClose={onClose} title={title}>
      <div className="flex flex-col gap-6">
        {children}
        <Button size="lg" isFullWidth isLoading={isSaving} loadingLabel="Saving…" onClick={handleSave}>Save</Button>
      </div>
    </Sheet>
  )
}

function textOf(value: number | null): string {
  return value === null ? '' : String(value)
}

export function ProfileEditSheet({ open, onClose, profile }: EditSheetProps) {
  const [basics, setBasics] = useState({
    name: profile.name ?? '',
    age: textOf(profile.age),
    sex: SEX_SEGMENTS.find(segment => segment.value === profile.sex)?.value ?? null,
    heightCm: textOf(profile.heightCm),
    startingWeightKg: textOf(profile.startingWeightKg),
  })
  const [errors, setErrors] = useState<BasicsErrors>({})
  const [goal, setGoal] = useState<Goal | null>(GOAL_OPTIONS.find(option => option.value === profile.goal)?.value ?? null)
  const [experience, setExperience] = useState<ExperienceLevel>(profile.experienceLevel ?? 'beginner')
  const [daysPerWeek, setDaysPerWeek] = useState(profile.trainingDaysPerWeek ?? DEFAULT_DAYS_PER_WEEK)
  const [sessionMinutes, setSessionMinutes] = useState(profile.sessionMinutes ?? DEFAULT_SESSION_MINUTES)

  async function save() {
    const { values, errors: nextErrors } = validateBasics(basics)
    setErrors(nextErrors)
    if (!values) return null
    return updateProfile({
      ...values, goal: goal ?? undefined, experienceLevel: experience, trainingDaysPerWeek: daysPerWeek, sessionMinutes,
    })
  }

  return (
    <SaveSheet open={open} onClose={onClose} title="Edit profile" save={save}>
      <BasicsStep form={basics} errors={errors} onChange={setBasics} />
      <GoalPicker value={goal} onChange={setGoal} />
      <SegmentedControl label="Training experience" segments={EXPERIENCE_SEGMENTS} value={experience} onChange={setExperience} />
      <SchedulePicker
        daysPerWeek={daysPerWeek}
        sessionMinutes={sessionMinutes}
        onDaysPerWeekChange={setDaysPerWeek}
        onSessionMinutesChange={setSessionMinutes}
      />
    </SaveSheet>
  )
}

export function EquipmentEditSheet({ open, onClose, profile }: EditSheetProps) {
  const [equipment, setEquipment] = useState<Equipment[]>(() => toEquipmentList(profile.equipment))
  const [error, setError] = useState('')

  async function save() {
    if (equipment.length === 0) {
      setError('Pick at least one option — “Bodyweight” counts.')
      return null
    }
    setError('')
    return updateEquipment(equipment)
  }

  return (
    <SaveSheet open={open} onClose={onClose} title="Equipment" save={save}>
      <EquipmentPicker selected={equipment} onChange={setEquipment} />
      {error && <p role="alert" className="text-sm text-[var(--destructive)]">{error}</p>}
    </SaveSheet>
  )
}

export function ConstraintsEditSheet({ open, onClose, profile }: EditSheetProps) {
  const [constraints, setConstraintList] = useState<ConstraintInput[]>(profile.constraints)
  return (
    <SaveSheet open={open} onClose={onClose} title="Constraints" save={() => setConstraints(constraints)}>
      <ConstraintEditor value={constraints} onChange={setConstraintList} />
    </SaveSheet>
  )
}
