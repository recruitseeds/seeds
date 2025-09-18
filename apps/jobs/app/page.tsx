import { ClientWrapper } from '../components/client-wrapper'
import { Footer } from '../components/footer'
import { Header } from '../components/header'
import { HeroSection } from '../components/hero-section'
import { JobsSection } from '../components/jobs-section'
import { createFallbackJobsResponse, getJobsServerSide } from '../lib/server-api'

export const dynamic = 'force-dynamic'

export default async function HomePage() {
  let jobsData
  try {
    jobsData = await getJobsServerSide(1, 20)
  } catch (error) {
    console.error('Failed to fetch jobs server-side:', error)
    jobsData = createFallbackJobsResponse(error instanceof Error ? error : new Error('Unknown error'))
  }

  return (
    <div className='min-h-screen bg-background flex flex-col'>
      <Header />
      <main className='flex-1'>
        <HeroSection />
        <JobsSection
          initialJobs={jobsData.data}
          initialPagination={jobsData.pagination}
          showSearch={false}
          showFilters={false}
          title='Latest Opportunities'
          description='Discover new positions from leading companies'
        />
      </main>
      <Footer />
      <ClientWrapper />
    </div>
  )
}
