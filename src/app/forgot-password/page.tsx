'use client'

import { useState, type FormEvent } from 'react'
import Link from 'next/link'
import { getSupabaseClient } from '@/lib/supabase/client'
import { RESET_PASSWORD_PATH, buildAuthConfirmUrl } from '@/lib/auth/links'
import AuthShell from '@/components/auth/AuthShell'
import Button from '@/components/ui/Button'
import { Input } from '@/components/ui/Field'
import { MailIcon } from '@/components/ui/Icon'

const supabase = getSupabaseClient()

const BACK_TO_SIGN_IN = (
  <Link href="/login" className="font-semibold text-[var(--accent-emerald)] hover:underline">
    Back to sign in
  </Link>
)

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isSent, setIsSent] = useState(false)

  async function handleRequestReset(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsLoading(true)
    setError('')

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: buildAuthConfirmUrl(window.location.origin, RESET_PASSWORD_PATH),
    })

    setIsLoading(false)
    if (resetError) {
      setError(resetError.message)
      return
    }
    setIsSent(true)
  }

  if (isSent) {
    return (
      <AuthShell title="Check your inbox" subtitle="The link expires soon, so use it shortly." footer={BACK_TO_SIGN_IN}>
        <div role="status" className="flex items-start gap-3 rounded-[var(--radius-lg)] border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4 text-sm text-[var(--text-secondary)]">
          <MailIcon size={20} className="mt-0.5 shrink-0 text-[var(--accent-emerald)]" />
          If an account exists for {email}, we sent a link to reset your password.
        </div>
      </AuthShell>
    )
  }

  return (
    <AuthShell title="Reset your password" subtitle="We’ll email you a link to choose a new one." footer={BACK_TO_SIGN_IN}>
      <form onSubmit={handleRequestReset} className="space-y-4">
        <Input
          label="Email"
          type="email"
          value={email}
          onChange={event => setEmail(event.target.value)}
          required
          autoComplete="email"
          inputMode="email"
          placeholder="you@email.com"
          error={error || undefined}
        />
        <Button type="submit" size="lg" isFullWidth isLoading={isLoading} loadingLabel="Sending…">
          Send reset link
        </Button>
      </form>
    </AuthShell>
  )
}
