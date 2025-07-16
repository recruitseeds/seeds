'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useJobFilterParams } from '@/hooks/use-job-filter-params'
import { Filter, Search, X } from 'lucide-react'
import React, { useDeferredValue, useState } from 'react'

const jobStatusOptions = [
  { value: 'draft', label: 'Draft' },
  { value: 'published', label: 'Published' },
  { value: 'archived', label: 'Archived' },
  { value: 'closed', label: 'Closed' },
]

const jobTypeOptions = [
  { value: 'full_time', label: 'Full Time' },
  { value: 'part_time', label: 'Part Time' },
  { value: 'contract', label: 'Contract' },
  { value: 'internship', label: 'Internship' },
  { value: 'temporary', label: 'Temporary' },
]

const departmentOptions = [
  { value: 'Engineering', label: 'Engineering' },
  { value: 'Product', label: 'Product' },
  { value: 'Design', label: 'Design' },
  { value: 'Marketing', label: 'Marketing' },
  { value: 'Sales', label: 'Sales' },
  { value: 'Operations', label: 'Operations' },
  { value: 'Finance', label: 'Finance' },
  { value: 'HR', label: 'HR' },
]

export function JobFilterToolbar() {
  const { filter, hasFilters, setFilter, updateFilter } = useJobFilterParams()
  const [searchValue, setSearchValue] = useState(filter.q || '')
  const deferredSearch = useDeferredValue(searchValue)

  // Update the filter when the deferred search changes
  React.useEffect(() => {
    updateFilter('q', deferredSearch)
  }, [deferredSearch, updateFilter])

  const activeFiltersCount = Object.values(filter).filter(Boolean).length

  const clearFilter = (key: keyof typeof filter) => {
    updateFilter(key, null)
    if (key === 'q') {
      setSearchValue('')
    }
  }

  return (
    <div className='flex flex-col gap-4'>
      {/* Search and primary filters */}
      <div className='flex items-center gap-4'>
        <div className='relative flex-1 max-w-sm'>
          <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4' />
          <Input
            placeholder='Search job titles, departments...'
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            className='pl-10'
          />
        </div>

        <Select value={filter.status || ''} onValueChange={(value) => updateFilter('status', value || null)}>
          <SelectTrigger className='w-[140px]'>
            <SelectValue placeholder='Status' />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value=''>All Statuses</SelectItem>
            {jobStatusOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={filter.job_type || ''} onValueChange={(value) => updateFilter('job_type', value || null)}>
          <SelectTrigger className='w-[140px]'>
            <SelectValue placeholder='Job Type' />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value=''>All Types</SelectItem>
            {jobTypeOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant='outline' size='sm'>
              <Filter className='h-4 w-4 mr-2' />
              More Filters
              {activeFiltersCount > 0 && (
                <Badge variant='secondary' className='ml-2 h-5 w-5 rounded-full p-0 text-xs'>
                  {activeFiltersCount}
                </Badge>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align='end' className='w-[200px]'>
            <DropdownMenuLabel>Department</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {departmentOptions.map((option) => (
              <DropdownMenuCheckboxItem
                key={option.value}
                checked={filter.department === option.value}
                onCheckedChange={(checked) => updateFilter('department', checked ? option.value : null)}>
                {option.label}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {hasFilters && (
          <Button
            variant='outline'
            size='sm'
            onClick={() => {
              setFilter(null)
              setSearchValue('')
            }}>
            Clear All
          </Button>
        )}
      </div>

      {/* Active filter badges */}
      {hasFilters && (
        <div className='flex items-center gap-2 flex-wrap'>
          <span className='text-sm text-muted-foreground'>Active filters:</span>
          {filter.q && (
            <Badge variant='secondary' className='gap-1'>
              Search: "{filter.q}"
              <Button
                variant='ghost'
                size='sm'
                className='h-auto p-0 text-muted-foreground hover:text-foreground'
                onClick={() => clearFilter('q')}>
                <X className='h-3 w-3' />
              </Button>
            </Badge>
          )}
          {filter.status && (
            <Badge variant='secondary' className='gap-1'>
              Status: {jobStatusOptions.find((o) => o.value === filter.status)?.label}
              <Button
                variant='ghost'
                size='sm'
                className='h-auto p-0 text-muted-foreground hover:text-foreground'
                onClick={() => clearFilter('status')}>
                <X className='h-3 w-3' />
              </Button>
            </Badge>
          )}
          {filter.job_type && (
            <Badge variant='secondary' className='gap-1'>
              Type: {jobTypeOptions.find((o) => o.value === filter.job_type)?.label}
              <Button
                variant='ghost'
                size='sm'
                className='h-auto p-0 text-muted-foreground hover:text-foreground'
                onClick={() => clearFilter('job_type')}>
                <X className='h-3 w-3' />
              </Button>
            </Badge>
          )}
          {filter.department && (
            <Badge variant='secondary' className='gap-1'>
              Department: {filter.department}
              <Button
                variant='ghost'
                size='sm'
                className='h-auto p-0 text-muted-foreground hover:text-foreground'
                onClick={() => clearFilter('department')}>
                <X className='h-3 w-3' />
              </Button>
            </Badge>
          )}
        </div>
      )}
    </div>
  )
}
