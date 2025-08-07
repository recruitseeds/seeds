import { HydrationBoundary } from '@tanstack/react-query'
import { Header } from '../../components/header'
import { JobsSection } from '../../components/jobs-section'
import { getSearchResultsServerSide } from '../../lib/server-queries'

interface BrowsePageProps {
  searchParams: Promise<{
    q?: string
    location?: string
    job_type?: string
    remote?: string
    salary?: string
    experience?: string
    department?: string
    page?: string
  }>
}

export default async function BrowsePage({ searchParams }: BrowsePageProps) {
  const params = await searchParams

  const query = params.q || ''
  const location = params.location || ''
  const page = parseInt(params.page || '1', 10)
  const limit = 20

  const filters: Record<string, any> = {}
  if (params.job_type) filters.jobType = params.job_type
  if (params.remote) filters.remote = params.remote
  if (params.department) filters.department = params.department
  if (params.salary) filters.salary = params.salary
  if (params.experience) filters.experience = params.experience

  try {
    const {
      dehydratedState,
      data,
      searchParams: serverSearchParams,
    } = await getSearchResultsServerSide(query, location, filters, page, limit)

    return (
      <div className='min-h-screen bg-background'>
        <Header />

        <main className='container mx-auto px-4 py-8'>
          <HydrationBoundary state={dehydratedState}>
            <JobsSection
              initialJobs={data.success ? data.data : []}
              initialPagination={data.pagination}
              searchQuery={query}
              location={location}
              initialFilters={filters}
              showSearch={true}
              showFilters={true}
              showTitle={false}
            />
          </HydrationBoundary>
        </main>
      </div>
    )
  } catch (error) {
    console.error('Failed to load browse page:', error)

    return (
      <div className='min-h-screen bg-background'>
        <Header />
        <main className='container mx-auto px-4 py-8'>
          <JobsSection
            searchQuery={query}
            location={location}
            initialFilters={filters}
            showSearch={true}
            showFilters={true}
            showTitle={false}
          />
        </main>
      </div>
    )
  }
}
