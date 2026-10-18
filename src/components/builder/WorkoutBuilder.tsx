'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import type { CatalogExercise, WorkoutPlan } from '@/types'
import { getWorkoutPlan, saveWorkoutExercises } from '@/lib/program/actions'
import Button from '@/components/ui/Button'
import { Chip } from '@/components/ui/Chip'
import EmptyState from '@/components/ui/EmptyState'
import { ArrowRightIcon, PlusIcon, ProgramIcon } from '@/components/ui/Icon'
import { DURATION, EASE } from '@/components/ui/motion'
import { useToast } from '@/components/ui/Toast'
import CatalogPicker from '@/components/catalog/CatalogPicker'
import { PROTOCOL_LABELS } from '@/components/program/programLabels'
import ExerciseEditor from './ExerciseEditor'
import WorkoutDetailsSheet from './WorkoutDetailsSheet'
import { fromCatalogExercise, fromPlanExercise, toExerciseInput, validateDraft, type DraftExercise } from './draft'

const MAX_EXERCISES = 30
const REORDER_TRANSITION = { duration: DURATION.medium, ease: EASE.inOutCubic }

function snapshotOf(drafts: readonly DraftExercise[]): string {
  return JSON.stringify(drafts.map(toExerciseInput))
}

/** Edits a workout's ordered exercise list; changes persist only on Save. */
export default function WorkoutBuilder({ plan: initialPlan }: { plan: WorkoutPlan }) {
  const showToast = useToast()
  const [details, setDetails] = useState({ name: initialPlan.name, focus: initialPlan.focus, protocol: initialPlan.protocol })
  const [drafts, setDrafts] = useState(() => initialPlan.exercises.map(fromPlanExercise))
  const [savedSnapshot, setSavedSnapshot] = useState(() => snapshotOf(drafts))
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isPickerOpen, setIsPickerOpen] = useState(false)
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  const isDirty = useMemo(() => snapshotOf(drafts) !== savedSnapshot, [drafts, savedSnapshot])
  const addedIds = useMemo(() => new Set(drafts.map(draft => draft.exerciseId)), [drafts])

  function replace(key: string, next: DraftExercise) {
    setDrafts(current => current.map(draft => (draft.key === key ? next : draft)))
  }

  function move(index: number, offset: number) {
    setDrafts(current => {
      const target = index + offset
      if (target < 0 || target >= current.length) return current
      const next = [...current]
      ;[next[index], next[target]] = [next[target], next[index]]
      return next
    })
  }

  function add(exercise: CatalogExercise) {
    if (drafts.length >= MAX_EXERCISES) {
      showToast(`A workout can hold up to ${MAX_EXERCISES} exercises.`, 'error')
      return
    }
    setDrafts(current => [...current, fromCatalogExercise(exercise)])
    setIsPickerOpen(false)
    showToast(`Added ${exercise.name}`, 'success')
  }

  async function save() {
    const nextErrors = Object.fromEntries(drafts.flatMap(draft => {
      const error = validateDraft(draft)
      return error ? [[draft.key, error]] : []
    }))
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) {
      showToast('Fix the highlighted exercises first.', 'error')
      return
    }
    setIsSaving(true)
    try {
      const result = await saveWorkoutExercises(initialPlan.id, drafts.map(toExerciseInput))
      if (!result.ok) {
        showToast(result.error.message, 'error')
        return
      }
      // Reload so constraint warnings reflect the saved exercises.
      const savedPlan = await getWorkoutPlan(initialPlan.id)
      if (!savedPlan) {
        showToast('This workout no longer exists.', 'error')
        return
      }
      const saved = savedPlan.exercises.map(fromPlanExercise)
      setDrafts(saved)
      setSavedSnapshot(snapshotOf(saved))
      showToast('Workout saved', 'success')
    } catch {
      showToast('Couldn’t save the workout. Please try again.', 'error')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="mx-auto flex max-w-lg flex-col gap-5 px-4 pb-40 pt-6">
      <header className="flex flex-col gap-3">
        <Link href="/program" className="-ml-1 inline-flex min-h-11 items-center gap-1.5 self-start text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
          <ArrowRightIcon size={16} className="rotate-180" />
          Program
        </Link>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h1 className="truncate text-xl font-semibold">{details.name}</h1>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-[var(--text-secondary)]">
              <Chip>{PROTOCOL_LABELS[details.protocol]}</Chip>
              {details.focus && <span>{details.focus}</span>}
            </div>
          </div>
          <Button variant="secondary" size="sm" onClick={() => setIsDetailsOpen(true)}>Edit</Button>
        </div>
      </header>

      {drafts.length === 0 ? (
        <EmptyState
          icon={<ProgramIcon />}
          title="No exercises yet"
          description="Add exercises from the catalog. We’ll suggest sets, reps and rest you can tweak."
        />
      ) : (
        <ol className="flex flex-col gap-3">
          {drafts.map((draft, index) => (
            <motion.li key={draft.key} layout="position" transition={REORDER_TRANSITION}>
              <ExerciseEditor
                draft={draft}
                position={index}
                total={drafts.length}
                error={errors[draft.key] ?? null}
                onChange={next => replace(draft.key, next)}
                onMove={offset => move(index, offset)}
                onRemove={() => setDrafts(current => current.filter(item => item.key !== draft.key))}
              />
            </motion.li>
          ))}
        </ol>
      )}

      <Button variant="secondary" isFullWidth onClick={() => setIsPickerOpen(true)}>
        <PlusIcon size={18} />
        Add exercise
      </Button>

      {isDirty && (
        <div className="fixed inset-x-0 bottom-[calc(3.5rem+env(safe-area-inset-bottom))] z-40 border-t border-[var(--border-subtle)] bg-[color-mix(in_srgb,var(--bg-primary)_92%,transparent)] px-4 py-3 backdrop-blur-md">
          <div className="mx-auto flex max-w-lg items-center gap-3">
            <p className="flex-1 text-sm text-[var(--text-secondary)]">Unsaved changes</p>
            <Button isLoading={isSaving} loadingLabel="Saving…" onClick={save}>Save workout</Button>
          </div>
        </div>
      )}

      <CatalogPicker open={isPickerOpen} onClose={() => setIsPickerOpen(false)} onPick={add} selectedIds={addedIds} />
      <WorkoutDetailsSheet
        open={isDetailsOpen}
        onClose={() => setIsDetailsOpen(false)}
        plan={{ id: initialPlan.id, ...details }}
        onSaved={setDetails}
      />
    </div>
  )
}
