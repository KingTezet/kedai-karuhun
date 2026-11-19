import { Skeleton } from '@/components/ui'

/** Instant placeholder shown the moment an admin link is clicked. */
export function ListSkeleton() {
  return (
    <div className="space-y-4" aria-busy="true" aria-label="Memuat">
      <Skeleton className="h-16 rounded-xl" />
      {[0, 1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-20 rounded-xl" />)}
    </div>
  )
}

export function DetailSkeleton() {
  return (
    <div className="space-y-4" aria-busy="true" aria-label="Memuat">
      <Skeleton className="h-12 w-2/3 rounded-xl" />
      <div className="grid gap-5 lg:grid-cols-[1fr_360px]">
        <div className="space-y-4">
          <Skeleton className="h-40 rounded-xl" />
          <Skeleton className="h-64 rounded-xl" />
        </div>
        <Skeleton className="h-56 rounded-xl" />
      </div>
    </div>
  )
}
