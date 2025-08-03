'use client'

import { useState } from 'react'
import { JobCard } from './job-card'
import { JobFilters } from './job-filters'
import { Filter, ChevronLeft, ChevronRight } from 'lucide-react'

// Mock job data
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
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [sortBy, setSortBy] = useState('relevance')
  const [currentPage, setCurrentPage] = useState(1)

  return (
    <section className='bg-muted/20 py-16'>
      <div className='container mx-auto px-4'>
        <div className='mb-8 flex items-center justify-between'>
          <div>
            <h2 className='text-2xl font-bold'>Latest Opportunities</h2>
            <p className='text-muted-foreground'>{mockJobs.length} jobs found</p>
          </div>

          <div className='flex items-center gap-4'>
            <button
              onClick={() => setFiltersOpen(!filtersOpen)}
              className='lg:hidden flex items-center px-4 py-2 border border-border rounded-lg hover:bg-muted transition-colors'>
              <Filter className='mr-2 h-4 w-4' />
              Filters
            </button>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className='px-4 py-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-brand'>
              <option value='relevance'>Relevance</option>
              <option value='date'>Date Posted</option>
              <option value='salary'>Salary</option>
            </select>
          </div>
        </div>

        <div className='grid grid-cols-1 lg:grid-cols-4 gap-8'>
          {/* Filters Sidebar */}
          <div className={`lg:block ${filtersOpen ? 'block' : 'hidden'}`}>
            <JobFilters />
          </div>

          {/* Job Listings */}
          <div className='lg:col-span-3'>
            <div className='space-y-4'>
              {mockJobs.map((job) => (
                <JobCard key={job.id} job={job} onAuthRequired={onAuthRequired} />
              ))}
            </div>

            {/* Pagination */}
            <div className='mt-8 flex justify-center'>
              <div className='flex items-center space-x-2'>
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(currentPage - 1)}
                  className='px-3 py-2 border border-border rounded-lg hover:bg-muted transition-colors disabled:opacity-50 disabled:cursor-not-allowed'>
                  <ChevronLeft className='h-4 w-4' />
                </button>
                
                {[1, 2, 3].map((page) => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`px-4 py-2 border rounded-lg transition-colors ${
                      currentPage === page
                        ? 'bg-brand text-brand-foreground border-brand'
                        : 'border-border hover:bg-muted'
                    }`}>
                    {page}
                  </button>
                ))}
                
                <button
                  onClick={() => setCurrentPage(currentPage + 1)}
                  className='px-3 py-2 border border-border rounded-lg hover:bg-muted transition-colors'>
                  <ChevronRight className='h-4 w-4' />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}