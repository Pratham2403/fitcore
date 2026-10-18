import { describe, expect, it } from 'vitest'
import { toHoldProgress } from './hold'

describe('toHoldProgress', () => {
  it('counts down to the target before it is reached', () => {
    expect(toHoldProgress(30, 12_400)).toEqual({ remainingSecs: 17.6, overtimeSecs: 0, heldSecs: 12, hasReachedTarget: false })
  })

  it('reaches the target exactly at the target duration', () => {
    expect(toHoldProgress(30, 30_000)).toEqual({ remainingSecs: 0, overtimeSecs: 0, heldSecs: 30, hasReachedTarget: true })
  })

  it('keeps counting past the target so the logged hold can exceed it', () => {
    expect(toHoldProgress(30, 41_600)).toMatchObject({ remainingSecs: 0, heldSecs: 42, hasReachedTarget: true })
    expect(toHoldProgress(30, 41_600).overtimeSecs).toBeCloseTo(11.6)
  })

  it('treats a clock that moved backwards as not started', () => {
    expect(toHoldProgress(30, -500)).toEqual({ remainingSecs: 30, overtimeSecs: 0, heldSecs: 0, hasReachedTarget: false })
  })
})
