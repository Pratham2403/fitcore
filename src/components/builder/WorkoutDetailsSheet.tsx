'use client'

import { useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import type { Protocol, WorkoutPlan } from '@/types'
import { deleteWorkout, updateWorkout } from '@/lib/program/actions'
import { PROTOCOLS } from '@/lib/enums'
import Button from '@/components/ui/Button'
import { ToggleChip } from '@/components/ui/Chip'
import { Input } from '@/components/ui/Field'
import Sheet from '@/components/ui/Sheet'
import { useToast } from '@/components/ui/Toast'
import { PROTOCOL_LABELS } from '@/components/program/programLabels'

interface WorkoutDetailsSheetProps {
  open: boolean
  onClose: () => void
  plan: Pick<WorkoutPlan, 'id' | 'name' | 'focus' | 'protocol'>
  onSaved: (details: { name: string; focus: string; protocol: Protocol }) => void
}

/** Rename, refocus or delete a workout. */
export default function WorkoutDetailsSheet({ open, onClose, plan, onSaved }: WorkoutDetailsSheetProps) {
  const router = useRouter()
  const showToast = useToast()
  const [name, setName] = useState(plan.name)
  const [focus, setFocus] = useState(plan.focus)
  const [protocol, setProtocol] = useState<Protocol>(plan.protocol)
  const [error, setError] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!name.trim()) {
      setError('Give your workout a name.')
      return
    }
    setIsSaving(true)
    try {
      const result = await updateWorkout(plan.id, { name, focus, protocol })
      if (!result.ok) {
        setError(result.error.message)
        return
      }
      onSaved({ name: name.trim(), focus: focus.trim(), protocol })
      onClose()
    } catch {
      setError('Couldn’t save. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  async function handleDelete() {
    setIsDeleting(true)
    try {
      const result = await deleteWorkout(plan.id)
      if (!result.ok) {
        showToast(result.error.message, 'error')
        return
      }
      showToast(`Deleted ${plan.name}`, 'success')
      router.push('/program')
    } catch {
      showToast('Couldn’t delete the workout. Please try again.', 'error')
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <Sheet open={open} onClose={onClose} title="Workout details">
      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
        <Input label="Name" maxLength={60} value={name} error={error} onChange={event => setName(event.target.value)} />
        <Input label="Focus (optional)" maxLength={120} value={focus} onChange={event => setFocus(event.target.value)} />
        <div className="flex flex-col gap-1.5">
          <p id="details-protocol" className="text-xs font-medium text-[var(--text-secondary)]">Warm-up & stretch style</p>
          <div role="group" aria-labelledby="details-protocol" className="flex flex-wrap gap-2">
            {PROTOCOLS.map(option => (
              <ToggleChip key={option} isPressed={protocol === option} onPressedChange={() => setProtocol(option)}>
                {PROTOCOL_LABELS[option]}
              </ToggleChip>
            ))}
          </div>
        </div>
        <Button type="submit" isFullWidth isLoading={isSaving} loadingLabel="Saving…">Save details</Button>
      </form>
      <div className="mt-6 border-t border-[var(--border-subtle)] pt-4">
        {isConfirmingDelete ? (
          <div className="flex flex-col gap-3">
            <p className="text-sm text-[var(--text-secondary)]">
              Delete <strong className="text-[var(--text-primary)]">{plan.name}</strong>? Days using it become rest days. Your logged history stays.
            </p>
            <div className="grid grid-cols-2 gap-2">
              <Button variant="secondary" onClick={() => setIsConfirmingDelete(false)}>Cancel</Button>
              <Button variant="danger" isLoading={isDeleting} loadingLabel="Deleting…" onClick={handleDelete}>Delete</Button>
            </div>
          </div>
        ) : (
          <Button variant="ghost" className="text-[var(--destructive)]" onClick={() => setIsConfirmingDelete(true)}>
            Delete workout
          </Button>
        )}
      </div>
    </Sheet>
  )
}
