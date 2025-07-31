import { Button } from '../../ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../../ui/card'
import { Plus } from 'lucide-react'

export function CandidateApplicationsSkeleton() {
  const skeletonItems = Array(3).fill(0)

  return (
    <Card>
      <CardHeader className='flex flex-row items-center justify-between'>
        <div>
          <CardTitle>Job Applications</CardTitle>
          <CardDescription>
            Track the status of your job applications
          </CardDescription>
        </div>
        <Button size='sm'>
          <Plus className='size-4 mr-1' /> Add Application
        </Button>
      </CardHeader>
      <CardContent>
        <div className='space-y-4'>
          {skeletonItems.map((_, index) => (
            <div
              key={index}
              className='flex flex-col md:flex-row items-start md:items-center justify-between p-[16px] border rounded animate-pulse'>
              <div className='flex items-center gap-4 mb-3 md:mb-0 flex-grow'>
                <div className='w-10 h-10 rounded bg-muted flex-shrink-0'></div>
                <div className='w-full md:w-3/4'>
                  <div className='h-5 bg-muted rounded w-3/5 mb-1.5'></div>
                  <div className='h-4 bg-muted rounded w-2/5'></div>
                </div>
              </div>
              <div className='flex flex-col md:flex-row items-start md:items-end gap-3 w-full md:w-auto md:flex-shrink-0'>
                <div className='flex flex-col gap-1 items-start md:items-end w-full md:w-auto'>
                  <div className='h-6 w-24 bg-muted rounded mb-1'></div>
                  <div className='h-3.5 w-32 bg-muted rounded'></div>
                </div>
                <div className='h-9 w-24 bg-muted rounded ml-auto md:ml-0'></div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
