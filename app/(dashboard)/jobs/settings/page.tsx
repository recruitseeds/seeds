'use client'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { HiringManagerTable } from './hiring-manger-table'

export default function Page() {
  return (
    <div>
      <div className='mx-4 mt-10'>
        <Label>Job board url</Label>
        <Input type='text' placeholder='localhost:3000/jobs' />
        <HiringManagerTable />
      </div>
    </div>
  )
}
