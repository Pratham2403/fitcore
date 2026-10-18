import { afterEach, describe, expect, it, vi } from 'vitest'
import { toISODate } from '@/lib/utils'
import { clientLocalDateSchema } from './validation'

describe('toISODate', () => {
  it('uses local calendar fields, not the UTC date', () => {
    expect(toISODate(new Date(2026, 8, 29, 0, 47))).toBe('2026-09-29')
  })
})

describe('clientLocalDateSchema', () => {
  afterEach(() => vi.useRealTimers())

  it('accepts a local date up to one day either side of the server date', () => {
    vi.useFakeTimers({ now: new Date(2026, 8, 28, 19, 17) })
    expect(clientLocalDateSchema.safeParse('2026-09-29').success).toBe(true)
    expect(clientLocalDateSchema.safeParse('2026-09-27').success).toBe(true)
  })

  it('rejects dates further away and malformed input', () => {
    vi.useFakeTimers({ now: new Date(2026, 8, 28, 19, 17) })
    expect(clientLocalDateSchema.safeParse('2026-09-30').success).toBe(false)
    expect(clientLocalDateSchema.safeParse('29/09/2026').success).toBe(false)
  })
})
