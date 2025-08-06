'use client'

import { Button } from '@seeds/ui/button'
import { Checkbox } from '@seeds/ui/checkbox'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@seeds/ui/collapsible'
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@seeds/ui/pagination'
import { ChevronDown } from 'lucide-react'
import { useState, useEffect } from 'react'
import { JobCard } from './job-card'
import { getAllJobs, formatSalary, getTimeAgo, type JobPosting } from '../lib/api'

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
  initialJobs: JobPosting[]
  initialPagination: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
  }
}

export function JobsSection({ onAuthRequired, initialJobs, initialPagination }: JobsSectionProps) {
  const [currentPage, setCurrentPage] = useState(initialPagination.page)
  const [selectedTypes, setSelectedTypes] = useState<string[]>([])
  const [selectedLevels, setSelectedLevels] = useState<string[]>([])
  const [selectedRemote, setSelectedRemote] = useState<string[]>([])
  const [selectedDepartments, setSelectedDepartments] = useState<string[]>([])
  const [jobs, setJobs] = useState<JobPosting[]>(initialJobs)
  const [loading, setLoading] = useState(false) // No initial loading since we have server-side data
  const [error, setError] = useState<string | null>(null)
  const [pagination, setPagination] = useState(initialPagination)

  // No useEffect needed! Data is fetched server-side and passed as props
  
  // Handle pagination - only fetch when user clicks pagination buttons
  const handlePageChange = async (newPage: number) => {
    if (newPage === currentPage) return
    
    try {
      setLoading(true)
      setError(null)
      const response = await getAllJobs(newPage, 20)
      setJobs(response.data)
      setPagination(response.pagination)
      setCurrentPage(newPage)
    } catch (err) {
      setError('Failed to load jobs. Please try again.')
      console.error('Error fetching jobs:', err)
    } finally {
      setLoading(false)
    }
  }

  const clearAll = () => {
    setSelectedTypes([])
    setSelectedLevels([])
    setSelectedRemote([])
    setSelectedDepartments([])
  }

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

  const transformJobForCard = (job: JobPosting) => ({
    id: job.id,
    title: job.title,
    company: job.organization.name,
    location: 'Remote/Hybrid',
    type: job.job_type,
    salary: formatSalary(job.salary_min, job.salary_max, job.salary_type),
    remote: 'Hybrid',
    posted: job.published_at ? getTimeAgo(job.published_at) : 'recently',
    tags: [job.job_type, job.department, job.experience_level].filter(Boolean) as string[],
  })

  if (loading) {
    return (
      <section className='pb-8'>
        <div className='container mx-auto px-4'>
          <div className='mb-8'>
            <h2 className='text-2xl sm:text-3xl font-bold mb-2'>Latest Opportunities</h2>
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
            <h2 className='text-2xl sm:text-3xl font-bold mb-2'>Latest Opportunities</h2>
            <p className='text-muted-foreground text-red-600'>{error}</p>
          </div>
          <Button
            onClick={() => {
              handlePageChange(1)
            }}
            variant='outline'>
            Retry
          </Button>
        </div>
      </section>
    )
  }

  return (
    <section className='pb-8'>
      <div className='container mx-auto px-4'>
        <div className='mb-8'>
          <h2 className='text-2xl sm:text-3xl font-bold mb-2'>Latest Opportunities</h2>
          <p className='text-muted-foreground'>{pagination.total} jobs found</p>
        </div>

        <div className='job-filters-mobile-toggle w-full mb-6'>
          <JobFilters {...filterProps} />
        </div>

        <div className='lg:flex lg:gap-8'>
          <aside className='job-filters-sidebar w-64 flex-shrink-0'>
            <JobFilters {...filterProps} />
          </aside>

          <div className='flex-1 min-w-0'>
            <div className='border rounded-lg overflow-hidden'>
              {jobs.map((job, index) => (
                <div key={job.id}>
                  <JobCard job={transformJobForCard(job)} onAuthRequired={onAuthRequired} />
                  {index < jobs.length - 1 && <div className='border-b border-border' />}
                </div>
              ))}
            </div>

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

                  {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                    let pageNum = i + 1
                    if (pagination.totalPages > 5 && currentPage > 3) {
                      pageNum = currentPage - 2 + i
                      if (pageNum > pagination.totalPages) {
                        pageNum = pagination.totalPages - 4 + i
                      }
                    }
                    return (
                      <PaginationItem key={pageNum}>
                        <PaginationLink
                          href='#'
                          onClick={(e) => {
                            e.preventDefault()
                            handlePageChange(pageNum)
                          }}
                          isActive={currentPage === pageNum}>
                          {pageNum}
                        </PaginationLink>
                      </PaginationItem>
                    )
                  })}

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
          </div>
        </div>
      </div>
    </section>
  )
}
