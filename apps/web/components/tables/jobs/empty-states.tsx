'use client'

import { Button } from '../../ui/button'
import { Card, CardContent } from '../../ui/card'
import { Briefcase, Plus, Search, X } from 'lucide-react'
import Link from 'next/link'

export function EmptyState() {
  return (
    <Card className='border-dashed'>
      <CardContent className='flex flex-col items-center justify-center p-12 text-center'>
        <div className='mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-muted'>
          <Briefcase className='h-6 w-6 text-muted-foreground' />
        </div>
        <h2 className='mt-6 text-xl font-semibold'>No job postings yet</h2>
        <p className='mt-2 text-sm text-muted-foreground max-w-sm'>
          Create your first job posting to start attracting candidates to your organization.
        </p>
        <div className='mt-6'>
          <Button asChild>
            <Link href='/jobs/create'>
              <Plus className='mr-2 h-4 w-4' />
              Create Job Posting
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

interface NoResultsProps {
  search?: string
  onClearFilters: () => void
}

export function NoResults({ search, onClearFilters }: NoResultsProps) {
  return (
    <Card className='border-dashed'>
      <CardContent className='flex flex-col items-center justify-center p-12 text-center'>
        <div className='mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-muted'>
          <Search className='h-6 w-6 text-muted-foreground' />
        </div>
        <h2 className='mt-6 text-xl font-semibold'>No job postings found</h2>
        <p className='mt-2 text-sm text-muted-foreground max-w-sm'>
          {search
            ? `No job postings match "${search}". Try adjusting your search terms or filters.`
            : 'No job postings match your current filters. Try adjusting your search criteria.'}
        </p>
        <div className='mt-6 flex gap-2'>
          <Button variant='outline' onClick={onClearFilters}>
            <X className='mr-2 h-4 w-4' />
            Clear Filters
          </Button>
          <Button asChild>
            <Link href='/jobs/create'>
              <Plus className='mr-2 h-4 w-4' />
              Create Job Posting
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
