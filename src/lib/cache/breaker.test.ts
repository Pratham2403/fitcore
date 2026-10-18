import { describe, expect, it } from 'vitest'
import { createCircuitBreaker } from './breaker'

describe('createCircuitBreaker', () => {
  it('opens after three consecutive failures and closes after the cooldown', () => {
    let now = 0
    const breaker = createCircuitBreaker(() => now)
    expect(breaker.recordFailure()).toBe(false)
    expect(breaker.recordFailure()).toBe(false)
    expect(breaker.recordFailure()).toBe(true)
    expect(breaker.isOpen()).toBe(true)
    now = 10_000
    expect(breaker.isOpen()).toBe(false)
  })

  it('a success resets the failure streak', () => {
    const breaker = createCircuitBreaker(() => 0)
    breaker.recordFailure()
    breaker.recordFailure()
    breaker.recordSuccess()
    expect(breaker.recordFailure()).toBe(false)
    expect(breaker.isOpen()).toBe(false)
  })

  it('trip opens immediately and reports only the transition', () => {
    const breaker = createCircuitBreaker(() => 0)
    expect(breaker.trip()).toBe(true)
    expect(breaker.trip()).toBe(false)
    breaker.recordSuccess()
    expect(breaker.isOpen()).toBe(false)
  })
})
