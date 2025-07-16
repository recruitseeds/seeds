'use client'

import { Button } from '@/components/ui/button'
import { useJobFilterParams } from '@/hooks/use-job-filter-params'
import { useJobParams } from '@/hooks/use-job-params'

export function EmptyState() {
  const { setParams } = useJobParams()

  return (
    <div className='flex items-center justify-center h-[350px]'>
      <div className='flex flex-col items-center -mt-20'>
        <div className='text-center mb-6 space-y-2'>
          <h2 className='font-medium text-lg'>No job postings</h2>
          <p className='text-[#606060] text-sm'>
            You haven't created any job postings yet. <br />
            Go ahead and create your first one.
          </p>
        </div>
        <Button
          variant='outline'
          onClick={() =>
            setParams({
              create: true,
            })
          }>
          Create job posting
        </Button>
      </div>
    </div>
  )
}

export function NoResults() {
  const { setFilter } = useJobFilterParams()

  return (
    <div className='flex items-center justify-center h-[350px]'>
      <div className='flex flex-col items-center -mt-20'>
        <div className='text-center mb-6 space-y-2'>
          <h2 className='font-medium text-lg'>No results</h2>
          <p className='text-[#606060] text-sm'>Try another search, or adjusting the filters</p>
        </div>
        <Button variant='outline' onClick={() => setFilter(null)}>
          Clear filters
        </Button>
      </div>
    </div>
  )
}
