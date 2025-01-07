import { JobTabs } from '@/components/job-tabs'
import { JobFilter } from '../../../../components/job-filters'

// TODO: If Editor !== '' then we should display and alert so they don't lose progress. Also, we should implement a draft system
export default function Page() {
  return (
    <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
      <div className="mx-auto w-full max-w-3xl">
        <h2 className="mb-5 mt-10 scroll-m-20 text-3xl font-semibold tracking-tight">
          Open positions
        </h2>
        <JobFilter />
        <JobTabs />
      </div>
    </div>
  )
}
