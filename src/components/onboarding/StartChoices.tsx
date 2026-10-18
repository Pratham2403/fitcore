import Link from 'next/link'
import type { ReactNode } from 'react'
import { ArrowRightIcon, ProgramIcon, SearchIcon, SparkIcon } from '@/components/ui/Icon'

const START_CHOICES: readonly { href: string; title: string; description: string; icon: ReactNode }[] = [
  { href: '/coach', title: 'AI Coach', description: 'Answer a few questions and review a draft week built around your constraints.', icon: <SparkIcon /> },
  { href: '/program', title: 'Build manually', description: 'Create your own workouts and pick exercises from the catalog.', icon: <ProgramIcon /> },
  { href: '/exercises', title: 'Explore exercises', description: 'Browse 870+ exercises with images and instructions first.', icon: <SearchIcon /> },
]

/** Final onboarding step: where to go next. */
export default function StartChoices() {
  return (
    <ul className="flex flex-col gap-3">
      {START_CHOICES.map(choice => (
        <li key={choice.href}>
          <Link
            href={choice.href}
            className="group flex min-h-20 items-center gap-4 rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--bg-surface)] p-4 transition-colors duration-150 hover:border-[var(--accent-emerald-line)]"
          >
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[var(--accent-emerald-soft)] text-[var(--accent-emerald)]">
              {choice.icon}
            </span>
            <span className="flex flex-1 flex-col gap-0.5">
              <span className="text-base font-semibold text-[var(--text-primary)]">{choice.title}</span>
              <span className="text-xs text-[var(--text-secondary)]">{choice.description}</span>
            </span>
            <ArrowRightIcon size={18} className="shrink-0 text-[var(--text-tertiary)] transition-transform duration-150 group-hover:translate-x-0.5" />
          </Link>
        </li>
      ))}
    </ul>
  )
}
