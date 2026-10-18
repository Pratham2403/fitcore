'use client'

import { useId } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import type { ConstraintType } from '@/types'
import type { ConstraintInput } from '@/lib/profile/schema'
import { CONSTRAINT_TYPES } from '@/lib/enums'
import { Input } from '@/components/ui/Field'
import { CheckIcon, InfoIcon } from '@/components/ui/Icon'
import { DURATION, EASE } from '@/components/ui/motion'
import { CONSTRAINT_INFO, MEDICAL_DISCLAIMER } from './trainingOptions'

const ROM_CAPPED_CONSTRAINT: ConstraintType = 'patellar_tendon'
const DEFAULT_KNEE_ROM_CAP = 90
const MIN_ROM_CAP = 30
const MAX_ROM_CAP = 180

interface ConstraintEditorProps {
  value: readonly ConstraintInput[]
  onChange: (constraints: ConstraintInput[]) => void
  /** Show the optional detail and ROM-cap fields for selected constraints. */
  showDetails?: boolean
}

/** Selectable list of supported physical constraints with an always-visible medical disclaimer. */
export default function ConstraintEditor({ value, onChange, showDetails = true }: ConstraintEditorProps) {
  const baseId = useId()

  function toggle(constraintType: ConstraintType) {
    const isSelected = value.some(item => item.constraintType === constraintType)
    if (isSelected) {
      onChange(value.filter(item => item.constraintType !== constraintType))
      return
    }
    const romCapDegrees = constraintType === ROM_CAPPED_CONSTRAINT ? DEFAULT_KNEE_ROM_CAP : null
    onChange([...value, { constraintType, detail: null, romCapDegrees }])
  }

  function update(constraintType: ConstraintType, patch: Partial<ConstraintInput>) {
    onChange(value.map(item => (item.constraintType === constraintType ? { ...item, ...patch } : item)))
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="flex items-start gap-2 rounded-[var(--radius-md)] border border-[color-mix(in_srgb,var(--accent-orange)_35%,transparent)] bg-[color-mix(in_srgb,var(--accent-orange)_10%,transparent)] px-3 py-2.5 text-xs text-[var(--accent-orange)]">
        <InfoIcon size={16} className="mt-px shrink-0" />
        {MEDICAL_DISCLAIMER}
      </p>
      <ul className="flex flex-col gap-2">
        {CONSTRAINT_TYPES.map(constraintType => {
          const selected = value.find(item => item.constraintType === constraintType)
          const info = CONSTRAINT_INFO[constraintType]
          return (
            <li
              key={constraintType}
              className={`rounded-[var(--radius-md)] border transition-colors duration-150 ${
                selected ? 'border-[var(--accent-emerald)] bg-[var(--accent-emerald-soft)]' : 'border-[var(--border)] bg-[var(--bg-surface)]'
              }`}
            >
              <button
                type="button"
                aria-pressed={Boolean(selected)}
                onClick={() => toggle(constraintType)}
                className="flex min-h-14 w-full items-start gap-3 px-4 py-3 text-left"
              >
                <span
                  aria-hidden
                  className={`mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-md border ${
                    selected ? 'border-[var(--accent-emerald)] bg-[var(--accent-emerald)] text-[var(--on-accent)]' : 'border-[var(--border)]'
                  }`}
                >
                  {selected && <CheckIcon size={14} strokeWidth={2.6} />}
                </span>
                <span className="flex flex-col gap-0.5">
                  <span className="text-sm font-semibold text-[var(--text-primary)]">{info.label}</span>
                  <span className="text-xs text-[var(--text-secondary)]">{info.description}</span>
                </span>
              </button>
              <AnimatePresence initial={false}>
                {showDetails && selected && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: DURATION.medium, ease: EASE.inOutCubic }}
                    className="overflow-hidden"
                  >
                    <div className="flex flex-col gap-3 px-4 pb-4">
                      <Input
                        id={`${baseId}-${constraintType}-detail`}
                        label="Details (optional)"
                        placeholder={constraintType === 'lr_imbalance' ? 'e.g. left side weaker' : 'Anything we should know'}
                        maxLength={200}
                        value={selected.detail ?? ''}
                        onChange={event => update(constraintType, { detail: event.target.value || null })}
                      />
                      {constraintType === ROM_CAPPED_CONSTRAINT && (
                        <Input
                          id={`${baseId}-rom`}
                          label="Knee bend limit (degrees)"
                          type="number"
                          inputMode="numeric"
                          min={MIN_ROM_CAP}
                          max={MAX_ROM_CAP}
                          value={selected.romCapDegrees ?? ''}
                          onChange={event => update(constraintType, {
                            romCapDegrees: event.target.value === '' ? null : Number(event.target.value),
                          })}
                          hint="Leg extensions and similar moves will show a “stop at” cue. 90° is a common starting point."
                        />
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
