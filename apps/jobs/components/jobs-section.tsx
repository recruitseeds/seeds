'use client'

import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@seeds/ui/pagination'
import { useState } from 'react'
import { JobCard } from './job-card'
import { JobFilters } from './job-filters'

const mockJobs = [
  {
    id: '1',
    title: 'Senior Frontend Developer',
    company: 'TechCorp',
    location: 'San Francisco, CA',
    type: 'Full-time',
    salary: '$120k - $160k',
    remote: 'Hybrid',
    posted: '2 days ago',
    tags: ['React', 'TypeScript', 'Remote OK'],
  },
  {
    id: '2',
    title: 'Product Manager',
    company: 'StartupXYZ',
    location: 'New York, NY',
    type: 'Full-time',
    salary: '$130k - $180k',
    remote: 'Remote',
    posted: '1 day ago',
    tags: ['Strategy', 'Analytics', 'Growth'],
  },
  {
    id: '3',
    title: 'Data Scientist',
    company: 'DataDriven',
    location: 'Austin, TX',
    type: 'Full-time',
    salary: '$110k - $150k',
    remote: 'On-site',
    posted: '3 days ago',
    tags: ['Python', 'ML', 'SQL'],
  },
  {
    id: '4',
    title: 'UX Designer',
    company: 'InnovateCo',
    location: 'Seattle, WA',
    type: 'Contract',
    salary: '$80k - $120k',
    remote: 'Hybrid',
    posted: '1 week ago',
    tags: ['Figma', 'User Research', 'Prototyping'],
  },
]

interface JobsSectionProps {
  onAuthRequired?: () => void
}

export function JobsSection({ onAuthRequired }: JobsSectionProps) {
  const [currentPage, setCurrentPage] = useState(1)

  return (
    <section className='pb-8'>
      <div className='container mx-auto px-4'>
        <div className='mb-8'>
          <h2 className='text-3xl font-bold mb-2'>Latest Opportunities</h2>
          <p className='text-muted-foreground'>{mockJobs.length} jobs found</p>
        </div>

        <div className='flex gap-8'>
          <aside className='w-64 flex-shrink-0'>
            <JobFilters />
          </aside>

          <div className='flex-1'>
            <div className='border rounded-lg overflow-hidden'>
              {mockJobs.map((job, index) => (
                <div key={job.id}>
                  <JobCard job={job} onAuthRequired={onAuthRequired} />
                  {index < mockJobs.length - 1 && <div className='border-b border-border' />}
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
                        if (currentPage > 1) setCurrentPage(currentPage - 1)
                      }}
                      className={currentPage === 1 ? 'pointer-events-none opacity-50' : ''}
                    />
                  </PaginationItem>

                  {[1, 2, 3].map((page) => (
                    <PaginationItem key={page}>
                      <PaginationLink
                        href='#'
                        onClick={(e) => {
                          e.preventDefault()
                          setCurrentPage(page)
                        }}
                        isActive={currentPage === page}>
                        {page}
                      </PaginationLink>
                    </PaginationItem>
                  ))}

                  <PaginationItem>
                    <PaginationNext
                      href='#'
                      onClick={(e) => {
                        e.preventDefault()
                        setCurrentPage(currentPage + 1)
                      }}
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
