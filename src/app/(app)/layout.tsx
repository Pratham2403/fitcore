import { redirect } from 'next/navigation'
import BottomNav from '@/components/nav/BottomNav'
import PendingBuildClaimer from '@/components/coach/PendingBuildClaimer'
import { createClient, getOptionalUserId } from '@/lib/supabase/server'
import { isOnboarded } from '@/lib/profile/onboarding'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const userId = await getOptionalUserId(supabase)
  if (!userId) redirect('/login')
  if (!await isOnboarded(supabase, userId)) redirect('/onboarding')

  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-1 pb-20 overflow-y-auto">
        {children}
      </main>
      <BottomNav />
      <PendingBuildClaimer />
    </div>
  )
}
