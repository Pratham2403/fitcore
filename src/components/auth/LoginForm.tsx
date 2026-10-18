'use client'

import { useEffect, useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { getSupabaseClient } from '@/lib/supabase/client'
import { HOME_PATH, ONBOARDING_PATH, buildAuthConfirmUrl } from '@/lib/auth/links'
import AuthShell from '@/components/auth/AuthShell'
import PasswordInput from '@/components/auth/PasswordInput'
import Button from '@/components/ui/Button'
import { Input } from '@/components/ui/Field'
import { AlertIcon, MailIcon } from '@/components/ui/Icon'

const supabase = getSupabaseClient()

const EMAIL_NOT_CONFIRMED_CODE = 'email_not_confirmed'
const RESEND_COOLDOWN_SECONDS = 60
const ONE_SECOND_MS = 1000
const LINK_ERROR_MESSAGE = 'This link is invalid or has expired — sign in or request a new one.'

interface LoginFormProps {
  /** An emailed auth link failed to complete and redirected here. */
  hasLinkError: boolean
}

/** Email + password sign-in, with a rate-limited resend for accounts that haven't confirmed their email. */
export default function LoginForm({ hasLinkError }: LoginFormProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isUnconfirmed, setIsUnconfirmed] = useState(false)
  const [isResending, setIsResending] = useState(false)
  const [resendStatus, setResendStatus] = useState('')
  const [resendCooldownSeconds, setResendCooldownSeconds] = useState(0)
  const router = useRouter()

  useEffect(() => {
    if (resendCooldownSeconds === 0) return
    const timeout = setTimeout(() => setResendCooldownSeconds(seconds => seconds - 1), ONE_SECOND_MS)
    return () => clearTimeout(timeout)
  }, [resendCooldownSeconds])

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsLoading(true)
    setError('')
    setResendStatus('')

    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })

    if (signInError) {
      setError(signInError.message)
      setIsUnconfirmed(signInError.code === EMAIL_NOT_CONFIRMED_CODE)
      setIsLoading(false)
      return
    }
    router.push(HOME_PATH)
    router.refresh()
  }

  async function handleResendConfirmation() {
    setIsResending(true)
    setResendStatus('')
    const { error: resendError } = await supabase.auth.resend({
      type: 'signup',
      email,
      options: { emailRedirectTo: buildAuthConfirmUrl(window.location.origin, ONBOARDING_PATH) },
    })
    setIsResending(false)
    setResendStatus(resendError ? resendError.message : `We sent a new confirmation link to ${email}.`)
    if (!resendError) setResendCooldownSeconds(RESEND_COOLDOWN_SECONDS)
  }

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Sign in to pick up where you left off."
      footer={
        <>
          New to FitCore?{' '}
          <Link href="/signup" className="font-semibold text-[var(--accent-emerald)] hover:underline">
            Create an account
          </Link>
        </>
      }
    >
      {hasLinkError && (
        <div role="alert" className="mb-4 flex items-start gap-3 rounded-[var(--radius-lg)] border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4 text-sm text-[var(--text-secondary)]">
          <AlertIcon size={20} className="mt-0.5 shrink-0 text-[var(--destructive)]" />
          {LINK_ERROR_MESSAGE}
        </div>
      )}
      <form onSubmit={handleLogin} className="space-y-4">
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
          autoComplete="current-password"
          error={error || undefined}
          hint={
            <Link href="/forgot-password" className="font-medium text-[var(--accent-emerald)] hover:underline">
              Forgot password?
            </Link>
          }
        />
        {isUnconfirmed && (
          <div className="space-y-2">
            <Button
              variant="secondary"
              isFullWidth
              onClick={handleResendConfirmation}
              isLoading={isResending}
              loadingLabel="Sending…"
              disabled={resendCooldownSeconds > 0}
            >
              <MailIcon size={16} />
              {resendCooldownSeconds > 0 ? `Resend available in ${resendCooldownSeconds}s` : 'Resend confirmation email'}
            </Button>
            {resendStatus && <p role="status" className="text-center text-xs text-[var(--text-secondary)]">{resendStatus}</p>}
          </div>
        )}
        <Button type="submit" size="lg" isFullWidth isLoading={isLoading} loadingLabel="Signing in…">
          Sign in
        </Button>
      </form>
    </AuthShell>
  )
}
