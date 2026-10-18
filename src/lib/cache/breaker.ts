/** Consecutive failures after which the store is skipped for a cooldown, so a slow Redis cannot add latency to every request. */
const FAILURE_THRESHOLD = 3
const COOLDOWN_MS = 10_000

export interface CircuitBreaker {
  isOpen(): boolean
  /** @returns true when this failure opened the breaker. */
  recordFailure(): boolean
  /** Opens immediately (e.g. on a socket error); @returns true when it was closed before. */
  trip(): boolean
  recordSuccess(): void
}

export function createCircuitBreaker(now: () => number = Date.now): CircuitBreaker {
  let consecutiveFailures = 0
  let openUntil = 0
  const isOpen = () => now() < openUntil
  function trip(): boolean {
    const wasOpen = isOpen()
    openUntil = now() + COOLDOWN_MS
    return !wasOpen
  }
  return {
    isOpen,
    trip,
    recordFailure() {
      consecutiveFailures += 1
      return consecutiveFailures >= FAILURE_THRESHOLD && trip()
    },
    recordSuccess() {
      consecutiveFailures = 0
      openUntil = 0
    },
  }
}
