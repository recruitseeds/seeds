import { Clock, DollarSign, MapPin, Users } from 'lucide-react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getCompanyJobs, formatSalary, getTimeAgo } from '../../lib/api'

interface CompanyJobsPageProps {
  params: Promise<{
    orgSlug: string
  }>
}

export default async function CompanyJobsPage({ params }: CompanyJobsPageProps) {
  const { orgSlug } = await params

  try {
    const response = await getCompanyJobs(orgSlug)
    const { organization, jobs } = response.data

    return (
    <div className='min-h-screen bg-background'>
      {/* Company Header */}
      <div className='border-b bg-card'>
        <div className='container mx-auto px-4 py-8'>
          <div className='flex items-start gap-6'>
            <div className='w-16 h-16 bg-primary/10 rounded-lg flex items-center justify-center'>
              {organization.logo_url ? (
                <img 
                  src={organization.logo_url} 
                  alt={`${organization.name} logo`}
                  className='w-12 h-12 rounded object-cover'
                />
              ) : (
                <span className='text-2xl font-bold text-primary'>{organization.name[0]}</span>
              )}
            </div>
            <div className='flex-1'>
              <h1 className='text-3xl font-bold mb-2'>{organization.name}</h1>
              <p className='text-muted-foreground mb-4'>
                {organization.domain ? `Visit us at ${organization.domain}` : 'Leading technology company'}
              </p>
              <div className='flex items-center gap-6 text-sm text-muted-foreground'>
                <div className='flex items-center gap-1'>
                  <Users className='h-4 w-4' />
                  Company
                </div>
                {organization.domain && (
                  <div className='flex items-center gap-1'>
                    <MapPin className='h-4 w-4' />
                    {organization.domain}
                  </div>
                )}
              </div>
            </div>
            <button className='px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors'>
              View Company Profile
            </button>
          </div>
        </div>
      </div>

      {/* Jobs Section */}
      <div className='container mx-auto px-4 py-8'>
        <div className='flex items-center justify-between mb-6'>
          <h2 className='text-2xl font-semibold'>Open Positions ({jobs.length})</h2>
          <div className='flex gap-2'>
            <select className='px-3 py-2 border rounded-lg bg-background'>
              <option>All Departments</option>
              <option>Engineering</option>
              <option>Product</option>
              <option>Design</option>
            </select>
            <select className='px-3 py-2 border rounded-lg bg-background'>
              <option>All Locations</option>
              <option>Remote</option>
              <option>San Francisco</option>
              <option>New York</option>
            </select>
          </div>
        </div>

        {/* Job Listings */}
        <div className='space-y-4'>
          {jobs.map((job) => (
            <div key={job.id} className='border rounded-lg p-6 hover:bg-muted/50 transition-colors'>
              <div className='flex items-start justify-between'>
                <div className='flex-1'>
                  <div className='flex items-center gap-3 mb-2'>
                    <h3 className='text-xl font-semibold'>{job.title}</h3>
                    {job.department && (
                      <span className='px-2 py-1 bg-primary/10 text-primary text-xs rounded-full'>
                        {job.department}
                      </span>
                    )}
                  </div>

                  <div className='flex items-center gap-6 text-sm text-muted-foreground mb-3'>
                    <div className='flex items-center gap-1'>
                      <MapPin className='h-4 w-4' />
                      {job.location || 'Location TBD'}
                    </div>
                    <div className='flex items-center gap-1'>
                      <Clock className='h-4 w-4' />
                      {job.job_type}
                    </div>
                    <div className='flex items-center gap-1'>
                      <DollarSign className='h-4 w-4' />
                      {formatSalary(job.salary_min, job.salary_max, job.salary_type)}
                    </div>
                    {job.experience_level && (
                      <div className='flex items-center gap-1'>
                        <Users className='h-4 w-4' />
                        {job.experience_level}
                      </div>
                    )}
                  </div>

                  <p className='text-muted-foreground mb-3'>
                    Join our team and contribute to innovative projects in a collaborative environment.
                  </p>

                  <div className='text-xs text-muted-foreground'>
                    Posted {job.published_at ? getTimeAgo(job.published_at) : 'recently'}
                  </div>
                </div>

                <div className='ml-6'>
                  <Link
                    href={`/${orgSlug}/${job.id}`}
                    className='px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors inline-block'>
                    View Job
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* No Jobs State */}
        {jobs.length === 0 && (
          <div className='text-center py-12'>
            <div className='text-gray-600 mb-4'>No open positions at the moment</div>
            <button className='px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors'>
              Join Talent Pool
            </button>
          </div>
        )}
      </div>
    </div>
    )
  } catch (error) {
    notFound()
  }
}
