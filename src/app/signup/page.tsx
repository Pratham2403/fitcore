'use client'

import { useState, type FormEvent } from 'react'
import { getSupabaseClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import AuthShell from '@/components/auth/AuthShell'
import PasswordInput from '@/components/auth/PasswordInput'
import Button from '@/components/ui/Button'
import { Input } from '@/components/ui/Field'
import PasswordRules, { MIN_PASSWORD_LENGTH, isPasswordAcceptable } from '@/components/auth/PasswordRules'
import { MailIcon } from '@/components/ui/Icon'
import { ONBOARDING_PATH, buildAuthConfirmUrl } from '@/lib/auth/links'

const supabase = getSupabaseClient()

export default function SignupPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isAwaitingConfirmation, setIsAwaitingConfirmation] = useState(false)
  const router = useRouter()

  const isPasswordValid = isPasswordAcceptable(password)

  async function handleSignup(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!isPasswordValid) {
      setError('Your password doesn’t meet the rules below yet.')
      return
    }
    setIsLoading(true)
    setError('')

    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: buildAuthConfirmUrl(window.location.origin, ONBOARDING_PATH) },
    })

    if (signUpError) {
      setError(signUpError.message)
      setIsLoading(false)
      return
    }
    // Without a session the project requires email confirmation before first sign-in
    if (!data.session) {
      setIsAwaitingConfirmation(true)
      setIsLoading(false)
      return
    }
    router.push(ONBOARDING_PATH)
    router.refresh()
  }

  if (isAwaitingConfirmation) {
    return (
      <AuthShell
        title="Check your inbox"
        subtitle={`We sent a confirmation link to ${email}.`}
        footer={
          <Link href="/login" className="font-semibold text-[var(--accent-emerald)] hover:underline">
            Back to sign in
          </Link>
        }
      >
        <div role="status" className="flex items-start gap-3 rounded-[var(--radius-lg)] border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4 text-sm text-[var(--text-secondary)]">
          <MailIcon size={20} className="mt-0.5 shrink-0 text-[var(--accent-emerald)]" />
          Open the link to activate your account. It signs you in and walks you through setting up your constraints.
        </div>
      </AuthShell>
    )
  }

  return (
    <AuthShell
      title="Create your account"
      subtitle="Free forever for logging. Takes about a minute."
      footer={
        <>
          Already have an account?{' '}
          <Link href="/login" className="font-semibold text-[var(--accent-emerald)] hover:underline">
            Sign in
          </Link>
        </>
      }
    >
      <form onSubmit={handleSignup} className="space-y-4">
        <Input
          label="Email"
          type="email"
          value={email}
          onChange={event => setEmail(event.target.value)}
          required
          autoComplete="email"
          inputMode="email"
          placeholder="you@email.com"
        />
        <PasswordInput
          label="Password"
          value={password}
          onChange={event => setPassword(event.target.value)}
          required
          minLength={MIN_PASSWORD_LENGTH}
          autoComplete="new-password"
          error={error || undefined}
          hint={<PasswordRules password={password} />}
        />
        <Button type="submit" size="lg" isFullWidth isLoading={isLoading} loadingLabel="Creating account…">
          Create account
        </Button>
        <p className="text-center text-xs leading-relaxed text-[var(--text-tertiary)]">
          By creating an account you agree to the{' '}
          <Link href="/legal/terms" className="underline hover:text-[var(--text-secondary)]">Terms</Link> and{' '}
          <Link href="/legal/privacy" className="underline hover:text-[var(--text-secondary)]">Privacy Policy</Link>, and
          confirm you&apos;ve read the{' '}
          <Link href="/legal/disclaimer" className="underline hover:text-[var(--text-secondary)]">health disclaimer</Link>.
        </p>
      </form>
    </AuthShell>
  )
}
