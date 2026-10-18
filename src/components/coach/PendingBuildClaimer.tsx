'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { claimCoachBuild } from '@/lib/coach/actions'
import { useToast } from '@/components/ui/Toast'
import { clearPendingBuildId, coachBuildPath, readPendingBuildId } from './pendingBuild'

/** After sign-in, attaches a plan drafted while signed out and returns the user to it. Renders nothing. */
export default function PendingBuildClaimer() {
  const router = useRouter()
  const showToast = useToast()

  useEffect(() => {
    const buildId = readPendingBuildId()
    if (!buildId) return
    clearPendingBuildId()
    claimCoachBuild(buildId).then(result => {
      if (!result.ok) {
        showToast('We couldn’t find the plan you drafted before signing in.', 'error')
        return
      }
      router.push(coachBuildPath(buildId))
    })
  }, [router, showToast])

  return null
}
