import {
  CalendarIcon,
  ClipboardListIcon,
  ClockIcon,
  FileTextIcon,
  UsersIcon,
} from 'lucide-react'

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

import { Badge } from '@/components/ui/badge'

export function HomeCards() {
  const activities = [
    { type: 'Application Review', count: 12, icon: ClipboardListIcon },
    { type: 'Interviews to Schedule', count: 5, icon: CalendarIcon },
    { type: 'Overdue Follow-ups', count: 3, icon: ClockIcon },
    { type: 'Pending Offers', count: 2, icon: FileTextIcon },
    { type: 'Active Candidates', count: 24, icon: UsersIcon },
  ]

  const jobs = [
    {
      title: 'Software Engineer',
      applicants: 45,
      openPositions: 2,
      department: 'Engineering',
      location: 'Remote',
    },
    {
      title: 'Design Engineer',
      applicants: 32,
      openPositions: 1,
      department: 'Design',
      location: 'San Francisco, CA',
    },
    {
      title: 'Product Manager',
      applicants: 18,
      openPositions: 1,
      department: 'Product',
      location: 'Remote',
    },
    {
      title: 'Data Analyst',
      applicants: 27,
      openPositions: 3,
      department: 'Analytics',
      location: 'New York, NY',
    },
  ]

  const hasActivities = true
  const hasJobs = true

  return (
    <div className='grid grid-cols-1 gap-6 lg:grid-cols-2'>
      <Card className='@container/card rounded-md'>
        <CardHeader>
          <CardTitle className='text-lg font-semibold'>Activities</CardTitle>
          <CardDescription>
            Overview of your current recruitment activities
          </CardDescription>
        </CardHeader>
        <CardContent>
          {hasActivities ? (
            <div className='space-y-6'>
              {activities.map((activity, index) => (
                <div key={index} className='flex items-center justify-between'>
                  <div className='flex items-center gap-3'>
                    <div className='flex size-9 items-center justify-center rounded-full border'>
                      <activity.icon className='size-5 text-primary' />
                    </div>
                    <span>{activity.type}</span>
                  </div>
                  <Badge
                    variant='secondary'
                    className='bg-black/5 dark:bg-white/10 min-h-4.5 flex flex-none items-center justify-center rounded px-1.5 pb-px pt-0.5 uppercase text-[10px] leading-none font-semibold'>
                    {activity.count}
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <div className='flex flex-col items-center justify-center py-8 text-center'>
              <ClipboardListIcon className='mb-3 h-12 w-12 text-muted-foreground/50' />
              <h3 className='mb-1 text-lg font-medium'>
                No active recruitment tasks
              </h3>
              <p className='text-sm text-muted-foreground'>
                When you start reviewing applications or scheduling interviews,
                they&apos;ll appear here.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className='@container/card rounded-md'>
        <CardHeader className='flex flex-row items-center justify-between'>
          <div>
            <CardTitle className='text-lg font-semibold'>
              Open Positions
            </CardTitle>
            <CardDescription>Currently active job postings</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          {hasJobs ? (
            <div className='divide-y'>
              {jobs.map((job, index) => (
                <div key={index} className='flex flex-col p-4'>
                  <div className='flex items-center justify-between'>
                    <h3 className='font-medium'>{job.title}</h3>
                    <div className='bg-black/5 dark:bg-white/10 min-h-4.5 flex flex-none items-center justify-center rounded px-1.5 pb-px pt-0.5 uppercase text-[10px] leading-none font-semibold'>
                      {job.openPositions}{' '}
                      {job.openPositions === 1 ? 'applicant' : 'applicants'}
                    </div>
                    {/* <Badge variant='default' className='rounded-full'>
                      {job.openPositions}{' '}
                      {job.openPositions === 1 ? 'applicant' : 'applicants'}
                    </Badge> */}
                  </div>
                  <div className='text-sm text-muted-foreground'>
                    {job.department} • {job.location}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className='flex flex-col items-center justify-center py-8 text-center'>
              <FileTextIcon className='mb-3 h-12 w-12 text-muted-foreground/50' />
              <h3 className='mb-1 text-lg font-medium'>No open positions</h3>
              <p className='text-sm text-muted-foreground'>
                Create your first job posting to start attracting candidates.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
