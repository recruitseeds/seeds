'use client'

import { Container } from '@/components/container'
import { useInterviewColumns } from '@/components/home/columns'
import { DataTable } from '@/components/jobs/data-table'
import { Button } from '@/components/ui/button'
import { interviews } from '@/data/interview-data'
import { CalendarPlus } from 'lucide-react'

export default function InterviewsPage() {
  const { columns, dialogComponent, handleRowClick } = useInterviewColumns()

  return (
    <Container>
      <div className='py-6'>
        <div className='flex flex-col sm:flex-row justify-between gap-4 sm:items-center mb-6'>
          <div>
            <h1 className='text-2xl font-bold'>Upcoming Interviews</h1>
            <p className='text-muted-foreground mt-1'>
              Manage and view all your scheduled interviews
            </p>
          </div>
          <Button className='flex items-center gap-2 sm:self-start'>
            <CalendarPlus className='h-4 w-4' />
            <span>Schedule Interview</span>
          </Button>
        </div>

        <DataTable
          columns={columns}
          data={interviews}
          filterField='candidate'
          filterPlaceholder='Search candidates...'
          onRowClick={handleRowClick}
        />

        {dialogComponent}
      </div>
    </Container>
  )
}
