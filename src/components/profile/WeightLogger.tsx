'use client'

import { useState, type FormEvent } from 'react'
import { logBodyWeight } from '@/lib/profile/actions'
import { toISODate } from '@/lib/utils'
import Button from '@/components/ui/Button'
import { Input } from '@/components/ui/Field'
import { useToast } from '@/components/ui/Toast'

/** Morning body-weight entry; re-logging the same day overwrites it. */
export default function WeightLogger() {
  const showToast = useToast()
  const [weight, setWeight] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (weight.trim() === '') return
    setIsSaving(true)
    try {
      const result = await logBodyWeight(Number(weight), toISODate())
      if (!result.ok) {
        showToast(result.error.code === 'VALIDATION' ? 'Enter a weight between 30 and 250 kg.' : result.error.message, 'error')
        return
      }
      setWeight('')
      showToast(`Logged ${result.value.weightKg} kg`, 'success')
    } catch {
      showToast('Couldn’t log your weight. Please try again.', 'error')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-end gap-2">
      <div className="flex-1">
        <Input label="Morning weight (kg)" type="number" inputMode="decimal" step="0.1" placeholder="70.5" className="font-mono" value={weight} onChange={event => setWeight(event.target.value)} />
      </div>
      <Button type="submit" className="min-h-12" isLoading={isSaving}>Log</Button>
    </form>
  )
}
