'use client'

import { useId, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import type { VolumeType } from '@/types'
import { VOLUME_TYPES } from '@/lib/enums'
import { formatRestSecs } from '@/lib/utils'
import { Chip, ToggleChip } from '@/components/ui/Chip'
import { Input, TextArea } from '@/components/ui/Field'
import { AlertIcon, ChevronDownIcon, CloseIcon, InfoIcon } from '@/components/ui/Icon'
import { DURATION, EASE } from '@/components/ui/motion'
import ExerciseThumb from '@/components/catalog/ExerciseThumb'
import ConstraintWarningList from '@/components/workout/ConstraintWarningList'
import { withVolumeType, type DraftExercise } from './draft'

const REST_PRESETS = [30, 60, 90, 120, 180] as const
const MIN_SETS = 1
const MAX_SETS = 10

const VOLUME_LABELS: Record<VolumeType, string> = {
  weighted: 'Weighted',
  bodyweight_full: 'Bodyweight',
  reps_only: 'Reps only',
  timed: 'Timed',
}

const FLAG_OPTIONS = [
  { key: 'isUnilateral', label: 'One side at a time' },
  { key: 'isMandatory', label: 'Mandatory' },
  { key: 'isAssistance', label: 'Assisted' },
] as const

interface ExerciseEditorProps {
  draft: DraftExercise
  position: number
  total: number
  error: string | null
  onChange: (draft: DraftExercise) => void
  onMove: (offset: number) => void
  onRemove: () => void
}

function numberFrom(text: string): number {
  return text === '' ? 0 : Number(text)
}

function IconButton({ label, onClick, disabled, children }: { label: string; onClick: () => void; disabled?: boolean; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className="grid h-11 w-11 place-items-center rounded-[var(--radius-sm)] text-[var(--text-secondary)] transition-colors duration-150 hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)] disabled:opacity-30"
    >
      {children}
    </button>
  )
}

/** Collapsible editor for one exercise in a workout. */
export default function ExerciseEditor({ draft, position, total, error, onChange, onMove, onRemove }: ExerciseEditorProps) {
  const [isOpen, setIsOpen] = useState(draft.isUnsaved)
  const panelId = useId()

  function update(patch: Partial<DraftExercise>) {
    onChange({ ...draft, ...patch })
  }

  const target = draft.isTimed && draft.durationSecs ? `${draft.durationSecs}s` : draft.reps
  const summary = `${draft.sets} × ${target} · ${formatRestSecs(draft.restSecs)} rest`

  return (
    <div className={`rounded-[var(--radius-lg)] border bg-[var(--bg-surface)] ${error ? 'border-[var(--destructive)]' : 'border-[var(--border-subtle)]'}`}>
      <div className="flex items-center gap-2 p-2 pl-3">
        <button
          type="button"
          aria-expanded={isOpen}
          aria-controls={panelId}
          onClick={() => setIsOpen(open => !open)}
          className="flex min-h-12 min-w-0 flex-1 items-center gap-3 text-left"
        >
          <ExerciseThumb name={draft.name} imageUrls={draft.imageUrls} size="sm" />
          <span className="flex min-w-0 flex-1 flex-col">
            <span className="truncate text-sm font-semibold">{draft.name}</span>
            <span className="truncate font-mono text-xs text-[var(--text-secondary)]">{summary}</span>
          </span>
          <ChevronDownIcon size={16} className={`shrink-0 text-[var(--text-tertiary)] transition-transform duration-150 ${isOpen ? 'rotate-180' : ''}`} />
        </button>
        <div className="flex flex-col">
          <IconButton label={`Move ${draft.name} up`} disabled={position === 0} onClick={() => onMove(-1)}>
            <ChevronDownIcon size={18} className="rotate-180" />
          </IconButton>
          <IconButton label={`Move ${draft.name} down`} disabled={position === total - 1} onClick={() => onMove(1)}>
            <ChevronDownIcon size={18} />
          </IconButton>
        </div>
      </div>

      <div className="flex flex-col gap-2 px-3 pb-3 empty:hidden">
        {draft.isMandatory && <div><Chip tone="accent">Mandatory</Chip></div>}
        <ConstraintWarningList warnings={draft.warnings} />
        {draft.isUnsaved && (
          <p className="flex items-center gap-1.5 text-xs text-[var(--text-tertiary)]">
            <InfoIcon size={14} />
            Save to check this against your constraints.
          </p>
        )}
        {error && (
          <p role="alert" className="flex items-center gap-1.5 text-xs text-[var(--destructive)]">
            <AlertIcon size={14} />
            {error}
          </p>
        )}
      </div>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            id={panelId}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: DURATION.medium, ease: EASE.inOutCubic }}
            className="overflow-hidden"
          >
            <div className="flex flex-col gap-4 border-t border-[var(--border-subtle)] p-4">
              <Input
                label="Display name"
                value={draft.displayName ?? draft.name}
                maxLength={80}
                onChange={event => update({ displayName: event.target.value, name: event.target.value || draft.name })}
              />
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <p className="text-xs font-medium text-[var(--text-secondary)]">Sets</p>
                  <div className="flex min-h-12 items-center justify-between rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-surface)]">
                    <IconButton label="Fewer sets" disabled={draft.sets <= MIN_SETS} onClick={() => update({ sets: draft.sets - 1 })}>
                      <span aria-hidden className="text-lg">−</span>
                    </IconButton>
                    <span aria-live="polite" className="font-mono text-base">{draft.sets}</span>
                    <IconButton label="More sets" disabled={draft.sets >= MAX_SETS} onClick={() => update({ sets: draft.sets + 1 })}>
                      <span aria-hidden className="text-lg">+</span>
                    </IconButton>
                  </div>
                </div>
                <Input label="Reps" value={draft.reps} placeholder="8–12" onChange={event => update({ reps: event.target.value })} />
              </div>
              <div className="flex flex-col gap-1.5">
                <p id={`${panelId}-rest`} className="text-xs font-medium text-[var(--text-secondary)]">Rest between sets</p>
                <div role="group" aria-labelledby={`${panelId}-rest`} className="flex flex-wrap gap-2">
                  {REST_PRESETS.map(seconds => (
                    <ToggleChip key={seconds} isPressed={draft.restSecs === seconds} onPressedChange={() => update({ restSecs: seconds })}>
                      {formatRestSecs(seconds)}
                    </ToggleChip>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Starting weight (kg)"
                  type="number"
                  inputMode="decimal"
                  step="0.5"
                  min={0}
                  value={draft.defaultWeightKg}
                  onChange={event => update({ defaultWeightKg: numberFrom(event.target.value) })}
                />
                {draft.isTimed && (
                  <Input
                    label="Duration (s)"
                    type="number"
                    inputMode="numeric"
                    min={1}
                    value={draft.durationSecs ?? ''}
                    onChange={event => update({ durationSecs: event.target.value === '' ? null : Number(event.target.value) })}
                  />
                )}
              </div>
              <div role="group" aria-label="Options" className="flex flex-wrap gap-2">
                {FLAG_OPTIONS.map(flag => (
                  <ToggleChip key={flag.key} isPressed={draft[flag.key]} onPressedChange={isPressed => update({ [flag.key]: isPressed })}>
                    {flag.label}
                  </ToggleChip>
                ))}
              </div>
              <div className="flex flex-col gap-1.5">
                <p id={`${panelId}-volume`} className="text-xs font-medium text-[var(--text-secondary)]">Counts toward volume as</p>
                <div role="group" aria-labelledby={`${panelId}-volume`} className="flex flex-wrap gap-2">
                  {VOLUME_TYPES.map(volumeType => (
                    <ToggleChip key={volumeType} isPressed={draft.volumeType === volumeType} onPressedChange={() => onChange(withVolumeType(draft, volumeType))}>
                      {VOLUME_LABELS[volumeType]}
                    </ToggleChip>
                  ))}
                </div>
              </div>
              <TextArea label="Notes" rows={2} maxLength={1000} value={draft.notes} onChange={event => update({ notes: event.target.value })} />
              <button
                type="button"
                onClick={onRemove}
                className="inline-flex min-h-11 items-center gap-1.5 self-start text-sm font-medium text-[var(--destructive)]"
              >
                <CloseIcon size={16} />
                Remove from workout
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
