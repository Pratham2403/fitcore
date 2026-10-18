import { describe, expect, it } from 'vitest'
import { summarizeLastSession, type HistoricalSet } from './lastSession'

const identity = { exerciseId: 'Bench_Id', names: ['DB Flat Bench Press'], isAmrap: false }
const set = (sessionId: string, weightKg: number, overrides: Partial<HistoricalSet> = {}): HistoricalSet => ({
  sessionId, exerciseId: 'Bench_Id', exerciseName: 'DB Flat Bench Press', setNumber: 1, reps: 10, weightKg, ...overrides,
})

describe('summarizeLastSession', () => {
  it('returns null when the exercise was never logged', () => {
    expect(summarizeLastSession(identity, ['s1'], [])).toBeNull()
  })

  it('summarises the most recent session and matches legacy rows by name', () => {
    const summary = summarizeLastSession(identity, ['s2', 's1'], [
      set('s1', 10),
      set('s2', 15, { exerciseId: null }),
    ])
    expect(summary).toEqual({ avgWeight: 15, avgReps: 10 })
  })

  it('flags a plateau when weight is unchanged over three sessions', () => {
    const summary = summarizeLastSession(identity, ['s3', 's2', 's1'], [set('s1', 20), set('s2', 20), set('s3', 20)])
    expect(summary?.isPlateaued).toBe(true)
  })

  it('does not flag a plateau when weight progresses', () => {
    const summary = summarizeLastSession(identity, ['s3', 's2', 's1'], [set('s1', 20), set('s2', 22), set('s3', 25)])
    expect(summary?.isPlateaued).toBe(false)
  })

  it('reports best reps per set for AMRAP exercises', () => {
    const summary = summarizeLastSession({ ...identity, isAmrap: true }, ['s1'], [
      set('s1', 40, { setNumber: 2, reps: 6 }),
      set('s1', 40, { setNumber: 1, reps: 8 }),
    ])
    expect(summary?.perSetReps).toEqual([{ setNum: 1, reps: 8 }, { setNum: 2, reps: 6 }])
  })

  it('ignores another exercise with a different catalog id but the same name', () => {
    expect(summarizeLastSession(identity, ['s1'], [set('s1', 30, { exerciseId: 'Other_Id' })])).toBeNull()
  })
})
