import Link from 'next/link'
import type { ReactNode } from 'react'
import { LogoIcon } from '@/components/ui/Icon'

const LEGAL_PAGES = [
  { href: '/legal/terms', label: 'Terms' },
  { href: '/legal/privacy', label: 'Privacy' },
  { href: '/legal/disclaimer', label: 'Disclaimer' },
] as const

const PROSE_STYLES = [
  '[&_h1]:text-2xl [&_h1]:font-semibold [&_h1]:text-[var(--text-primary)] [&_h1]:tracking-tight',
  '[&_h2]:text-base [&_h2]:font-semibold [&_h2]:text-[var(--text-primary)] [&_h2]:mt-8 [&_h2]:mb-2',
  '[&_p]:text-sm [&_p]:leading-relaxed [&_p]:text-[var(--text-secondary)] [&_p]:mt-3',
  '[&_ul]:list-disc [&_ul]:pl-5 [&_ul]:mt-3 [&_ul]:space-y-1.5',
  '[&_li]:text-sm [&_li]:leading-relaxed [&_li]:text-[var(--text-secondary)]',
  '[&_strong]:text-[var(--text-primary)] [&_strong]:font-semibold',
  '[&_a]:text-[var(--accent-emerald)] [&_a]:underline [&_a]:underline-offset-2',
].join(' ')

export default function LegalLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)]">
      <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6 sm:py-14">
        <header className="flex flex-wrap items-center justify-between gap-4 border-b border-[var(--border-subtle)] pb-4">
          <Link href="/welcome" className="flex items-center gap-2 font-semibold">
            <span
              aria-hidden="true"
              className="flex h-7 w-7 items-center justify-center rounded-lg bg-[var(--accent-emerald)] text-[var(--on-accent)]"
            >
              <LogoIcon size={18} strokeWidth={2.5} />
            </span>
            FitCore
          </Link>
          <nav aria-label="Legal documents">
            <ul className="flex gap-4 text-sm">
              {LEGAL_PAGES.map((page) => (
                <li key={page.href}>
                  <Link
                    href={page.href}
                    className="text-[var(--text-secondary)] hover:text-[var(--accent-emerald)]"
                  >
                    {page.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </header>

        <main className="pt-8">
          <div
            role="note"
            className="mb-8 rounded-lg border border-[color-mix(in_srgb,var(--accent-orange)_40%,transparent)] bg-[color-mix(in_srgb,var(--accent-orange)_10%,transparent)] px-4 py-3 text-sm font-medium text-[var(--accent-orange)]"
          >
            Draft — review before launch. This document has not been reviewed by a lawyer.
          </div>
          <article className={PROSE_STYLES}>{children}</article>
        </main>
      </div>
    </div>
  )
}
