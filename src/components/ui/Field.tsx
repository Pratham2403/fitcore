'use client'

import { forwardRef, useId, type InputHTMLAttributes, type ReactNode, type TextareaHTMLAttributes } from 'react'
import { AlertIcon } from '@/components/ui/Icon'

interface FieldChromeProps {
  /** Visible label text. */
  label: string
  /** Validation message; marks the control invalid when present. */
  error?: string
  /** Helper content shown below the control (and below any error). */
  hint?: ReactNode
}

interface FieldProps extends FieldChromeProps {
  /** Id of the control the label points at. */
  controlId: string
  children: ReactNode
}

const CONTROL_CLASSES =
  'w-full bg-[var(--bg-surface)] text-[var(--text-primary)] text-base placeholder:text-[var(--text-tertiary)] ' +
  'border rounded-[var(--radius-md)] px-4 transition-colors duration-150 ' +
  'focus:border-[var(--accent-emerald)] focus-visible:outline-none focus:ring-2 focus:ring-[var(--accent-emerald-line)]'

function borderClass(hasError: boolean) {
  return hasError ? 'border-[var(--destructive)]' : 'border-[var(--border)] hover:border-[var(--text-tertiary)]'
}

function describedBy(controlId: string, { error, hint }: FieldChromeProps) {
  const ids = [error && `${controlId}-error`, hint && `${controlId}-hint`].filter(Boolean)
  return ids.length > 0 ? ids.join(' ') : undefined
}

/** Label + control + hint/error layout; use directly for custom controls. */
export function Field({ label, error, hint, controlId, children }: FieldProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={controlId} className="text-xs font-medium text-[var(--text-secondary)]">
        {label}
      </label>
      {children}
      {error && (
        <p id={`${controlId}-error`} role="alert" className="flex items-center gap-1.5 text-xs text-[var(--destructive)]">
          <AlertIcon size={14} />
          {error}
        </p>
      )}
      {hint && (
        <div id={`${controlId}-hint`} className="text-xs text-[var(--text-tertiary)]">
          {hint}
        </div>
      )}
    </div>
  )
}

export interface InputProps extends InputHTMLAttributes<HTMLInputElement>, FieldChromeProps {
  /** Element rendered inside the right edge, e.g. a show-password toggle. */
  trailing?: ReactNode
}

/** Labelled single-line text input with error and hint wiring. */
export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, error, hint, trailing, id, className = '', ...rest },
  ref,
) {
  const generatedId = useId()
  const controlId = id ?? generatedId
  return (
    <Field label={label} error={error} hint={hint} controlId={controlId}>
      <div className="relative">
        <input
          ref={ref}
          id={controlId}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy(controlId, { label, error, hint })}
          className={`${CONTROL_CLASSES} ${borderClass(Boolean(error))} min-h-12 ${trailing ? 'pr-12' : ''} ${className}`}
          {...rest}
        />
        {trailing && <div className="absolute inset-y-0 right-1 flex items-center">{trailing}</div>}
      </div>
    </Field>
  )
})

export type TextAreaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & FieldChromeProps

/** Labelled multi-line text input with error and hint wiring. */
export const TextArea = forwardRef<HTMLTextAreaElement, TextAreaProps>(function TextArea(
  { label, error, hint, id, className = '', rows = 4, ...rest },
  ref,
) {
  const generatedId = useId()
  const controlId = id ?? generatedId
  return (
    <Field label={label} error={error} hint={hint} controlId={controlId}>
      <textarea
        ref={ref}
        id={controlId}
        rows={rows}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(controlId, { label, error, hint })}
        className={`${CONTROL_CLASSES} ${borderClass(Boolean(error))} py-3 resize-y ${className}`}
        {...rest}
      />
    </Field>
  )
})
