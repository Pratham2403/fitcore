'use client'

import { Input } from '@/components/ui/Field'
import { ToggleChip } from '@/components/ui/Chip'
import { AlertIcon } from '@/components/ui/Icon'
import { SEX_SEGMENTS } from '@/components/profile/trainingOptions'
import type { BasicsErrors, BasicsForm } from './basics'

interface BasicsStepProps {
  form: BasicsForm
  errors: BasicsErrors
  onChange: (form: BasicsForm) => void
}

/** Name, age, sex, height and weight inputs. */
export default function BasicsStep({ form, errors, onChange }: BasicsStepProps) {
  return (
    <div className="flex flex-col gap-4">
      <Input
        label="First name"
        autoComplete="given-name"
        maxLength={60}
        value={form.name}
        error={errors.name}
        onChange={event => onChange({ ...form, name: event.target.value })}
      />
      <div className="grid grid-cols-3 gap-3">
        <Input
          label="Age"
          type="number"
          inputMode="numeric"
          value={form.age}
          error={errors.age}
          onChange={event => onChange({ ...form, age: event.target.value })}
        />
        <Input
          label="Height (cm)"
          type="number"
          inputMode="numeric"
          value={form.heightCm}
          error={errors.heightCm}
          onChange={event => onChange({ ...form, heightCm: event.target.value })}
        />
        <Input
          label="Weight (kg)"
          type="number"
          inputMode="decimal"
          step="0.1"
          value={form.startingWeightKg}
          error={errors.startingWeightKg}
          onChange={event => onChange({ ...form, startingWeightKg: event.target.value })}
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <p id="sex-label" className="text-xs font-medium text-[var(--text-secondary)]">Sex</p>
        <div role="group" aria-labelledby="sex-label" className="flex flex-wrap gap-2">
          {SEX_SEGMENTS.map(segment => (
            <ToggleChip
              key={segment.value}
              isPressed={form.sex === segment.value}
              onPressedChange={() => onChange({ ...form, sex: segment.value })}
            >
              {segment.label}
            </ToggleChip>
          ))}
        </div>
        {errors.sex && (
          <p role="alert" className="flex items-center gap-1.5 text-xs text-[var(--destructive)]">
            <AlertIcon size={14} />
            {errors.sex}
          </p>
        )}
        <p className="text-xs text-[var(--text-tertiary)]">Used only to tune volume and recovery suggestions.</p>
      </div>
    </div>
  )
}
