'use client'

import { useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { getSupabaseClient } from '@/lib/supabase/client'
import { HOME_PATH } from '@/lib/auth/links'
import AuthShell from '@/components/auth/AuthShell'
import PasswordInput from '@/components/auth/PasswordInput'
import PasswordRules, { MIN_PASSWORD_LENGTH, isPasswordAcceptable } from '@/components/auth/PasswordRules'
import Button from '@/components/ui/Button'
import { useToast } from '@/components/ui/Toast'

const supabase = getSupabaseClient()

/** Sets a new password for the signed-in (typically recovery-link) session; the middleware keeps signed-out visitors out. */
export default function ResetPasswordPage() {
  const [password, setPassword] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const showToast = useToast()

  async function handleResetPassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!isPasswordAcceptable(password)) {
      setError('Your password doesn’t meet the rules below yet.')
      return
    }
    if (password !== confirmation) {
      setError('The passwords don’t match.')
      return
    }
    setIsLoading(true)
    setError('')

    const { error: updateError } = await supabase.auth.updateUser({ password })

    if (updateError) {
      setError(updateError.message)
      setIsLoading(false)
      return
    }
    showToast('Password updated', 'success')
    router.push(HOME_PATH)
    router.refresh()
  }

  return (
    <AuthShell
      title="Choose a new password"
      subtitle="You’ll stay signed in on this device."
      footer={
        <Link href={HOME_PATH} className="font-semibold text-[var(--accent-emerald)] hover:underline">
          Cancel
        </Link>
      }
    >
      <form onSubmit={handleResetPassword} className="space-y-4">
        <PasswordInput
          label="New password"
          value={password}
          onChange={event => setPassword(event.target.value)}
          required
          minLength={MIN_PASSWORD_LENGTH}
          autoComplete="new-password"
          hint={<PasswordRules password={password} />}
        />
        <PasswordInput
          label="Confirm new password"
          value={confirmation}
          onChange={event => setConfirmation(event.target.value)}
          required
          autoComplete="new-password"
          error={error || undefined}
        />
        <Button type="submit" size="lg" isFullWidth isLoading={isLoading} loadingLabel="Saving…">
          Update password
        </Button>
      </form>
    </AuthShell>
  )
}
