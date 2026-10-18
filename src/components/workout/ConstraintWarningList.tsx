import type { ConstraintWarning } from '@/types'
import { AlertIcon } from '@/components/ui/Icon'

const TONE_CLASSES = {
  hard: 'border-[color-mix(in_srgb,var(--destructive)_40%,transparent)] bg-[var(--destructive-soft)] text-[var(--destructive)]',
  soft: 'border-[color-mix(in_srgb,var(--accent-orange)_35%,transparent)] bg-[color-mix(in_srgb,var(--accent-orange)_10%,transparent)] text-[var(--accent-orange)]',
} as const

/** Constraint warnings for one exercise; range-of-motion caps and substitutions are red and cannot be dismissed. */
export default function ConstraintWarningList({ warnings }: { warnings: readonly ConstraintWarning[] }) {
  if (warnings.length === 0) return null
  return (
    <ul className="flex flex-col gap-2">
      {warnings.map(warning => (
        <li
          key={`${warning.constraintType}-${warning.action}`}
          className={`flex items-start gap-2 rounded-[var(--radius-sm)] border px-3 py-2 text-xs font-semibold ${
            warning.action === 'warn' ? TONE_CLASSES.soft : TONE_CLASSES.hard
          }`}
        >
          <AlertIcon size={16} className="mt-px shrink-0" />
          <span>
            {warning.warning}
            {warning.safeAlternative && ` — try ${warning.safeAlternative.name}`}
          </span>
        </li>
      ))}
    </ul>
  )
}
