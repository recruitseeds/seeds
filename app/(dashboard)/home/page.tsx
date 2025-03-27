'use client'

import { Container } from '@/components/container'
import { useInterviewColumns } from '@/components/home/columns'
import { HomeCards } from '@/components/home/home-cards'
import { DataTable } from '@/components/jobs/data-table'
import { interviews } from '@/data/interview-data'

export default function InterviewsPage() {
  const { columns, dialogComponent, handleRowClick } = useInterviewColumns()

  return (
    <Container className='w-full py-6 flex flex-col gap-12'>
      <HomeCards />
      <div>
        <div className='flex flex-col sm:flex-row justify-between gap-4 sm:items-center mb-6'>
          <div>
            <h1 className='text-2xl font-bold'>Upcoming Interviews</h1>
            <p className='text-muted-foreground mt-1'>
              Manage and view all your scheduled interviews
            </p>
          </div>
          {/* <Button className='flex items-center gap-2 sm:self-start'>
            <CalendarPlus className='h-4 w-4' />
            <span>Schedule Interview</span>
          </Button> */}
        </div>

        <div className='w-full relative'>
          <div className='overflow-x-auto pb-2'>
            <DataTable
              columns={columns}
              data={interviews}
              filterField='candidate'
              filterPlaceholder='Search candidates...'
              onRowClick={handleRowClick}
            />
          </div>
        </div>

        {dialogComponent}
      </div>
    </Container>
  )
}
