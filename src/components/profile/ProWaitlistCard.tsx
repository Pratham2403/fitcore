'use client'

import { joinWaitlist, type WaitlistSource } from '@/lib/waitlist/actions'
import Card from '@/components/ui/Card'
import { SparkIcon } from '@/components/ui/Icon'
import WaitlistForm, { type WaitlistResult } from '@/components/ui/WaitlistForm'

interface ProWaitlistCardProps {
  title: string
  description: string
  source: WaitlistSource
}

async function submitToWaitlist(email: string, source: WaitlistSource): Promise<WaitlistResult> {
  const result = await joinWaitlist(email, source)
  if (!result.ok) return { ok: false, message: result.error.message }
  return { ok: true, message: 'You’re on the list. We’ll email you when Pro opens.' }
}

/** Explains a Pro-only limit and collects a waitlist email. */
export default function ProWaitlistCard({ title, description, source }: ProWaitlistCardProps) {
  return (
    <Card padding="lg" className="flex flex-col gap-4 border-[var(--accent-emerald-line)]">
      <div className="flex items-start gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[var(--accent-emerald-soft)] text-[var(--accent-emerald)]">
          <SparkIcon />
        </span>
        <div>
          <p className="text-base font-semibold">{title}</p>
          <p className="mt-0.5 text-sm text-[var(--text-secondary)]">{description}</p>
        </div>
      </div>
      <WaitlistForm onSubmit={email => submitToWaitlist(email, source)} submitLabel="Join the Pro waitlist" />
    </Card>
  )
}
