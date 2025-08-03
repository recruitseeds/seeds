export function JobCardSkeleton() {
  return (
    <div className='bg-card border border-border rounded-lg p-6 animate-pulse'>
      <div className='flex items-start justify-between'>
        <div className='flex items-start space-x-4 flex-1'>
          {/* Logo skeleton */}
          <div className='w-12 h-12 bg-muted rounded-lg' />

          <div className='flex-1 min-w-0'>
            {/* Title skeleton */}
            <div className='h-6 bg-muted rounded w-2/3 mb-2' />
            {/* Company skeleton */}
            <div className='h-4 bg-muted rounded w-1/3 mb-3' />

            {/* Meta info skeleton */}
            <div className='flex items-center space-x-4'>
              <div className='h-4 bg-muted rounded w-24' />
              <div className='h-4 bg-muted rounded w-20' />
              <div className='h-4 bg-muted rounded w-28' />
            </div>

            {/* Tags skeleton */}
            <div className='flex flex-wrap gap-2 mt-3'>
              <div className='h-6 bg-muted rounded-full w-16' />
              <div className='h-6 bg-muted rounded-full w-20' />
              <div className='h-6 bg-muted rounded-full w-24' />
            </div>
          </div>
        </div>

        {/* Action buttons skeleton */}
        <div className='flex items-center space-x-2 ml-4'>
          <div className='w-8 h-8 bg-muted rounded-lg' />
          <div className='w-16 h-8 bg-muted rounded-lg' />
        </div>
      </div>
    </div>
  )
}