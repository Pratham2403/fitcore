import { forwardRef, type ButtonHTMLAttributes } from 'react'
import Spinner from '@/components/ui/Spinner'

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger'
export type ButtonSize = 'sm' | 'md' | 'lg'

/** Visual options shared by `<Button>` and links styled as buttons. */
export interface ButtonStyleOptions {
  variant?: ButtonVariant
  size?: ButtonSize
  /** Stretch to the container's width. */
  isFullWidth?: boolean
}

const BASE_CLASSES =
  'inline-flex items-center justify-center gap-2 font-semibold select-none whitespace-nowrap ' +
  'transition-[background-color,color,border-color,transform,opacity] duration-[var(--dur-1)] ease-[var(--ease-out-quart)] ' +
  'active:scale-[0.97] disabled:pointer-events-none disabled:opacity-50'

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary: 'bg-[var(--accent-emerald)] text-[var(--on-accent)] hover:bg-[var(--accent-emerald-strong)]',
  secondary:
    'bg-[var(--bg-elevated)] text-[var(--text-primary)] border border-[var(--border)] hover:border-[var(--text-tertiary)]',
  ghost: 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface)]',
  danger:
    'bg-[var(--destructive-soft)] text-[var(--destructive)] border border-[color-mix(in_srgb,var(--destructive)_35%,transparent)] hover:bg-[color-mix(in_srgb,var(--destructive)_20%,transparent)]',
}

const SIZE_CLASSES: Record<ButtonSize, string> = {
  sm: 'min-h-9 px-3 text-xs rounded-[var(--radius-sm)]',
  md: 'min-h-11 px-4 text-sm rounded-[var(--radius-md)]',
  lg: 'min-h-[52px] px-6 text-base rounded-[var(--radius-md)]',
}

/** Class list for anything that should look like a button (e.g. a `next/link` CTA). */
export function buttonClassName({ variant = 'primary', size = 'md', isFullWidth = false }: ButtonStyleOptions = {}) {
  return [BASE_CLASSES, VARIANT_CLASSES[variant], SIZE_CLASSES[size], isFullWidth ? 'w-full' : ''].join(' ')
}

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement>, ButtonStyleOptions {
  /** Shows a spinner, disables the button and announces busy state. */
  isLoading?: boolean
  /** Replaces the label while loading, e.g. "Saving…". */
  loadingLabel?: string
}

/** Primary interactive control; defaults to `type="button"` so it never submits a form by accident. */
const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant, size, isFullWidth, isLoading = false, loadingLabel, className = '', disabled, type = 'button', children, ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || isLoading}
      aria-busy={isLoading || undefined}
      className={`${buttonClassName({ variant, size, isFullWidth })} ${className}`}
      {...rest}
    >
      {isLoading && <Spinner />}
      {isLoading && loadingLabel ? loadingLabel : children}
    </button>
  )
})

export default Button
