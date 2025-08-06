import { Header } from '../../../../components/header'
import { JobCard } from '../../../../components/job-card'

interface CompanyBrowsePageProps {
  params: Promise<{
    companySlug: string
  }>
}

// Mock data - replace with API call
const mockCompanyJobs = {
  techcorp: {
    name: 'TechCorp',
    description: 'Leading technology company focused on innovation',
    jobs: [
      {
        id: '1',
        title: 'Senior Frontend Developer',
        company: 'TechCorp',
        companySlug: 'techcorp',
        location: 'San Francisco, CA',
        type: 'Full-time' as const,
        salary: '$120k - $160k',
        remote: 'Hybrid' as const,
        posted: '2 days ago',
        tags: ['React', 'TypeScript', 'Remote OK'],
      },
      {
        id: '2',
        title: 'Product Manager',
        company: 'TechCorp',
        companySlug: 'techcorp',
        location: 'San Francisco, CA',
        type: 'Full-time' as const,
        salary: '$130k - $180k',
        remote: 'Remote' as const,
        posted: '1 week ago',
        tags: ['Strategy', 'Analytics', 'Growth'],
      },
    ],
  },
  startupxyz: {
    name: 'StartupXYZ',
    description: 'Fast-growing startup disrupting the industry',
    jobs: [
      {
        id: '3',
        title: 'Data Scientist',
        company: 'StartupXYZ',
        companySlug: 'startupxyz',
        location: 'New York, NY',
        type: 'Full-time' as const,
        salary: '$110k - $150k',
        remote: 'On-site' as const,
        posted: '3 days ago',
        tags: ['Python', 'ML', 'SQL'],
      },
    ],
  },
}

export default async function CompanyBrowsePage({ params }: CompanyBrowsePageProps) {
  const { companySlug } = await params
  const companyData = mockCompanyJobs[companySlug as keyof typeof mockCompanyJobs] || mockCompanyJobs.techcorp

  return (
    <div className='min-h-screen bg-background'>
      <Header />
      
      <main className='container mx-auto px-4 py-16'>
        <div className='mb-12'>
          <h1 className='text-4xl font-bold mb-4'>{companyData.name}</h1>
          <p className='text-muted-foreground text-lg mb-8'>{companyData.description}</p>
          <p className='text-muted-foreground'>{companyData.jobs.length} open positions</p>
        </div>

        <div className='border border-border rounded-lg overflow-hidden'>
          {companyData.jobs.map((job, index) => (
            <div key={job.id}>
              <JobCard job={job} />
              {index < companyData.jobs.length - 1 && <div className='border-b border-border' />}
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}