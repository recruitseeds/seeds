import { JobsTable } from '@/components/tables/jobs/index'
import { HydrateClient, getQueryClient, trpc } from '@/trpc/server'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Job Postings | Seeds ATS',
}

interface JobsPageProps {
  searchParams: Promise<{
    page?: string
    search?: string
    status?: string
    sort?: string
  }>
}

export default async function JobsPage({ searchParams }: JobsPageProps) {
  const params = await searchParams
  const queryClient = getQueryClient()

  const page = params.page ? Number.parseInt(params.page, 10) : 1
  const search = params.search || undefined
  const status = params.status as 'draft' | 'published' | 'archived' | 'closed' | undefined
  const sort = params.sort ? (params.sort.split(',') as [string, string]) : undefined

  await queryClient.prefetchInfiniteQuery(
    trpc.organization.listJobs.infiniteQueryOptions({
      search,
      status,
      sort,
      limit: 50,
    })
  )

  return (
    <div className='space-y-6'>
      <div>
        <h1 className='text-3xl font-bold tracking-tight'>Job Postings</h1>
        <p className='text-muted-foreground'>Manage your organization's job postings and track applications.</p>
      </div>

      <HydrateClient>
        <JobsTable initialSearch={search} initialStatus={status} initialSort={sort} />
      </HydrateClient>
    </div>
  )
}
