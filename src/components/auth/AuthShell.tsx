import Link from 'next/link'
import type { ReactNode } from 'react'
import { LogoIcon } from '@/components/ui/Icon'

interface AuthShellProps {
  title: string
  subtitle: string
  children: ReactNode
  /** Line under the form, e.g. the link to switch between sign in and sign up. */
  footer: ReactNode
}

/** Centered brand + form layout shared by the sign-in and sign-up screens. */
export default function AuthShell({ title, subtitle, children, footer }: AuthShellProps) {
  return (
    <div className="relative flex min-h-[100dvh] flex-col items-center justify-center px-4 py-12">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-80 bg-[radial-gradient(60%_70%_at_50%_0%,rgba(16,185,129,0.12),transparent)]"
      />
      <main className="relative w-full max-w-sm">
        <div className="mb-8 text-center">
          <Link
            href="/welcome"
            aria-label="FitCore home"
            className="mb-5 inline-grid h-14 w-14 place-items-center rounded-2xl bg-[var(--accent-emerald)] text-[var(--on-accent)]"
          >
            <LogoIcon size={28} strokeWidth={2.5} />
          </Link>
          <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
          <p className="mt-1.5 text-sm text-[var(--text-secondary)]">{subtitle}</p>
        </div>
        {children}
        <div className="mt-6 text-center text-sm text-[var(--text-secondary)]">{footer}</div>
      </main>
    </div>
  )
}
