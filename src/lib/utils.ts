import type { DayType } from '@/types'

export function formatTime(secs: number): string {
  const m = Math.floor(secs / 60)
  const s = Math.floor(secs % 60)
  return `${m}:${String(s).padStart(2, '0')}`
}

export function getGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}

export function getTodayDayType(): DayType {
  const map: Record<number, DayType> = {
    0: 'recovery',
    1: 'push_a',
    2: 'pull_a',
    3: 'legs_a',
    4: 'push_b',
    5: 'pull_b',
    6: 'legs_b',
  }
  return map[new Date().getDay()]
}

export function getDayLabel(dayType: DayType): string {
  const labels: Record<DayType, string> = {
    push_a: 'Push A — Chest + Triceps',
    pull_a: 'Pull A — Back + Biceps + Forearms',
    legs_a: 'Legs A — Quad-Dominant + Core',
    push_b: 'Push B — Chest + Shoulders + Triceps',
    pull_b: 'Pull B — Back + Biceps + Forearms',
    legs_b: 'Legs B — Hip/Posterior-Dominant + Core',
    recovery: 'Recovery — Cardio + Mobility',
  }
  return labels[dayType]
}

export function toISODate(date = new Date()): string {
  return date.toISOString().split('T')[0]
}

export function getWeekStart(): string {
  const now = new Date()
  const monday = new Date(now)
  monday.setDate(now.getDate() - ((now.getDay() + 6) % 7))
  return toISODate(monday)
}

export function getLastWeekStart(): string {
  const now = new Date()
  const monday = new Date(now)
  monday.setDate(now.getDate() - ((now.getDay() + 6) % 7) - 7)
  return toISODate(monday)
}

export function formatRestSecs(secs: number): string {
  if (secs < 60) return `${secs}s`
  const m = Math.floor(secs / 60)
  const s = secs % 60
  return s === 0 ? `${m}:00` : `${m}:${String(s).padStart(2, '0')}`
}

export function cn(...classes: (string | undefined | false | null)[]): string {
  return classes.filter(Boolean).join(' ')
}
