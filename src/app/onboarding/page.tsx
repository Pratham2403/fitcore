import type { Metadata } from 'next'
import { getProfile } from '@/lib/profile/actions'
import OnboardingFlow from '@/components/onboarding/OnboardingFlow'

export const metadata: Metadata = { title: 'Set up' }
export const dynamic = 'force-dynamic'

export default async function OnboardingPage() {
  const profile = await getProfile()
  return <OnboardingFlow profile={profile} isOnboarded={profile.onboardedAt !== null} />
}
