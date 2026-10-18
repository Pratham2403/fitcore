import type { Metadata } from 'next'
import Link from 'next/link'
import { Suspense } from 'react'
import type { DayOfWeek, ProfileView } from '@/types'
import { getProfile } from '@/lib/profile/actions'
import { getWeeklyProgram } from '@/lib/program/actions'
import { DomainError } from '@/lib/errors'
import { LogoIcon, ShieldIcon } from '@/components/ui/Icon'
import CoachFlow, { CoachReviewSkeleton } from '@/components/coach/CoachFlow'
import { coachFormValuesFromProfile } from '@/components/coach/coachForm'
import { DAYS_OF_WEEK } from '@/components/program/programLabels'

export const metadata: Metadata = {
  title: 'AI Coach',
  description: 'Answer a few questions and get a weekly strength plan that works around your equipment and joints.',
}

/** The signed-in user's profile, or null for anonymous visitors. */
async function loadOptionalProfile(): Promise<ProfileView | null> {
  try {
    return await getProfile()
  } catch (error) {
    if (error instanceof DomainError && error.code === 'UNAUTHENTICATED') return null
    throw error
  }
}

/** Days with a workout on the signed-in user's schedule, so saving a plan can say which days it would take over. */
async function loadOccupiedDays(): Promise<DayOfWeek[]> {
  const { schedule } = await getWeeklyProgram()
  return DAYS_OF_WEEK.filter(day => schedule[day] !== null)
}

export default async function CoachPage() {
  const profile = await loadOptionalProfile()
  const isSignedIn = profile !== null
  const occupiedDays = isSignedIn ? await loadOccupiedDays() : []

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)]">
      <div className="mx-auto flex max-w-lg flex-col px-4 pb-10 pt-[max(1rem,env(safe-area-inset-top))]">
        <header className="flex min-h-14 items-center justify-between gap-4">
          <Link href={isSignedIn ? '/' : '/welcome'} className="flex min-h-11 items-center gap-2 font-semibold">
            <span aria-hidden className="flex h-7 w-7 items-center justify-center rounded-lg bg-[var(--accent-emerald)] text-[var(--on-accent)]">
              <LogoIcon size={18} strokeWidth={2.5} />
            </span>
            FitCore
          </Link>
          <Link
            href={isSignedIn ? '/' : '/login'}
            className="flex min-h-11 items-center text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--accent-emerald)]"
          >
            {isSignedIn ? 'Back to app' : 'Sign in'}
          </Link>
        </header>

        <main className="pt-6">
          <Suspense fallback={<CoachReviewSkeleton />}>
            <CoachFlow initialValues={coachFormValuesFromProfile(profile)} isSignedIn={isSignedIn} occupiedDays={occupiedDays} />
          </Suspense>
        </main>

        <footer className="mt-12 flex items-start gap-2 border-t border-[var(--border-subtle)] pt-4 text-xs text-[var(--text-tertiary)]">
          <ShieldIcon size={14} className="mt-px shrink-0" />
          <p>
            General training guidance, not medical advice. If something hurts, see a physiotherapist.{' '}
            <Link href="/legal/disclaimer" className="underline underline-offset-2 hover:text-[var(--text-secondary)]">
              Full disclaimer
            </Link>
          </p>
        </footer>
      </div>
    </div>
  )
}
