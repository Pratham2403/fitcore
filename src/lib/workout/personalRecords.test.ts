import { describe, expect, it } from 'vitest'
import { selectRecordCandidate } from './personalRecords'

describe('selectRecordCandidate', () => {
  it('tracks max weight for weighted exercises', () => {
    expect(selectRecordCandidate('weighted', { reps: 10, weight_kg: 22.5 })).toEqual({ recordType: 'max_weight', value: 22.5 })
  })

  it('records nothing for a weighted exercise logged at 0 kg', () => {
    expect(selectRecordCandidate('weighted', { reps: 6, weight_kg: 0 })).toBeNull()
  })

  it('tracks max reps for reps-only and bodyweight exercises, whatever weight is logged', () => {
    expect(selectRecordCandidate('reps_only', { reps: 20 })).toEqual({ recordType: 'max_reps', value: 20 })
    expect(selectRecordCandidate('bodyweight_full', { reps: 8, weight_kg: 75 })).toEqual({ recordType: 'max_reps', value: 8 })
  })

  it('tracks max duration for timed exercises', () => {
    expect(selectRecordCandidate('timed', { reps: 12, weight_kg: 75, duration_secs: 45 }))
      .toEqual({ recordType: 'max_duration_secs', value: 45 })
  })

  it('never records weight or reps for a timed exercise, even when a set carries them', () => {
    expect(selectRecordCandidate('timed', { reps: 15, weight_kg: 5 })).toBeNull()
  })

  it('records nothing for empty sets', () => {
    expect(selectRecordCandidate('reps_only', { reps: 0 })).toBeNull()
    expect(selectRecordCandidate('timed', {})).toBeNull()
  })
})
