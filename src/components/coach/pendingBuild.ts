/** localStorage key for a coach build drafted while signed out, claimed after the user authenticates. */
const PENDING_BUILD_KEY = 'fitcore.pendingCoachBuild'

// Storage can throw (private mode, blocked site data); a lost pending id only means the user re-opens the plan manually.
export function savePendingBuildId(buildId: string): void {
  try {
    localStorage.setItem(PENDING_BUILD_KEY, buildId)
  } catch {
    return
  }
}

export function readPendingBuildId(): string | null {
  try {
    return localStorage.getItem(PENDING_BUILD_KEY)
  } catch {
    return null
  }
}

export function clearPendingBuildId(): void {
  try {
    localStorage.removeItem(PENDING_BUILD_KEY)
  } catch {
    return
  }
}

/** Where to send a signed-in user to finish saving a claimed build. */
export function coachBuildPath(buildId: string): string {
  return `/coach?build=${encodeURIComponent(buildId)}`
}
