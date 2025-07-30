'use client'

import { Container } from '@/components/container'
import { Input } from '@seeds/ui/input'
import { Label } from '@seeds/ui/label'
import { HiringManagerTable } from './hiring-manger-table'

export default function Page() {
  return (
    <Container>
      <Label>Job board url</Label>
      <Input type='text' placeholder='localhost:3000/jobs' />
      <HiringManagerTable />
    </Container>
  )
}
