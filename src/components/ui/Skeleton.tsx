/** Shimmering placeholder block; size and shape come from `className` (e.g. "h-4 w-32 rounded-md"). */
export default function Skeleton({ className = '' }: { className?: string }) {
  return <div aria-hidden className={`skeleton rounded-[var(--radius-sm)] ${className}`} />
}
