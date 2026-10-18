'use client'

import { ToggleChipGroup } from '@/components/ui/Chip'
import { EQUIPMENT_OPTIONS, EQUIPMENT_PRESETS, type Equipment } from './trainingOptions'

interface EquipmentPickerProps {
  selected: readonly Equipment[]
  onChange: (equipment: Equipment[]) => void
}

function isSameSet(left: readonly Equipment[], right: readonly Equipment[]) {
  return left.length === right.length && left.every(item => right.includes(item))
}

/** Equipment multi-select with one-tap presets. */
export default function EquipmentPicker({ selected, onChange }: EquipmentPickerProps) {
  return (
    <div className="flex flex-col gap-4">
      <div role="group" aria-label="Equipment presets" className="grid gap-2">
        {EQUIPMENT_PRESETS.map(preset => {
          const isActive = isSameSet(selected, preset.equipment)
          return (
            <button
              key={preset.label}
              type="button"
              aria-pressed={isActive}
              onClick={() => onChange([...preset.equipment])}
              className={`min-h-12 rounded-[var(--radius-md)] border px-4 text-left text-sm font-semibold transition-colors duration-150 ${
                isActive
                  ? 'border-[var(--accent-emerald)] bg-[var(--accent-emerald-soft)] text-[var(--accent-emerald-strong)]'
                  : 'border-[var(--border)] bg-[var(--bg-surface)] text-[var(--text-primary)] hover:border-[var(--text-tertiary)]'
              }`}
            >
              {preset.label}
            </button>
          )
        })}
      </div>
      <div className="flex flex-col gap-2">
        <p className="text-xs font-medium text-[var(--text-secondary)]">Or pick exactly what you have</p>
        <ToggleChipGroup label="Available equipment" options={EQUIPMENT_OPTIONS} selected={selected} onChange={onChange} />
      </div>
    </div>
  )
}
