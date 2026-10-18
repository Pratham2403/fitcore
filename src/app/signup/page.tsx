'use client'

import { useState, type FormEvent } from 'react'
import { getSupabaseClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import AuthShell from '@/components/auth/AuthShell'
import PasswordInput from '@/components/auth/PasswordInput'
import Button from '@/components/ui/Button'
import { Input } from '@/components/ui/Field'
import { CheckIcon, MailIcon } from '@/components/ui/Icon'

const supabase = getSupabaseClient()

const MIN_PASSWORD_LENGTH = 8
const PASSWORD_RULES = [
  { label: `At least ${MIN_PASSWORD_LENGTH} characters`, isMet: (password: string) => password.length >= MIN_PASSWORD_LENGTH },
  { label: 'Contains a letter', isMet: (password: string) => /[a-zA-Z]/.test(password) },
  { label: 'Contains a number', isMet: (password: string) => /\d/.test(password) },
] as const

const ONBOARDING_PATH = '/onboarding'

function PasswordRules({ password }: { password: string }) {
  return (
    <ul className="mt-1 space-y-1">
      {PASSWORD_RULES.map(rule => {
        const isMet = rule.isMet(password)
        return (
          <li key={rule.label} className={`flex items-center gap-1.5 ${isMet ? 'text-[var(--accent-emerald)]' : ''}`}>
            <CheckIcon size={14} className={isMet ? '' : 'opacity-30'} />
            {rule.label}
            <span className="sr-only">{isMet ? '(met)' : '(not met)'}</span>
          </li>
        )
      })}
    </ul>
  )
}

export default function SignupPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isAwaitingConfirmation, setIsAwaitingConfirmation] = useState(false)
  const router = useRouter()

  const isPasswordValid = PASSWORD_RULES.every(rule => rule.isMet(password))

  async function handleSignup(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!isPasswordValid) {
      setError('Your password doesn’t meet the rules below yet.')
      return
    }
    setIsLoading(true)
    setError('')

    const { data, error: signUpError } = await supabase.auth.signUp({ email, password })

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
          Open the link to activate your account, then sign in. We&apos;ll walk you through setting up your constraints.
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
