import type { Metadata } from 'next'
import { getEntitlements, getProfile } from '@/lib/profile/actions'
import ProfileView from '@/components/profile/ProfileView'

export const metadata: Metadata = { title: 'Profile' }
export const dynamic = 'force-dynamic'

export default async function ProfilePage() {
  const [profile, entitlements] = await Promise.all([getProfile(), getEntitlements()])
  return <ProfileView profile={profile} entitlements={entitlements} />
}
