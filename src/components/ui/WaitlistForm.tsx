'use client'

import { useState, type FormEvent } from 'react'
import Button from '@/components/ui/Button'
import { Input } from '@/components/ui/Field'
import { CheckIcon } from '@/components/ui/Icon'

/** Outcome of a waitlist submission, shown to the user verbatim. */
export interface WaitlistResult {
  ok: boolean
  message: string
}

interface WaitlistFormProps {
  onSubmit: (email: string) => Promise<WaitlistResult>
  /** Submit button label. */
  submitLabel?: string
}

/** Email capture form for the Pro waitlist; the submit handler is injected so any caller can decide where it goes. */
export default function WaitlistForm({ onSubmit, submitLabel = 'Join the waitlist' }: WaitlistFormProps) {
  const [email, setEmail] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [result, setResult] = useState<WaitlistResult | null>(null)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsSubmitting(true)
    setResult(null)
    try {
      setResult(await onSubmit(email.trim()))
    } catch {
      setResult({ ok: false, message: 'Something went wrong. Please try again.' })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (result?.ok) {
    return (
      <p role="status" className="flex items-center gap-2 rounded-[var(--radius-md)] bg-[var(--accent-emerald-soft)] px-4 py-3 text-sm text-[var(--accent-emerald-strong)]">
        <CheckIcon size={18} />
        {result.message}
      </p>
    )
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-3">
      <Input
        label="Email"
        type="email"
        name="email"
        autoComplete="email"
        inputMode="email"
        required
        placeholder="you@email.com"
        value={email}
        onChange={event => setEmail(event.target.value)}
        error={result?.message}
      />
      <Button type="submit" isFullWidth isLoading={isSubmitting} loadingLabel="Joining…">
        {submitLabel}
      </Button>
    </form>
  )
}
