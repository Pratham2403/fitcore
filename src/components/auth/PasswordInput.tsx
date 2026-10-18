'use client'

import { useState } from 'react'
import { Input, type InputProps } from '@/components/ui/Field'
import { EyeIcon, EyeOffIcon } from '@/components/ui/Icon'

/** Password field with a show/hide toggle. */
export default function PasswordInput(props: Omit<InputProps, 'type' | 'trailing'>) {
  const [isVisible, setIsVisible] = useState(false)
  return (
    <Input
      {...props}
      type={isVisible ? 'text' : 'password'}
      trailing={
        <button
          type="button"
          onClick={() => setIsVisible(visible => !visible)}
          aria-label={isVisible ? 'Hide password' : 'Show password'}
          aria-pressed={isVisible}
          className="grid h-10 w-10 place-items-center rounded-[var(--radius-sm)] text-[var(--text-tertiary)] transition-colors hover:text-[var(--text-primary)]"
        >
          {isVisible ? <EyeOffIcon size={18} /> : <EyeIcon size={18} />}
        </button>
      }
    />
  )
}
