import { Skeleton } from '@/components/ui'

export default function Loading() {
  return (
    <div className="space-y-4" aria-busy="true" aria-label="Memuat">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-28" />)}
      </div>
      <Skeleton className="h-64" />
      <Skeleton className="h-48" />
    </div>
  )
}
