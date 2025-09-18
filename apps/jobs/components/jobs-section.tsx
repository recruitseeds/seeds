'use client'

import { Button } from '@seeds/ui/button'
import { Checkbox } from '@seeds/ui/checkbox'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@seeds/ui/collapsible'
import { Input } from '@seeds/ui/input'
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@seeds/ui/pagination'
import { ChevronDown, Search } from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback, useState } from 'react'
import { formatSalary, getTimeAgo, type JobPosting } from '../lib/api'
import { useJobSearch } from '../lib/queries'
import { JobCard } from './job-card'

const jobTypes = ['Full-time', 'Part-time', 'Contract', 'Internship']
const experienceLevels = ['Entry Level', 'Junior', 'Mid-Level', 'Senior', 'Lead']
const remoteOptions = ['Remote', 'Hybrid', 'On-site']
const departments = ['Engineering', 'Product', 'Design', 'Marketing', 'Sales', 'Operations']

function JobFilters({
  selectedTypes,
  setSelectedTypes,
  selectedLevels,
  setSelectedLevels,
  selectedRemote,
  setSelectedRemote,
  selectedDepartments,
  setSelectedDepartments,
  clearAll,
  hasFilters,
}: {
  selectedTypes: string[]
  setSelectedTypes: (types: string[]) => void
  selectedLevels: string[]
  setSelectedLevels: (levels: string[]) => void
  selectedRemote: string[]
  setSelectedRemote: (remote: string[]) => void
  selectedDepartments: string[]
  setSelectedDepartments: (departments: string[]) => void
  clearAll: () => void
  hasFilters: boolean
}) {
  const [openSections, setOpenSections] = useState({
    location: false,
    department: false,
    type: false,
    experience: false,
  })

  const toggleFilter = (filter: string, category: string[], setCategory: (val: string[]) => void) => {
    if (category.includes(filter)) {
      setCategory(category.filter((f) => f !== filter))
    } else {
      setCategory([...category, filter])
    }
  }

  return (
    <div className='space-y-1'>
      {hasFilters && (
        <div className='mb-4'>
          <Button
            onClick={clearAll}
            variant='outline'
            size='sm'
            className='text-xs text-muted-foreground hover:text-foreground'>
            Clear all filters
          </Button>
        </div>
      )}

      <Collapsible
        open={openSections.location}
        onOpenChange={(open) => setOpenSections((prev) => ({ ...prev, location: open }))}>
        <CollapsibleTrigger className='flex items-center justify-between w-full py-3 text-sm font-medium hover:text-foreground transition-colors group'>
          <span>Location</span>
          <ChevronDown className={`h-4 w-4 transition-transform ${openSections.location ? 'rotate-180' : ''}`} />
        </CollapsibleTrigger>
        <CollapsibleContent className='pb-4'>
          <div className='space-y-2 pt-2'>
            {remoteOptions.map((option) => (
              <label key={option} className='flex items-center cursor-pointer hover:text-foreground transition-colors'>
                <Checkbox
                  checked={selectedRemote.includes(option)}
                  onCheckedChange={() => toggleFilter(option, selectedRemote, setSelectedRemote)}
                  className='mr-3'
                />
                <span className='text-sm'>{option}</span>
              </label>
            ))}
          </div>
        </CollapsibleContent>
      </Collapsible>

      <div className='border-t border-border' />

      <Collapsible
        open={openSections.department}
        onOpenChange={(open) => setOpenSections((prev) => ({ ...prev, department: open }))}>
        <CollapsibleTrigger className='flex items-center justify-between w-full py-3 text-sm font-medium hover:text-foreground transition-colors group'>
          <span>Department</span>
          <ChevronDown className={`h-4 w-4 transition-transform ${openSections.department ? 'rotate-180' : ''}`} />
        </CollapsibleTrigger>
        <CollapsibleContent className='pb-4'>
          <div className='space-y-2 pt-2'>
            {departments.map((dept) => (
              <label key={dept} className='flex items-center cursor-pointer hover:text-foreground transition-colors'>
                <Checkbox
                  checked={selectedDepartments.includes(dept)}
                  onCheckedChange={() => toggleFilter(dept, selectedDepartments, setSelectedDepartments)}
                  className='mr-3'
                />
                <span className='text-sm'>{dept}</span>
              </label>
            ))}
          </div>
        </CollapsibleContent>
      </Collapsible>

      <div className='border-t border-border' />

      <Collapsible
        open={openSections.type}
        onOpenChange={(open) => setOpenSections((prev) => ({ ...prev, type: open }))}>
        <CollapsibleTrigger className='flex items-center justify-between w-full py-3 text-sm font-medium hover:text-foreground transition-colors group'>
          <span>Job Type</span>
          <ChevronDown className={`h-4 w-4 transition-transform ${openSections.type ? 'rotate-180' : ''}`} />
        </CollapsibleTrigger>
        <CollapsibleContent className='pb-4'>
          <div className='space-y-2 pt-2'>
            {jobTypes.map((type) => (
              <label key={type} className='flex items-center cursor-pointer hover:text-foreground transition-colors'>
                <Checkbox
                  checked={selectedTypes.includes(type)}
                  onCheckedChange={() => toggleFilter(type, selectedTypes, setSelectedTypes)}
                  className='mr-3'
                />
                <span className='text-sm'>{type}</span>
              </label>
            ))}
          </div>
        </CollapsibleContent>
      </Collapsible>

      <div className='border-t border-border' />

      <Collapsible
        open={openSections.experience}
        onOpenChange={(open) => setOpenSections((prev) => ({ ...prev, experience: open }))}>
        <CollapsibleTrigger className='flex items-center justify-between w-full py-3 text-sm font-medium hover:text-foreground transition-colors group'>
          <span>Experience Level</span>
          <ChevronDown className={`h-4 w-4 transition-transform ${openSections.experience ? 'rotate-180' : ''}`} />
        </CollapsibleTrigger>
        <CollapsibleContent className='pb-4'>
          <div className='space-y-2 pt-2'>
            {experienceLevels.map((level) => (
              <label key={level} className='flex items-center cursor-pointer hover:text-foreground transition-colors'>
                <Checkbox
                  checked={selectedLevels.includes(level)}
                  onCheckedChange={() => toggleFilter(level, selectedLevels, setSelectedLevels)}
                  className='mr-3'
                />
                <span className='text-sm'>{level}</span>
              </label>
            ))}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  )
}

interface JobsSectionProps {
  onAuthRequired?: () => void
  initialJobs?: JobPosting[]
  initialPagination?: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
  }
  searchQuery?: string
  location?: string
  initialFilters?: Record<string, any>
  showSearch?: boolean
  showFilters?: boolean
  showTitle?: boolean
  title?: string
  description?: string
}

export function JobsSection({
  onAuthRequired,
  initialJobs = [],
  initialPagination,
  searchQuery = '',
  location = '',
  initialFilters = {},
  showSearch = true,
  showFilters = true,
  showTitle = true,
  title,
  description,
}: JobsSectionProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const currentQuery = searchParams.get('q') || searchQuery
  const currentLocation = searchParams.get('location') || location
  const currentPage = parseInt(searchParams.get('page') || '1', 10)

  const [selectedTypes, setSelectedTypes] = useState<string[]>(
    initialFilters.jobType ? initialFilters.jobType.split(',') : []
  )
  const [selectedLevels, setSelectedLevels] = useState<string[]>(
    initialFilters.experience ? initialFilters.experience.split(',') : []
  )
  const [selectedRemote, setSelectedRemote] = useState<string[]>(
    initialFilters.remote ? initialFilters.remote.split(',') : []
  )
  const [selectedDepartments, setSelectedDepartments] = useState<string[]>(
    initialFilters.department ? initialFilters.department.split(',') : []
  )

  const [searchInput, setSearchInput] = useState(currentQuery)
  const [locationInput, setLocationInput] = useState(currentLocation)

  const currentFilters = {
    query: currentQuery,
    location: currentLocation,
    jobType: selectedTypes.length ? selectedTypes.join(',') : undefined,
    remote: selectedRemote.length ? selectedRemote.join(',') : undefined,
    department: selectedDepartments.length ? selectedDepartments.join(',') : undefined,
    experience: selectedLevels.length ? selectedLevels.join(',') : undefined,
  }

  const { data, error, isLoading, isFetching } = useJobSearch(currentPage, 20, currentFilters, {
    initialData:
      initialJobs.length > 0
        ? {
            success: true,
            data: initialJobs,
            pagination: initialPagination || {
              page: 1,
              limit: 20,
              total: initialJobs.length,
              totalPages: Math.ceil(initialJobs.length / 20),
              hasNext: false,
              hasPrev: false,
            },
          }
        : undefined,
  })

  const updateURL = useCallback(
    (params: Record<string, string | number | undefined>) => {
      const newParams = new URLSearchParams(searchParams.toString())

      Object.entries(params).forEach(([key, value]) => {
        if (value && value !== '') {
          newParams.set(key, value.toString())
        } else {
          newParams.delete(key)
        }
      })

      if (!params.page) {
        newParams.delete('page')
      }

      router.push(`/browse?${newParams.toString()}`, { scroll: false })
    },
    [router, searchParams]
  )

  const handleSearch = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault()
      updateURL({
        q: searchInput,
        location: locationInput,
      })
    },
    [searchInput, locationInput, updateURL]
  )

  const handleApplyFilters = useCallback(() => {
    updateURL({
      q: currentQuery,
      location: currentLocation,
      job_type: selectedTypes.length ? selectedTypes.join(',') : undefined,
      remote: selectedRemote.length ? selectedRemote.join(',') : undefined,
      department: selectedDepartments.length ? selectedDepartments.join(',') : undefined,
      experience: selectedLevels.length ? selectedLevels.join(',') : undefined,
      page: 1,
    })
  }, [currentQuery, currentLocation, selectedTypes, selectedLevels, selectedRemote, selectedDepartments, updateURL])

  const handlePageChange = useCallback(
    (page: number) => {
      if (showSearch || showFilters) {
        updateURL({ page: page === 1 ? undefined : page })
      }
    },
    [updateURL, showSearch, showFilters]
  )

  const clearAll = useCallback(() => {
    setSelectedTypes([])
    setSelectedLevels([])
    setSelectedRemote([])
    setSelectedDepartments([])
  }, [])

  const hasFilters =
    selectedTypes.length > 0 || selectedLevels.length > 0 || selectedRemote.length > 0 || selectedDepartments.length > 0

  const filterProps = {
    selectedTypes,
    setSelectedTypes,
    selectedLevels,
    setSelectedLevels,
    selectedRemote,
    setSelectedRemote,
    selectedDepartments,
    setSelectedDepartments,
    clearAll,
    hasFilters,
  }

  const formatJobType = (jobType: string): 'Full-time' | 'Part-time' | 'Contract' | 'Internship' => {
    const formatted = jobType
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ')

    // Ensure we return one of the valid union types
    switch (formatted) {
      case 'Full Time':
      case 'Full-time':
        return 'Full-time'
      case 'Part Time':
      case 'Part-time':
        return 'Part-time'
      case 'Contract':
        return 'Contract'
      case 'Internship':
        return 'Internship'
      default:
        return 'Full-time' // fallback
    }
  }

  const formatText = (text: string): string => {
    return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase()
  }

  const transformJobForCard = (job: JobPosting) => {
    const formattedType = formatJobType(job.job_type)
    const formattedDepartment = job.department ? formatText(job.department) : null
    const formattedExperience = job.experience_level ? formatText(job.experience_level) : null

    const uniqueTags = Array.from(
      new Set([formattedType, formattedDepartment, formattedExperience].filter(Boolean))
    ) as string[]

    return {
      id: job.id,
      title: job.title,
      company: job.organization.name,
      location: 'Remote/Hybrid',
      type: formattedType,
      salary: formatSalary(job.salary_min, job.salary_max, job.salary_type),
      remote: 'Hybrid' as 'Remote' | 'Hybrid' | 'On-site',
      posted: job.published_at ? getTimeAgo(job.published_at) : 'recently',
      tags: uniqueTags,
    }
  }

  const jobs = data?.data || []
  const pagination = data?.pagination ||
    initialPagination || {
      page: 1,
      limit: 20,
      total: 0,
      totalPages: 0,
      hasNext: false,
      hasPrev: false,
    }

  if (isLoading && !data) {
    return (
      <section className='pb-8'>
        <div className='container mx-auto px-4'>
          <div className='mb-8'>
            <h2 className='text-2xl sm:text-3xl font-bold mb-2'>{title || 'Loading...'}</h2>
            <p className='text-muted-foreground'>Loading jobs...</p>
          </div>
          <div className='animate-pulse space-y-4'>
            {[...Array(5)].map((_, i) => (
              <div key={i} className='h-32 bg-muted rounded-lg' />
            ))}
          </div>
        </div>
      </section>
    )
  }

  if (error) {
    return (
      <section className='pb-8'>
        <div className='container mx-auto px-4'>
          <div className='mb-8'>
            <h2 className='text-2xl sm:text-3xl font-bold mb-2'>{title || 'Jobs'}</h2>
            <p className='text-muted-foreground text-red-600'>
              {error instanceof Error ? error.message : 'Failed to load jobs'}
            </p>
          </div>
          <Button onClick={() => window.location.reload()} variant='outline'>
            Retry
          </Button>
        </div>
      </section>
    )
  }

  const getTitle = () => {
    if (title) return title
    if (currentQuery) return `Search Results for "${currentQuery}"`
    return 'Browse All Jobs'
  }

  const getDescription = () => {
    if (description) return description
    return `${pagination.total} ${pagination.total === 1 ? 'job' : 'jobs'} found${isFetching ? ' • Updating...' : ''}`
  }

  return (
    <section className='pb-8'>
      <div className='container mx-auto px-4'>
        {showSearch && (
          <div className='mb-8'>
            <form onSubmit={handleSearch} className='flex gap-4'>
              <div className='flex-1'>
                <Input
                  type='text'
                  placeholder='Search jobs by title, skills, or company...'
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className='w-full'
                />
              </div>
              <div className='flex-1'>
                <Input
                  type='text'
                  placeholder='Location'
                  value={locationInput}
                  onChange={(e) => setLocationInput(e.target.value)}
                  className='w-full'
                />
              </div>
              <Button type='submit' className='flex items-center gap-2'>
                <Search className='h-4 w-4' />
                Search
              </Button>
            </form>
          </div>
        )}

        {showTitle !== false && (
          <div className='mb-8'>
            <h2 className='text-2xl sm:text-3xl font-bold mb-2'>{getTitle()}</h2>
            <p className='text-muted-foreground'>{getDescription()}</p>
          </div>
        )}

        {showFilters && (
          <div className='job-filters-mobile-toggle w-full mb-6'>
            <JobFilters {...filterProps} />
            {hasFilters && (
              <Button onClick={handleApplyFilters} className='mt-4 w-full' variant='default'>
                Apply Filters
              </Button>
            )}
          </div>
        )}

        <div className={showFilters ? 'lg:flex lg:gap-8' : ''}>
          {showFilters && (
            <aside className='job-filters-sidebar w-64 flex-shrink-0'>
              <JobFilters {...filterProps} />
              {hasFilters && (
                <Button onClick={handleApplyFilters} className='mt-4 w-full' variant='default'>
                  Apply Filters
                </Button>
              )}
            </aside>
          )}

          <div className='flex-1 min-w-0'>
            <div className='border rounded-lg overflow-hidden'>
              {jobs.map((job: JobPosting, index: number) => (
                <div key={job.id}>
                  <JobCard job={transformJobForCard(job)} onAuthRequired={onAuthRequired} />
                  {index < jobs.length - 1 && <div className='border-b border-border' />}
                </div>
              ))}
            </div>

            {pagination.total > 10 && (showSearch || showFilters) && (
              <div className='mt-8'>
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        href='#'
                        onClick={(e) => {
                          e.preventDefault()
                          if (pagination.hasPrev) handlePageChange(currentPage - 1)
                        }}
                        className={!pagination.hasPrev ? 'pointer-events-none opacity-50' : ''}
                      />
                    </PaginationItem>

                    {Array.from({ length: pagination.totalPages }, (_, i) => i + 1)
                      .filter((page) => {
                        return (
                          page === 1 ||
                          page === pagination.totalPages ||
                          (page >= currentPage - 1 && page <= currentPage + 1)
                        )
                      })
                      .map((page, index, array) => (
                        <>
                          {index > 0 && array[index - 1] !== page - 1 && (
                            <PaginationItem key={`ellipsis-${page}`}>
                              <span className='px-3'>...</span>
                            </PaginationItem>
                          )}
                          <PaginationItem key={page}>
                            <PaginationLink
                              href='#'
                              onClick={(e) => {
                                e.preventDefault()
                                handlePageChange(page)
                              }}
                              isActive={page === currentPage}>
                              {page}
                            </PaginationLink>
                          </PaginationItem>
                        </>
                      ))}

                    <PaginationItem>
                      <PaginationNext
                        href='#'
                        onClick={(e) => {
                          e.preventDefault()
                          if (pagination.hasNext) handlePageChange(currentPage + 1)
                        }}
                        className={!pagination.hasNext ? 'pointer-events-none opacity-50' : ''}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            )}

            {!showSearch && !showFilters && jobs.length > 10 && (
              <div className='mt-8 text-center'>
                <Button onClick={() => router.push('/browse')} variant='outline' size='lg'>
                  View All Jobs
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
