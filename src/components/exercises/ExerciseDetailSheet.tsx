'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import type { CatalogExercise, WorkoutSummary } from '@/types'
import Button, { buttonClassName } from '@/components/ui/Button'
import { Chip } from '@/components/ui/Chip'
import Sheet from '@/components/ui/Sheet'
import { CheckIcon, PlusIcon } from '@/components/ui/Icon'
import { useToast } from '@/components/ui/Toast'
import { capitalize } from '@/components/catalog/catalogLabels'
import { appendToWorkout } from './appendToWorkout'

interface ExerciseDetailSheetProps {
  exercise: CatalogExercise | null
  workouts: readonly WorkoutSummary[]
  onClose: () => void
}

function AddToWorkout({ exercise, workouts }: { exercise: CatalogExercise; workouts: readonly WorkoutSummary[] }) {
  const showToast = useToast()
  const [isChoosing, setIsChoosing] = useState(false)
  const [savingId, setSavingId] = useState<string | null>(null)
  const [addedIds, setAddedIds] = useState<ReadonlySet<string>>(new Set())

  async function add(workout: WorkoutSummary) {
    setSavingId(workout.id)
    try {
      const result = await appendToWorkout(workout.id, exercise)
      if (!result.ok) {
        showToast(result.error.message, 'error')
        return
      }
      setAddedIds(current => new Set([...Array.from(current), workout.id]))
      showToast(`Added to ${workout.name}`, 'success')
    } catch {
      showToast('Couldn’t add the exercise. Please try again.', 'error')
    } finally {
      setSavingId(null)
    }
  }

  if (workouts.length === 0) {
    return (
      <Link href="/program" className={buttonClassName({ variant: 'secondary', isFullWidth: true })}>
        Create a workout first
      </Link>
    )
  }
  if (!isChoosing) {
    return (
      <Button isFullWidth onClick={() => setIsChoosing(true)}>
        <PlusIcon size={18} />
        Add to workout
      </Button>
    )
  }
  return (
    <div className="flex flex-col gap-2">
      <p className="text-xs font-medium text-[var(--text-secondary)]">Add to which workout?</p>
      <ul className="flex flex-col gap-2">
        {workouts.map(workout => {
          const isAdded = addedIds.has(workout.id)
          return (
            <li key={workout.id}>
              <Button
                variant="secondary"
                isFullWidth
                className="justify-between"
                disabled={isAdded}
                isLoading={savingId === workout.id}
                loadingLabel="Adding…"
                onClick={() => add(workout)}
              >
                <span className="truncate">{workout.name}</span>
                {isAdded ? <CheckIcon size={18} className="text-[var(--accent-emerald)]" /> : <PlusIcon size={18} />}
              </Button>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

/** Catalog exercise details: images, muscles, instructions and "Add to workout". */
export default function ExerciseDetailSheet({ exercise, workouts, onClose }: ExerciseDetailSheetProps) {
  return (
    <Sheet open={exercise !== null} onClose={onClose} title={exercise?.name}>
      {exercise && (
        <div className="flex flex-col gap-5">
          {exercise.imageUrls.length > 0 && (
            <div className="grid grid-cols-2 gap-2">
              {exercise.imageUrls.map((url, index) => (
                <div key={url} className="relative aspect-square overflow-hidden rounded-[var(--radius-md)] bg-[var(--bg-surface)]">
                  <Image src={url} alt={`${exercise.name}, position ${index + 1}`} fill sizes="(max-width: 512px) 50vw, 240px" className="object-cover" />
                </div>
              ))}
            </div>
          )}
          <div className="flex flex-wrap gap-2">
            {exercise.primaryMuscles.map(muscle => <Chip key={muscle} tone="accent">{capitalize(muscle)}</Chip>)}
            {exercise.secondaryMuscles.map(muscle => <Chip key={muscle}>{capitalize(muscle)}</Chip>)}
          </div>
          <dl className="grid grid-cols-3 gap-3 text-sm">
            {[
              ['Equipment', exercise.equipment ?? 'None'],
              ['Level', exercise.level],
              ['Type', exercise.mechanic ?? exercise.category],
            ].map(([term, detail]) => (
              <div key={term}>
                <dt className="text-xs text-[var(--text-tertiary)]">{term}</dt>
                <dd className="mt-0.5 font-medium">{capitalize(detail)}</dd>
              </div>
            ))}
          </dl>
          {exercise.instructions.length > 0 && (
            <section aria-labelledby="instructions-heading" className="flex flex-col gap-2">
              <h3 id="instructions-heading" className="text-xs font-semibold uppercase tracking-wide text-[var(--text-tertiary)]">How to</h3>
              <ol className="flex list-decimal flex-col gap-2 pl-5 text-sm leading-relaxed text-[var(--text-secondary)] marker:font-mono marker:text-[var(--text-tertiary)]">
                {exercise.instructions.map(step => <li key={step}>{step}</li>)}
              </ol>
            </section>
          )}
          <AddToWorkout key={exercise.id} exercise={exercise} workouts={workouts} />
        </div>
      )}
    </Sheet>
  )
}
