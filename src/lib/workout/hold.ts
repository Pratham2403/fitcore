const MS_PER_SECOND = 1000

/** Where a timed hold stands: counting down to its target, then counting up as overtime. */
export interface HoldProgress {
  /** Seconds left until the target; 0 once it is reached. */
  remainingSecs: number
  /** Seconds held beyond the target; 0 before it is reached. */
  overtimeSecs: number
  /** Whole seconds held so far — the value a Log records. */
  heldSecs: number
  hasReachedTarget: boolean
}

/** Progress of a hold of `targetSecs` that has run for `elapsedMs`; the hold never stops at the target. */
export function toHoldProgress(targetSecs: number, elapsedMs: number): HoldProgress {
  const elapsedSecs = Math.max(0, elapsedMs) / MS_PER_SECOND
  return {
    remainingSecs: Math.max(0, targetSecs - elapsedSecs),
    overtimeSecs: Math.max(0, elapsedSecs - targetSecs),
    heldSecs: Math.round(elapsedSecs),
    hasReachedTarget: elapsedSecs >= targetSecs,
  }
}
