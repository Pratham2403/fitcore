import type { ReactNode } from 'react'

interface EmptyStateProps {
  icon: ReactNode
  title: string
  description?: string
  /** Primary next step, usually a Button or button-styled Link. */
  action?: ReactNode
}

/** Friendly placeholder for lists or screens with nothing to show yet. */
export default function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center px-6 py-10 text-center">
      <div className="mb-4 grid h-14 w-14 place-items-center rounded-2xl border border-[var(--accent-emerald-line)] bg-[var(--accent-emerald-soft)] text-[var(--accent-emerald)]">
        {icon}
      </div>
      <p className="text-base font-semibold text-[var(--text-primary)]">{title}</p>
      {description && <p className="mt-1 max-w-xs text-sm text-[var(--text-secondary)]">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}
