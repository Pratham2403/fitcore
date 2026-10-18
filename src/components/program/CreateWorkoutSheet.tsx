'use client'

import { useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import type { Protocol } from '@/types'
import { createWorkout } from '@/lib/program/actions'
import { PROTOCOLS } from '@/lib/enums'
import Button from '@/components/ui/Button'
import { ToggleChip } from '@/components/ui/Chip'
import { Input } from '@/components/ui/Field'
import Sheet from '@/components/ui/Sheet'
import ProWaitlistCard from '@/components/profile/ProWaitlistCard'
import { PROTOCOL_LABELS } from './programLabels'

interface CreateWorkoutSheetProps {
  open: boolean
  onClose: () => void
  /** Free-plan cap already reached: show the upsell instead of the form. */
  isAtLimit: boolean
  workoutLimit: number | null
}

const MAX_NAME = 60
const MAX_FOCUS = 120

/** Name, focus and warm-up protocol for a new workout; opens the builder on success. */
export default function CreateWorkoutSheet({ open, onClose, isAtLimit, workoutLimit }: CreateWorkoutSheetProps) {
  const router = useRouter()
  const [name, setName] = useState('')
  const [focus, setFocus] = useState('')
  const [protocol, setProtocol] = useState<Protocol>('full_body')
  const [nameError, setNameError] = useState('')
  const [formError, setFormError] = useState('')
  const [isLimitReached, setIsLimitReached] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!name.trim()) {
      setNameError('Give your workout a name.')
      return
    }
    setNameError('')
    setFormError('')
    setIsSaving(true)
    try {
      const result = await createWorkout({ name, focus, protocol })
      if (result.ok) {
        router.push(`/program/${result.value.id}`)
        return
      }
      if (result.error.code === 'WORKOUT_LIMIT_REACHED') setIsLimitReached(true)
      else setFormError(result.error.message)
    } catch {
      setFormError('Couldn’t create the workout. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  const showUpsell = isAtLimit || isLimitReached

  return (
    <Sheet open={open} onClose={onClose} title={showUpsell ? 'Workout limit reached' : 'New workout'}>
      {showUpsell ? (
        <ProWaitlistCard
          title={`The free plan includes ${workoutLimit ?? 'a limited number of'} workouts`}
          description="Delete one you no longer use, or join the Pro waitlist for unlimited workouts."
          source="profile"
        />
      ) : (
        <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
          <Input label="Name" placeholder="e.g. Upper A" maxLength={MAX_NAME} value={name} error={nameError} onChange={event => setName(event.target.value)} />
          <Input label="Focus (optional)" placeholder="e.g. Chest & triceps" maxLength={MAX_FOCUS} value={focus} onChange={event => setFocus(event.target.value)} />
          <div className="flex flex-col gap-1.5">
            <p id="protocol-label" className="text-xs font-medium text-[var(--text-secondary)]">Warm-up & stretch style</p>
            <div role="group" aria-labelledby="protocol-label" className="flex flex-wrap gap-2">
              {PROTOCOLS.map(option => (
                <ToggleChip key={option} isPressed={protocol === option} onPressedChange={() => setProtocol(option)}>
                  {PROTOCOL_LABELS[option]}
                </ToggleChip>
              ))}
            </div>
          </div>
          {formError && <p role="alert" className="text-sm text-[var(--destructive)]">{formError}</p>}
          <Button type="submit" size="lg" isFullWidth isLoading={isSaving} loadingLabel="Creating…">
            Create and add exercises
          </Button>
        </form>
      )}
    </Sheet>
  )
}
