'use client'

import { Container } from '@/components/container'
import { columns } from '@/components/jobs/columns'
import { DataTable } from '@/components/jobs/data-table'
import { payments as data } from '@/data/jobs-posts'

export default function Jobs() {
  return (
    <Container>
      <div className='py-6'>
        <h1 className='text-2xl font-bold mb-4'>Job Postings</h1>
        <DataTable
          columns={columns}
          data={data}
          filterField='email'
          filterPlaceholder='Filter by email...'
        />
      </div>
    </Container>
  )
}
