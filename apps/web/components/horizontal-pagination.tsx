'use client'

import { Button } from './ui/button'
import { cn } from './ui/lib/utils'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface HorizontalPaginationProps {
  canScrollLeft: boolean
  canScrollRight: boolean
  onScrollLeft: () => void
  onScrollRight: () => void
  className?: string
}

export function HorizontalPagination({
  canScrollLeft,
  canScrollRight,
  onScrollLeft,
  onScrollRight,
  className,
}: HorizontalPaginationProps) {
  return (
    <div className={cn('flex items-center gap-1', className)}>
      <Button variant='ghost' size='sm' onClick={onScrollLeft} disabled={!canScrollLeft} className='h-7 w-7 p-0'>
        <ChevronLeft className='h-4 w-4' />
      </Button>
      <Button variant='ghost' size='sm' onClick={onScrollRight} disabled={!canScrollRight} className='h-7 w-7 p-0'>
        <ChevronRight className='h-4 w-4' />
      </Button>
    </div>
  )
}
