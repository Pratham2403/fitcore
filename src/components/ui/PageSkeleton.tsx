import Skeleton from '@/components/ui/Skeleton'

interface PageSkeletonProps {
  /** Real page heading, shown immediately so navigation feels instant. */
  title?: string
  /** Tailwind height classes for each placeholder card, top to bottom. */
  blockHeights: readonly string[]
}

/** Route-level loading shell that mirrors the app page frame to avoid layout shift on arrival. */
export default function PageSkeleton({ title, blockHeights }: PageSkeletonProps) {
  return (
    <div className="mx-auto max-w-lg px-4 pt-6 pb-4" aria-busy="true" aria-label="Loading">
      {title
        ? <h1 className="mb-4 text-xl font-semibold text-[var(--text-primary)]">{title}</h1>
        : <Skeleton className="mb-4 h-7 w-48" />}
      <div className="space-y-4">
        {blockHeights.map((height, index) => <Skeleton key={index} className={`${height} w-full rounded-2xl`} />)}
      </div>
    </div>
  )
}
