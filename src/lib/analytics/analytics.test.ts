import { afterEach, describe, expect, it, vi } from 'vitest'
import { computeACWR } from './acwr'
import { detectImbalances } from './imbalance'
import { getPlateauSuggestion } from './plateau'
import { buildCalisthenicsSeries } from './calisthenics'

const DAY_MS = 86400000
const NOW = new Date('2026-09-28T12:00:00Z')
const WEEK_MS = 7 * DAY_MS
const daysAgo = (days: number) => new Date(NOW.getTime() - days * DAY_MS).toISOString().split('T')[0]

afterEach(() => vi.useRealTimers())

describe('computeACWR', () => {
  it('flags a deload when the acute load spikes above 1.3× chronic', () => {
    vi.useFakeTimers({ now: NOW })
    const result = computeACWR([
      { date: daysAgo(1), total_volume_kg: 6000 },
      { date: daysAgo(10), total_volume_kg: 1000 },
      { date: daysAgo(20), total_volume_kg: 1000 },
    ])
    expect(result).toEqual({ acwr: 3, acuteLoad: 6000, chronicLoad: 2000, shouldDeload: true })
  })

  it('does not flag a first week with no earlier baseline', () => {
    vi.useFakeTimers({ now: NOW })
    expect(computeACWR([{ date: daysAgo(0), total_volume_kg: 450 }]).shouldDeload).toBe(false)
  })

  it('returns zero ratio without history', () => {
    vi.useFakeTimers({ now: NOW })
    expect(computeACWR([])).toEqual({ acwr: 0, acuteLoad: 0, chronicLoad: 0, shouldDeload: false })
  })
})

describe('detectImbalances', () => {
  const sides = (left: number, right: number) => [
    ...Array.from({ length: 3 }, () => ({ exercise_id: 'Row_Id', exercise_name: 'Single-Arm DB Row', side: 'left', weight_kg: left })),
    ...Array.from({ length: 3 }, () => ({ exercise_id: 'Row_Id', exercise_name: 'Row (renamed)', side: 'right', weight_kg: right })),
  ]

  it('groups by catalog id and flags asymmetry above the threshold', () => {
    expect(detectImbalances(sides(16, 20))).toEqual([
      { exerciseName: 'Single-Arm DB Row', leftAvg: 16, rightAvg: 20, asymmetryPct: 20, dominantSide: 'right' },
    ])
  })

  it('ignores small asymmetries and too few sets', () => {
    expect(detectImbalances(sides(19, 20))).toEqual([])
    expect(detectImbalances(sides(10, 20).slice(0, 4))).toEqual([])
  })
})

describe('getPlateauSuggestion', () => {
  it('rotates deload → variation → rep shift by week', () => {
    const weekIndex = 3000
    vi.useFakeTimers({ now: weekIndex * WEEK_MS })
    expect(getPlateauSuggestion(20, ['Machine Press']).type).toBe('deload')
    vi.setSystemTime((weekIndex + 1) * WEEK_MS)
    expect(getPlateauSuggestion(20, ['Machine Press'])).toEqual({ type: 'variation', text: 'Try Machine Press for 2 weeks to break the plateau' })
    vi.setSystemTime((weekIndex + 2) * WEEK_MS)
    expect(getPlateauSuggestion(20, ['Machine Press'])).toEqual({ type: 'rep_shift', text: 'Switch to 10–12 reps at 17kg' })
  })

  it('skips the variation without alternatives', () => {
    vi.useFakeTimers({ now: 3001 * WEEK_MS })
    expect(getPlateauSuggestion(20, []).type).toBe('rep_shift')
  })
})

describe('buildCalisthenicsSeries', () => {
  it('keeps the lightest assistance per exercise per date, oldest first', () => {
    const points = buildCalisthenicsSeries([
      { sessionId: 'b', seriesKey: 'dip', weightKg: 35 },
      { sessionId: 'a', seriesKey: 'dip', weightKg: 40 },
      { sessionId: 'a', seriesKey: 'dip', weightKg: 38 },
      { sessionId: 'a', seriesKey: 'pullup', weightKg: 45 },
    ], { a: '2026-09-01', b: '2026-09-08' })
    expect(points).toEqual([{ date: '2026-09-01', dip: 38, pullup: 45 }, { date: '2026-09-08', dip: 35 }])
  })
})
