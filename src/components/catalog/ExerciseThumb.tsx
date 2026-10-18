import Image from 'next/image'

const THUMB_SIZES = { sm: 48, md: 64 } as const

interface ExerciseThumbProps {
  name: string
  imageUrls: readonly string[]
  size?: keyof typeof THUMB_SIZES
}

/** Square catalog image, or the exercise's initial when the catalog has no photo. */
export default function ExerciseThumb({ name, imageUrls, size = 'md' }: ExerciseThumbProps) {
  const pixels = THUMB_SIZES[size]
  const [firstImage] = imageUrls
  return (
    <div
      style={{ width: pixels, height: pixels }}
      className="relative shrink-0 overflow-hidden rounded-[var(--radius-sm)] border border-[var(--border-subtle)] bg-[var(--bg-elevated)]"
    >
      {firstImage ? (
        <Image src={firstImage} alt="" fill sizes={`${pixels}px`} loading="lazy" className="object-cover" />
      ) : (
        <span aria-hidden className="grid h-full w-full place-items-center text-lg font-semibold text-[var(--text-tertiary)]">
          {name.charAt(0)}
        </span>
      )}
    </div>
  )
}
