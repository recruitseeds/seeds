'use client'

import { Loader2 } from 'lucide-react'
import { forwardRef } from 'react'

interface LoadMoreProps {
  hasNextPage?: boolean
}

export const LoadMore = forwardRef<HTMLDivElement, LoadMoreProps>(({ hasNextPage }, ref) => {
  if (!hasNextPage) return null

  return (
    <div ref={ref} className='flex justify-center py-4'>
      <div className='flex items-center gap-2 text-muted-foreground'>
        <Loader2 className='h-4 w-4 animate-spin' />
        <span className='text-sm'>Loading more...</span>
      </div>
    </div>
  )
})

LoadMore.displayName = 'LoadMore'
