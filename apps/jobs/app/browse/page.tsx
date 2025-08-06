import { HydrationBoundary, dehydrate } from '@tanstack/react-query'
import { Header } from '../../components/header'
import { JobsSection } from '../../components/jobs-section'
import { getSearchResultsServerSide } from '../../lib/server-queries'
import { getServerQueryClient } from '../../lib/query-client'
import { Providers } from '../../components/providers'

interface BrowsePageProps {
  searchParams: {
    q?: string
    location?: string
    job_type?: string
    remote?: string
    salary?: string
    experience?: string
    page?: string
  }
}

/**
 * Server Component that prefetches job data based on search parameters
 * This ensures the page loads immediately with data from the server
 */
export default async function BrowsePage({ searchParams }: BrowsePageProps) {
  // Extract search parameters
  const query = searchParams.q || ''
  const location = searchParams.location || ''
  const page = parseInt(searchParams.page || '1', 10)
  const limit = 20

  // Build filters from search params
  const filters: Record<string, any> = {}
  if (searchParams.job_type) filters.jobType = searchParams.job_type
  if (searchParams.remote) filters.remote = searchParams.remote
  if (searchParams.salary) filters.salary = searchParams.salary
  if (searchParams.experience) filters.experience = searchParams.experience

  try {
    // Prefetch data on the server
    const { dehydratedState, data, searchParams: serverSearchParams } = await getSearchResultsServerSide(
      query,
      location,
      filters,
      page,
      limit
    )

    // Determine page title and description based on search params
    const getPageTitle = () => {
      if (query && location) return `Search Results for "${query}" in ${location}`
      if (query) return `Search Results for "${query}"`
      if (location) return `Jobs in ${location}`
      return 'Browse All Jobs'
    }

    const getPageDescription = () => {
      if (query && location) return `Showing results for "${query}" in ${location}`
      if (query) return `Showing results for "${query}"`
      if (location) return `Showing jobs in ${location}`
      return 'Discover opportunities from leading companies'
    }

    return (
      <div className='min-h-screen bg-background'>
        <Header />
        
        <main className='container mx-auto px-4 py-16'>
          <div className='mb-12 text-center'>
            <h1 className='text-4xl font-bold mb-4'>
              {getPageTitle()}
            </h1>
            <p className='text-muted-foreground text-lg'>
              {getPageDescription()}
            </p>
            {data.success && data.pagination.total > 0 && (
              <p className='text-sm text-muted-foreground mt-2'>
                {data.pagination.total} jobs found
              </p>
            )}
          </div>

          {/* 
            HydrationBoundary ensures that server-prefetched data 
            is properly hydrated on the client side
          */}
          <HydrationBoundary state={dehydratedState}>
            <JobsSection
              initialJobs={data.success ? data.data : []}
              initialPagination={data.pagination}
              searchQuery={query}
              location={location}
              initialFilters={filters}
            />
          </HydrationBoundary>
        </main>
      </div>
    )
  } catch (error) {
    console.error('Failed to load browse page:', error)
    
    // Fallback UI for when server-side data fetching fails
    return (
      <div className='min-h-screen bg-background'>
        <Header />
        
        <main className='container mx-auto px-4 py-16'>
          <div className='mb-12 text-center'>
            <h1 className='text-4xl font-bold mb-4'>Browse All Jobs</h1>
            <p className='text-muted-foreground text-lg'>
              Discover opportunities from leading companies
            </p>
          </div>

          {/* Fallback - let client-side queries handle data fetching */}
          <JobsSection 
            searchQuery={query}
            location={location}
            initialFilters={filters}
          />
        </main>
      </div>
    )
  }
}