import { Button } from '@/components/ui/button'
import { Job } from '@/data/data'
import Link from 'next/link'

export function JobCard({ job }: { job: Job }) {
  return (
    <li className="flex items-center justify-between rounded-lg border bg-background p-4">
      <div>
        <h3 className="text-lg font-semibold">
          {job.title}{' '}
          <span className="text-muted-foreground">
            {job.active ? '' : 'Inactive'}
          </span>
        </h3>
        <p className="text-sm text-muted-foreground">{job.location}</p>
      </div>
      <Button variant="outline" size="sm" asChild>
        <Link href={`/dashboard/jobs/${job.id}`}>Read more</Link>
      </Button>
    </li>
  )
}
