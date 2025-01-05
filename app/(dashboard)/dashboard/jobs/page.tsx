import { JobTabs } from '@/components/job-tabs'
import { JobFilter } from '../../../../components/job-filters'

export default function Page() {
  return (
    <div className='flex flex-1 flex-col gap-4 p-4 pt-0'>
      <div className='max-w-3xl mx-auto w-full'>
        <h2 className='scroll-m-20 text-3xl font-semibold tracking-tight mt-10 mb-5'>
          Open positions
        </h2>
        <JobFilter />
        <JobTabs />
      </div>
    </div>
  )
}
