import { describe, expect, it } from 'vitest'
import type { LoggedRow } from '@/lib/workout/resume'
import { nextUpLabel, rowCountOf, setNumberOfRow, sideOfRow } from './setRows'

const EXERCISES = [
  { id: 'row', name: 'One-Arm DB Row', sets: 2, isUnilateral: true },
  { id: 'press', name: 'Bench Press', sets: 2, isUnilateral: false },
  { id: 'plank', name: 'Plank', sets: 1, isUnilateral: false },
]

const logged = (...rowIndices: number[]): LoggedRow[] => rowIndices.map(rowIndex => ({ rowIndex, exerciseId: 'Bench_Press', isPR: false }))

describe('row layout', () => {
  it('interleaves left/right rows for unilateral exercises', () => {
    expect(rowCountOf(EXERCISES[0])).toBe(4)
    expect([0, 1, 2, 3].map(row => [setNumberOfRow(row, true), sideOfRow(row, true)]))
      .toEqual([[1, 'left'], [1, 'right'], [2, 'left'], [2, 'right']])
    expect([sideOfRow(1, false), setNumberOfRow(1, false)]).toEqual([null, 2])
  })
})

describe('nextUpLabel', () => {
  it('points to the right side after the left side of a unilateral set', () => {
    expect(nextUpLabel(EXERCISES, { row: logged(0) }, 0)).toBe('One-Arm DB Row · set 1 right')
  })

  it('points to the next set of the same bilateral exercise', () => {
    expect(nextUpLabel(EXERCISES, { press: logged(0) }, 1)).toBe('Bench Press · set 2')
  })

  it('returns an earlier skipped row before moving on', () => {
    expect(nextUpLabel(EXERCISES, { row: logged(1, 2, 3) }, 0)).toBe('One-Arm DB Row · set 1 left')
  })

  it('skips finished exercises and ends when everything is logged', () => {
    expect(nextUpLabel(EXERCISES, { row: logged(0, 1, 2, 3), press: logged(0, 1) }, 0)).toBe('Plank')
    expect(nextUpLabel(EXERCISES, { plank: logged(0) }, 2)).toBeUndefined()
  })
})
