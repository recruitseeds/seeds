'use client'

import { HorizontalPagination } from '@/components/horizontal-pagination'
import { Button } from '@/components/ui/button'
import { TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useSortParams } from '@/hooks/use-sort-params'
import { cn } from '@/lib/utils'
import { ArrowDown, ArrowUp } from 'lucide-react'

interface Props {
  tableScroll?: {
    canScrollLeft: boolean
    canScrollRight: boolean
    isScrollable: boolean
    scrollLeft: () => void
    scrollRight: () => void
  }
}

export function JobTableHeader({ tableScroll }: Props) {
  const { params, setParams } = useSortParams()

  const [column, value] = params.sort || []

  const createSortQuery = (name: string) => {
    const [currentColumn, currentValue] = params.sort || []

    if (name === currentColumn) {
      if (currentValue === 'asc') {
        setParams({ sort: [name, 'desc'] })
      } else if (currentValue === 'desc') {
        setParams({ sort: null })
      } else {
        setParams({ sort: [name, 'asc'] })
      }
    } else {
      setParams({ sort: [name, 'asc'] })
    }
  }

  return (
    <TableHeader className='border-l-0 border-r-0'>
      <TableRow className='h-[45px]'>
        <TableHead className='w-[40px] min-w-[40px] md:sticky md:left-0 bg-background z-20 border-r border-border'>
          {/* Checkbox column */}
        </TableHead>

        <TableHead className='w-[280px] min-w-[280px] md:sticky md:left-[40px] bg-background z-20 border-r border-border before:absolute before:right-0 before:top-0 before:bottom-0 before:w-px before:bg-border after:absolute after:right-[-24px] after:top-0 after:bottom-0 after:w-6 after:bg-gradient-to-l after:from-transparent after:to-background after:z-[-1]'>
          <div className='flex items-center justify-between'>
            <Button
              className='p-0 hover:bg-transparent space-x-2'
              variant='ghost'
              onClick={() => createSortQuery('title')}>
              <span>Job Title</span>
              {'title' === column && value === 'asc' && <ArrowDown size={16} />}
              {'title' === column && value === 'desc' && <ArrowUp size={16} />}
            </Button>
            {tableScroll?.isScrollable && (
              <HorizontalPagination
                canScrollLeft={tableScroll.canScrollLeft}
                canScrollRight={tableScroll.canScrollRight}
                onScrollLeft={tableScroll.scrollLeft}
                onScrollRight={tableScroll.scrollRight}
                className='ml-auto hidden md:flex'
              />
            )}
          </div>
        </TableHead>

        <TableHead className='w-[140px]'>
          <Button
            className='p-0 hover:bg-transparent space-x-2'
            variant='ghost'
            onClick={() => createSortQuery('department')}>
            <span>Department</span>
            {'department' === column && value === 'asc' && <ArrowDown size={16} />}
            {'department' === column && value === 'desc' && <ArrowUp size={16} />}
          </Button>
        </TableHead>

        <TableHead className='w-[120px] min-w-[120px]'>
          <Button
            className='p-0 hover:bg-transparent space-x-2'
            variant='ghost'
            onClick={() => createSortQuery('job_type')}>
            <span>Type</span>
            {'job_type' === column && value === 'asc' && <ArrowDown size={16} />}
            {'job_type' === column && value === 'desc' && <ArrowUp size={16} />}
          </Button>
        </TableHead>

        <TableHead className='w-[140px] min-w-[140px]'>
          <Button
            className='p-0 hover:bg-transparent space-x-2'
            variant='ghost'
            onClick={() => createSortQuery('experience_level')}>
            <span>Experience</span>
            {'experience_level' === column && value === 'asc' && <ArrowDown size={16} />}
            {'experience_level' === column && value === 'desc' && <ArrowUp size={16} />}
          </Button>
        </TableHead>

        <TableHead className='w-[120px] min-w-[120px]'>
          <Button
            className='p-0 hover:bg-transparent space-x-2'
            variant='ghost'
            onClick={() => createSortQuery('status')}>
            <span>Status</span>
            {'status' === column && value === 'asc' && <ArrowDown size={16} />}
            {'status' === column && value === 'desc' && <ArrowUp size={16} />}
          </Button>
        </TableHead>

        <TableHead className='w-[180px] min-w-[180px]'>
          <span>Hiring Manager</span>
        </TableHead>

        <TableHead className='w-[140px] min-w-[140px]'>
          <span>Salary Range</span>
        </TableHead>

        <TableHead className='w-[120px] min-w-[120px]'>
          <Button
            className='p-0 hover:bg-transparent space-x-2'
            variant='ghost'
            onClick={() => createSortQuery('created_at')}>
            <span>Created</span>
            {'created_at' === column && value === 'asc' && <ArrowDown size={16} />}
            {'created_at' === column && value === 'desc' && <ArrowUp size={16} />}
          </Button>
        </TableHead>

        <TableHead
          className={cn(
            'w-[100px] md:sticky md:right-0 bg-background z-30',
            'before:absolute before:left-0 before:top-0 before:bottom-0 before:w-px before:bg-border',
            'after:absolute after:left-[-24px] after:top-0 after:bottom-0 after:w-6 after:bg-gradient-to-r after:from-transparent after:to-background after:z-[-1]'
          )}>
          Actions
        </TableHead>
      </TableRow>
    </TableHeader>
  )
}
