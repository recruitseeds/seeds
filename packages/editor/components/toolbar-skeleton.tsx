import { Skeleton } from '@seeds/ui/skeleton'

export function ToolbarSkeleton() {
  return (
    <div className="sticky top-0 z-40 border-b border-dashed bg-background">
      <div className="flex items-center p-2 gap-2">
        <Skeleton className="h-8 w-8" />
        <Skeleton className="h-8 w-8" />
        <Skeleton className="h-8 w-8" />
        <div className="w-px h-6 bg-border mx-1" />
        <Skeleton className="h-8 w-8" />
        <Skeleton className="h-8 w-8" />
        <Skeleton className="h-8 w-8" />
      </div>
    </div>
  )
}