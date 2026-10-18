'use client'

import { useState, type FormEvent } from 'react'
import { getSupabaseClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import AuthShell from '@/components/auth/AuthShell'
import PasswordInput from '@/components/auth/PasswordInput'
import Button from '@/components/ui/Button'
import { Input } from '@/components/ui/Field'

const supabase = getSupabaseClient()

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsLoading(true)
    setError('')

    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })

    if (signInError) {
      setError(signInError.message)
      setIsLoading(false)
      return
    }
    router.push('/')
    router.refresh()
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
        />
        <Button type="submit" size="lg" isFullWidth isLoading={isLoading} loadingLabel="Signing in…">
          Sign in
        </Button>
      </form>
    </AuthShell>
  )
}
