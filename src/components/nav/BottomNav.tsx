'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion } from 'framer-motion'
import type { ComponentType } from 'react'
import { HistoryIcon, HomeIcon, ProfileIcon, ProgramIcon, TodayIcon, type IconProps } from '@/components/ui/Icon'
import { SPRING } from '@/components/ui/motion'

interface NavItem {
  href: string
  label: string
  Icon: ComponentType<IconProps>
}

const NAV_ITEMS: readonly NavItem[] = [
  { href: '/', label: 'Home', Icon: HomeIcon },
  { href: '/workout', label: 'Today', Icon: TodayIcon },
  { href: '/program', label: 'Program', Icon: ProgramIcon },
  { href: '/history', label: 'History', Icon: HistoryIcon },
  { href: '/profile', label: 'Profile', Icon: ProfileIcon },
]

const ROOT_PATH = '/'
const ACTIVE_STROKE_WIDTH = 2.2
const IDLE_STROKE_WIDTH = 1.9

function isActivePath(pathname: string, href: string) {
  if (href === ROOT_PATH) return pathname === ROOT_PATH
  return pathname === href || pathname.startsWith(`${href}/`)
}

/** Fixed five-tab app navigation with a sliding active indicator. */
export default function BottomNav() {
  const pathname = usePathname()

  return (
    <nav
      aria-label="Main"
      className="fixed inset-x-0 bottom-0 z-50 border-t border-[var(--border-subtle)] bg-[color-mix(in_srgb,var(--bg-surface)_92%,transparent)] pb-[env(safe-area-inset-bottom)] backdrop-blur-md"
    >
      <ul className="mx-auto flex max-w-lg">
        {NAV_ITEMS.map(({ href, label, Icon }) => {
          const isActive = isActivePath(pathname, href)
          return (
            <li key={href} className="flex-1">
              <Link
                href={href}
                aria-current={isActive ? 'page' : undefined}
                className={`flex min-h-14 flex-col items-center justify-center gap-0.5 pt-1.5 pb-1 transition-colors duration-150 ${
                  isActive ? 'text-[var(--accent-emerald)]' : 'text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]'
                }`}
              >
                <span className="relative grid h-7 w-14 place-items-center">
                  {isActive && (
                    <motion.span
                      layoutId="bottom-nav-indicator"
                      transition={SPRING.snappy}
                      className="absolute inset-0 rounded-full bg-[var(--accent-emerald-soft)]"
                    />
                  )}
                  <Icon size={22} strokeWidth={isActive ? ACTIVE_STROKE_WIDTH : IDLE_STROKE_WIDTH} className="relative" />
                </span>
                <span className="text-[11px] font-medium">{label}</span>
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
