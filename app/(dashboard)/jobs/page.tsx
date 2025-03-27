'use client'

import { Container } from '@/components/container'
import { columns } from '@/components/jobs/columns'
import { DataTable } from '@/components/jobs/data-table'
import { Button } from '@/components/ui/button'
import { jobTemplates } from '@/data/job-templates'
import { JobPost, jobs } from '@/data/jobs-posts'
import { Row } from '@tanstack/react-table'

export default function Jobs() {
  const hasJobs = jobs.length > 0

  const handleRowClick = (row: Row<JobPost>) => {
    console.log('Clicked job:', row.original)
    // router.push(`/jobs/${row.original.id}`);
  }

  const handleCreateNewJob = () => {
    console.log('Navigating to create new job...')
    // router.push('/jobs/create');
  }

  return (
    <Container className='w-full'>
      <div className='py-6'>
        <Button>Test</Button>
        <div
          className={hasJobs ? 'bg-secondary/20 rounded-lg py-4 border' : ''}>
          <DataTable
            columns={columns}
            data={jobs}
            filterField='title'
            filterPlaceholder='Filter by job title...'
            onRowClick={handleRowClick}
            onCreateNew={handleCreateNewJob}
            templates={jobTemplates}
          />
        </div>
      </div>
    </Container>
  )
}
