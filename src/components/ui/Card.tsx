import type { HTMLAttributes } from 'react'

export type CardPadding = 'none' | 'md' | 'lg'

const PADDING_CLASSES: Record<CardPadding, string> = {
  none: '',
  md: 'p-4',
  lg: 'p-6',
}

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  padding?: CardPadding
}

/** Surface container matching the app's rounded, bordered card style. */
export default function Card({ padding = 'md', className = '', ...rest }: CardProps) {
  return (
    <div
      className={`rounded-[var(--radius-lg)] border border-[var(--border-subtle)] bg-[var(--bg-surface)] ${PADDING_CLASSES[padding]} ${className}`}
      {...rest}
    />
  )
}
