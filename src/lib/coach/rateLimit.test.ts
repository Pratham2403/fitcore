import { describe, expect, it } from 'vitest'
import { decideCooldown, decideRateLimit, remainingBuilds, type CoachUsageCounts } from './rateLimit'

const NO_USAGE: CoachUsageCounts = { lifetimeBuilds: 0, buildsThisMonth: 0, buildsToday: 0, attemptsToday: 0 }

describe('decideRateLimit', () => {
  it('allows a first build for every tier', () => {
    for (const tier of ['anonymous', 'free', 'paid'] as const) {
      expect(decideRateLimit(tier, { kind: 'new_build' }, NO_USAGE).allowed).toBe(true)
    }
  })

  it('limits anonymous and free users to one lifetime build', () => {
    const used = { ...NO_USAGE, lifetimeBuilds: 1 }
    expect(decideRateLimit('anonymous', { kind: 'new_build' }, used).allowed).toBe(false)
    expect(decideRateLimit('free', { kind: 'new_build' }, used).allowed).toBe(false)
    expect(decideRateLimit('paid', { kind: 'new_build' }, used).allowed).toBe(true)
  })

  it('caps anonymous attempts per day', () => {
    const decision = decideRateLimit('anonymous', { kind: 'revision', turnCount: 1 }, { ...NO_USAGE, attemptsToday: 3 })
    expect(decision.allowed).toBe(false)
  })

  it('caps turns per build by tier', () => {
    expect(decideRateLimit('free', { kind: 'revision', turnCount: 2 }, NO_USAGE).allowed).toBe(true)
    expect(decideRateLimit('free', { kind: 'revision', turnCount: 3 }, NO_USAGE).allowed).toBe(false)
    expect(decideRateLimit('paid', { kind: 'revision', turnCount: 7 }, NO_USAGE).allowed).toBe(true)
    expect(decideRateLimit('paid', { kind: 'revision', turnCount: 8 }, NO_USAGE).allowed).toBe(false)
  })

  it('caps paid builds per month and per day', () => {
    expect(decideRateLimit('paid', { kind: 'new_build' }, { ...NO_USAGE, buildsThisMonth: 4 }).allowed).toBe(false)
    expect(decideRateLimit('paid', { kind: 'new_build' }, { ...NO_USAGE, buildsThisMonth: 2, buildsToday: 2 }).allowed).toBe(false)
  })

})

describe('decideCooldown', () => {
  it('allows a call only when the slot was acquired', () => {
    expect(decideCooldown(0)).toEqual({ allowed: true })
    expect(decideCooldown(10)).toEqual({ allowed: false, message: 'Give it 10s before the next request.' })
  })
})

describe('remainingBuilds', () => {
  it('uses the lifetime limit for free tiers and the monthly limit for paid', () => {
    expect(remainingBuilds('free', { lifetimeBuilds: 0, buildsThisMonth: 0 })).toBe(1)
    expect(remainingBuilds('free', { lifetimeBuilds: 3, buildsThisMonth: 0 })).toBe(0)
    expect(remainingBuilds('paid', { lifetimeBuilds: 9, buildsThisMonth: 1 })).toBe(3)
  })
})
