export function JobCardSkeleton() {
  return (
    <div className='p-6 animate-pulse'>
      <div className='flex gap-4'>
        {/* Logo skeleton */}
        <div className='w-12 h-12 bg-muted rounded-lg flex-shrink-0' />

        <div className='flex-1 min-w-0'>
          {/* Title skeleton */}
          <div className='h-5 bg-muted rounded w-2/3 mb-2' />
          {/* Company skeleton */}
          <div className='h-4 bg-muted rounded w-1/4 mb-3' />

          {/* Meta info skeleton */}
          <div className='flex items-center gap-4 mb-3'>
            <div className='h-4 bg-muted rounded w-24' />
            <div className='h-4 bg-muted rounded w-20' />
            <div className='h-4 bg-muted rounded w-28' />
          </div>

          {/* Tags skeleton */}
          <div className='flex flex-wrap gap-2'>
            <div className='h-6 bg-muted rounded-full w-16' />
            <div className='h-6 bg-muted rounded-full w-20' />
            <div className='h-6 bg-muted rounded-full w-24' />
          </div>
        </div>

        {/* Action button skeleton */}
        <div className='flex items-center gap-2'>
          <div className='w-8 h-8 bg-muted rounded-lg' />
          <div className='w-16 h-8 bg-muted rounded-lg' />
        </div>
      </div>
    </div>
  )
}

export function JobListSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className='border border-border rounded-lg overflow-hidden'>
      {Array.from({ length: count }).map((_, index) => (
        <div key={index}>
          <JobCardSkeleton />
          {index < count - 1 && <div className='border-b border-border' />}
        </div>
      ))}
    </div>
  )
}
