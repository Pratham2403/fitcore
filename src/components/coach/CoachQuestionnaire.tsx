'use client'

import { useId, useState, type FormEvent, type ReactNode } from 'react'
import type { CatalogExercise } from '@/types'
import type { CoachBuildInput } from '@/lib/coach/schema'
import Button from '@/components/ui/Button'
import { TextArea } from '@/components/ui/Field'
import { AlertIcon, CloseIcon, PlusIcon, SparkIcon } from '@/components/ui/Icon'
import SegmentedControl, { type Segment } from '@/components/ui/SegmentedControl'
import CatalogPicker from '@/components/catalog/CatalogPicker'
import ConstraintEditor from '@/components/profile/ConstraintEditor'
import EquipmentPicker from '@/components/profile/EquipmentPicker'
import {
  EXPERIENCE_SEGMENTS, GOAL_OPTIONS, SESSION_MINUTE_CHOICES, TRAINING_DAY_CHOICES,
} from '@/components/profile/trainingOptions'
import {
  MAX_FREE_TEXT_LENGTH, MAX_PREFERRED_EXERCISES, parseCoachForm,
  type CoachFormErrors, type CoachFormValues,
} from './coachForm'

const DAY_SEGMENTS: readonly Segment<string>[] = TRAINING_DAY_CHOICES.map(days => ({ value: String(days), label: String(days) }))
const MINUTE_SEGMENTS: readonly Segment<string>[] = SESSION_MINUTE_CHOICES.map(minutes => ({ value: String(minutes), label: String(minutes) }))
const FIELD_ORDER: readonly (keyof CoachFormErrors)[] = ['goal', 'equipment', 'freeText']

interface CoachQuestionnaireProps {
  initialValues: CoachFormValues
  /** Server-side validation message from the last attempt. */
  submitError?: string
  onSubmit: (values: CoachFormValues, input: CoachBuildInput) => void
}

function Section({ id, title, description, error, children }: {
  id: string
  title: string
  description?: string
  error?: string
  children: ReactNode
}) {
  return (
    <section id={id} aria-labelledby={`${id}-title`} className="flex scroll-mt-6 flex-col gap-3">
      <div className="flex flex-col gap-1">
        <h2 id={`${id}-title`} className="text-base font-semibold text-[var(--text-primary)]">{title}</h2>
        {description && <p className="text-sm text-[var(--text-secondary)]">{description}</p>}
      </div>
      {children}
      {error && (
        <p role="alert" className="flex items-center gap-1.5 text-xs text-[var(--destructive)]">
          <AlertIcon size={14} />
          {error}
        </p>
      )}
    </section>
  )
}

/** The AI Coach questionnaire; validates locally, then hands the parsed input to `onSubmit`. */
export default function CoachQuestionnaire({ initialValues, submitError, onSubmit }: CoachQuestionnaireProps) {
  const baseId = useId()
  const [values, setValues] = useState(initialValues)
  const [errors, setErrors] = useState<CoachFormErrors>({})
  const [isPickerOpen, setIsPickerOpen] = useState(false)
  const sectionId = (field: string) => `${baseId}-${field}`
  const preferredIds = new Set(values.preferredExercises.map(exercise => exercise.id))
  const isPreferredFull = values.preferredExercises.length >= MAX_PREFERRED_EXERCISES
  const hasErrors = FIELD_ORDER.some(field => errors[field])

  function update<Key extends keyof CoachFormValues>(key: Key, value: CoachFormValues[Key]) {
    setValues(current => ({ ...current, [key]: value }))
    if (key in errors) setErrors(current => ({ ...current, [key]: undefined }))
  }

  function togglePreferred(exercise: CatalogExercise) {
    if (preferredIds.has(exercise.id)) {
      update('preferredExercises', values.preferredExercises.filter(preferred => preferred.id !== exercise.id))
      return
    }
    if (isPreferredFull) return
    update('preferredExercises', [...values.preferredExercises, { id: exercise.id, name: exercise.name }])
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const parsed = parseCoachForm(values)
    if (!parsed.ok) {
      setErrors(parsed.errors)
      const firstInvalid = FIELD_ORDER.find(field => parsed.errors[field])
      if (firstInvalid) document.getElementById(sectionId(firstInvalid))?.scrollIntoView({ block: 'start' })
      return
    }
    onSubmit(values, parsed.input)
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-10">
      <Section id={sectionId('goal')} title="What’s your main goal?" error={errors.goal}>
        <div role="radiogroup" aria-labelledby={`${sectionId('goal')}-title`} className="grid gap-2">
          {GOAL_OPTIONS.map(option => (
            <label
              key={option.value}
              className={
                'flex min-h-14 cursor-pointer flex-col gap-0.5 rounded-[var(--radius-md)] border px-4 py-3 transition-colors duration-150 ' +
                'has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-[var(--accent-emerald-line)] ' +
                (values.goal === option.value
                  ? 'border-[var(--accent-emerald)] bg-[var(--accent-emerald-soft)]'
                  : 'border-[var(--border)] bg-[var(--bg-surface)] hover:border-[var(--text-tertiary)]')
              }
            >
              <input
                type="radio"
                name={sectionId('goal')}
                value={option.value}
                checked={values.goal === option.value}
                onChange={() => update('goal', option.value)}
                className="sr-only"
              />
              <span className="text-sm font-semibold text-[var(--text-primary)]">{option.label}</span>
              <span className="text-xs text-[var(--text-secondary)]">{option.description}</span>
            </label>
          ))}
        </div>
      </Section>

      <Section id={sectionId('experience')} title="How long have you been lifting?">
        <SegmentedControl
          label="Training experience"
          segments={EXPERIENCE_SEGMENTS}
          value={values.experience}
          onChange={experience => update('experience', experience)}
        />
      </Section>

      <Section id={sectionId('days')} title="Days per week">
        <SegmentedControl
          label="Training days per week"
          segments={DAY_SEGMENTS}
          value={String(values.daysPerWeek)}
          onChange={days => update('daysPerWeek', Number(days))}
        />
      </Section>

      <Section id={sectionId('minutes')} title="Minutes per session">
        <SegmentedControl
          label="Minutes per session"
          segments={MINUTE_SEGMENTS}
          value={String(values.sessionMinutes)}
          onChange={minutes => update('sessionMinutes', Number(minutes))}
        />
      </Section>

      <Section id={sectionId('equipment')} title="What equipment do you have?" error={errors.equipment}>
        <EquipmentPicker selected={values.equipment} onChange={equipment => update('equipment', equipment)} />
      </Section>

      <Section
        id={sectionId('constraints')}
        title="Anything to work around?"
        description="Optional. The coach swaps or limits exercises that tend to aggravate these."
      >
        <ConstraintEditor value={values.constraints} onChange={constraints => update('constraints', constraints)} showDetails={false} />
      </Section>

      <Section
        id={sectionId('preferred')}
        title="Exercises you want in"
        description={`Optional, up to ${MAX_PREFERRED_EXERCISES}. The coach includes them where they fit your equipment and constraints.`}
      >
        {values.preferredExercises.length > 0 && (
          <ul className="flex flex-wrap gap-2">
            {values.preferredExercises.map(exercise => (
              <li key={exercise.id}>
                <button
                  type="button"
                  onClick={() => update('preferredExercises', values.preferredExercises.filter(preferred => preferred.id !== exercise.id))}
                  aria-label={`Remove ${exercise.name}`}
                  className="inline-flex min-h-11 items-center gap-1.5 rounded-full border border-[var(--accent-emerald-line)] bg-[var(--accent-emerald-soft)] pl-4 pr-3 text-sm font-medium text-[var(--accent-emerald-strong)]"
                >
                  {exercise.name}
                  <CloseIcon size={14} />
                </button>
              </li>
            ))}
          </ul>
        )}
        <Button variant="secondary" onClick={() => setIsPickerOpen(true)} disabled={isPreferredFull} className="self-start">
          <PlusIcon size={18} />
          {isPreferredFull ? `${MAX_PREFERRED_EXERCISES} picked` : 'Add exercises'}
        </Button>
        <CatalogPicker
          open={isPickerOpen}
          onClose={() => setIsPickerOpen(false)}
          onPick={togglePreferred}
          title={`Exercises you want in (${values.preferredExercises.length}/${MAX_PREFERRED_EXERCISES})`}
          selectedIds={preferredIds}
        />
      </Section>

      <TextArea
        label="Anything else?"
        placeholder="e.g. “I love deadlifts, hate lunges”"
        maxLength={MAX_FREE_TEXT_LENGTH}
        value={values.freeText}
        onChange={event => update('freeText', event.target.value)}
        error={errors.freeText}
        hint={<span className="font-mono">{values.freeText.length}/{MAX_FREE_TEXT_LENGTH}</span>}
      />

      <div className="flex flex-col gap-3">
        {hasErrors && (
          <p role="alert" className="flex items-center gap-1.5 text-sm text-[var(--destructive)]">
            <AlertIcon size={16} />
            Fix the highlighted sections above.
          </p>
        )}
        {submitError && (
          <p role="alert" className="flex items-center gap-1.5 text-sm text-[var(--destructive)]">
            <AlertIcon size={16} />
            {submitError}
          </p>
        )}
        <Button type="submit" size="lg" isFullWidth>
          <SparkIcon size={18} />
          Build my plan
        </Button>
      </div>
    </form>
  )
}
