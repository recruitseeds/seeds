import { Header } from '../../components/header'
import { JobsSection } from '../../components/jobs-section'
import { createFallbackJobsResponse, getJobsServerSide } from '../../lib/server-api'

export const dynamic = 'force-dynamic'

interface BrowsePageProps {
  searchParams: Promise<{
    q?: string
    location?: string
    job_type?: string
    work_location?: string
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

  // Convert URL parameters back to proper format for UI
  const filters: Record<string, any> = {}
  if (params.job_type) {
    filters.jobType = params.job_type.split(',').map(type =>
      type.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
    ).join(',')
  }
  if (params.work_location) {
    filters.remote = params.work_location.split(',').map(workLocation =>
      workLocation.charAt(0).toUpperCase() + workLocation.slice(1)
    ).join(',')
  }
  if (params.department) {
    filters.department = params.department.split(',').map(dept =>
      dept.charAt(0).toUpperCase() + dept.slice(1)
    ).join(',')
  }
  if (params.salary) filters.salary = params.salary
  if (params.experience) {
    filters.experience = params.experience.split(',').map(exp =>
      exp.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
    ).join(',')
  }

  // Fetch jobs server-side for immediate loading (only when no search/filters)
  let jobsData = null
  if (!query && !location && Object.keys(filters).length === 0 && page === 1) {
    try {
      jobsData = await getJobsServerSide(1, 20)
    } catch (error) {
      console.error('Failed to fetch jobs server-side:', error)
      jobsData = createFallbackJobsResponse(error instanceof Error ? error : new Error('Unknown error'))
    }
  }

  return (
    <div className='min-h-screen bg-background'>
      <Header />
      <main className='container mx-auto px-4 py-8'>
        <JobsSection
          initialJobs={jobsData?.data || []}
          initialPagination={jobsData?.pagination}
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
