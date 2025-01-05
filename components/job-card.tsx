import { Button } from '@/components/ui/button'
import { Job } from '@/data/data'
import Link from 'next/link'

export function JobCard({ job }: { job: Job }) {
  return (
    <li className='flex justify-between items-center p-4 border rounded-lg bg-background'>
      <div>
        <h3 className='text-lg font-semibold'>
          {job.title}{' '}
          <span className='text-muted-foreground'>
            {job.active ? '' : 'Inactive'}
          </span>
        </h3>
        <p className='text-sm text-muted-foreground'>{job.location}</p>
      </div>
      <Button variant='outline' asChild>
        <Link href={`/dashboard/jobs/${job.id}`}>Read more</Link>
      </Button>
    </li>
  )
}
