import { z } from 'zod'
import { DomainError } from '@/lib/errors'
import { toISODate } from '@/lib/utils'

const MS_PER_DAY = 86_400_000
/** UTC-12 to UTC+14: a user's local date is at most one day from the server's UTC date. */
const MAX_TIMEZONE_DRIFT_DAYS = 1

/** The caller's local calendar date (YYYY-MM-DD); the server only knows UTC, so "today" must come from the client. */
export const clientLocalDateSchema = z.iso.date().refine(
  date => Math.abs(Date.parse(date) - Date.parse(toISODate())) <= MAX_TIMEZONE_DRIFT_DAYS * MS_PER_DAY,
  'Date must be today',
)

/**
 * Parses untrusted input at an action boundary.
 * @throws DomainError('VALIDATION') with the first issue's message.
 */
export function parseInput<Schema extends z.ZodType>(schema: Schema, input: unknown): z.output<Schema> {
  const parsed = schema.safeParse(input)
  if (!parsed.success) throw new DomainError('VALIDATION', parsed.error.issues[0]?.message ?? 'Invalid input')
  return parsed.data
}
