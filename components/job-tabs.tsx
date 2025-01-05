'use client'

import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { departments, jobs } from '@/data/data'
import { useRouter, useSearchParams } from 'next/navigation'
import { JobCard } from './job-card'

export function JobTabs() {
  const searchParams = useSearchParams()
  const router = useRouter()

  const currentTab = searchParams.get('tab') || 'active'

  const handleTabChange = (value: string) => {
    const newParams = new URLSearchParams(searchParams.toString())
    newParams.set('tab', value)
    router.push(`?${newParams.toString()}`)
  }
  return (
    <div className='mt-10'>
      <Tabs
        defaultValue='active'
        className='w-full'
        value={currentTab}
        onValueChange={handleTabChange}>
        <TabsList className='grid w-full grid-cols-2 bg-accent/10'>
          <TabsTrigger value='active'>Active</TabsTrigger>
          <TabsTrigger value='inactive'>Inactive</TabsTrigger>
        </TabsList>
        <TabsContent value='active'>
          {departments.map((department, index) => (
            <div key={department}>
              {index > 0 && <Separator className='mt-8 mb-4' />}
              <h4 className='scroll-m-20 text-xl font-semibold tracking-tight  first:mt-0 mb-2 text-muted-foreground'>
                {department}
              </h4>
              <ul className='flex flex-col gap-2'>
                {jobs
                  .filter((job) => job.department === department && job.active)
                  .map((job) => (
                    <JobCard key={job.id} job={job} />
                  ))}
              </ul>
            </div>
          ))}
        </TabsContent>
        <TabsContent value='inactive'>
          {departments.reduce((acc, department) => {
            const filteredJobs = jobs.filter(
              (job) => job.department === department && !job.active
            )

            if (filteredJobs.length === 0) {
              return acc
            }

            acc.push(
              <div key={department}>
                {acc.length > 0 && <Separator className='mt-8 mb-4' />}
                <h4 className='scroll-m-20 text-xl font-semibold tracking-tight first:mt-0 mb-2 text-muted-foreground'>
                  {department}
                </h4>
                <ul className='flex flex-col gap-2'>
                  {filteredJobs.map((job) => (
                    <JobCard key={job.id} job={job} />
                  ))}
                </ul>
              </div>
            )

            return acc
          }, [] as React.ReactNode[])}
        </TabsContent>
      </Tabs>
    </div>
  )
}
