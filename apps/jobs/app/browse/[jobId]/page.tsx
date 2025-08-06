import { ChevronLeft } from 'lucide-react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { HydrationBoundary } from '@tanstack/react-query'
import { Header } from '../../../components/header'
import { TipTapRenderer } from '../../../components/tiptap-renderer'
import { getJobServerSide } from '../../../lib/server-queries'
import { ApplicationForm } from './application-form'
import { ApplyButtons } from './apply-buttons'
import { createClient } from '../../../lib/supabase/server'

// Format job type for display
function formatJobType(type: string): string {
  const typeMap: Record<string, string> = {
    'full_time': 'Full Time',
    'part_time': 'Part Time',
    'contract': 'Contract',
    'internship': 'Internship',
    'temporary': 'Temporary',
    'freelance': 'Freelance'
  }
  return typeMap[type.toLowerCase()] || type
}

// Format department for display
function formatDepartment(department: string | null): string {
  if (!department) return 'General'
  
  // Capitalize first letter of each word
  return department
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ')
}

interface JobPageProps {
  params: Promise<{
    jobId: string
  }>
}

export default async function JobPage({ params }: JobPageProps) {
  const { jobId } = await params

  try {
    const { dehydratedState, data } = await getJobServerSide(jobId)
    const job = data.data

    // Check if user has already applied (server-side)
    let hasApplied = false
    let applicationId: string | null = null
    try {
      const supabase = await createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user?.email) {
        // Server-side application check - no client-side useEffect needed
        const { checkExistingApplication } = await import('../../../lib/api')
        const result = await checkExistingApplication(jobId, user.email)
        hasApplied = result.data.hasApplied
        applicationId = result.data.applicationId || null
      }
    } catch (error) {
      console.warn('Failed to check existing application server-side:', error)
      // Continue without application check - will be handled client-side if needed
    }

    return (
      <div className='min-h-screen bg-background'>
        <Header />

        <div className='container mx-auto px-4 py-4'>
          <Link
            href='/browse'
            className='inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors'>
            <ChevronLeft className='h-4 w-4' />
            <span>Back to all jobs</span>
          </Link>
        </div>

        <div className='container mx-auto px-4 pb-8'>
          <HydrationBoundary state={dehydratedState}>
            <div className='job-layout-container'>
              <aside className='job-layout-sidebar'>
                <div className='job-layout-sidebar-inner'>
                  <div className='p-6 space-y-6'>
                    <div>
                      <p className='text-muted-foreground text-sm mb-2'>
                        {formatDepartment(job.department)} · {formatJobType(job.job_type)} · Remote/Hybrid
                      </p>
                      <h1 className='text-2xl font-bold mb-4'>{job.title}</h1>
                      <p className='text-lg text-muted-foreground'>{job.organization.name}</p>
                    </div>

                    <ApplyButtons 
                      jobId={jobId} 
                      serverApplicationCheck={{
                        hasApplied,
                        applicationId
                      }}
                    />

                    {/* Job details temporarily commented out */}
                    {/* <div className='space-y-3 pt-6 border-t'>
                    <div className='flex items-center justify-between'>
                      <span className='text-muted-foreground text-sm'>Location</span>
                      <span className='font-medium text-sm'>{jobData.location}</span>
                    </div>
                    <div className='flex items-center justify-between'>
                      <span className='text-muted-foreground text-sm'>Salary Range</span>
                      <span className='font-medium text-sm'>{formatSalary(jobData.salaryMin, jobData.salaryMax)}</span>
                    </div>
                    <div className='flex items-center justify-between'>
                      <span className='text-muted-foreground text-sm'>Experience</span>
                      <span className='font-medium text-sm'>{jobData.experienceLevel}</span>
                    </div>
                    <div className='flex items-center justify-between'>
                      <span className='text-muted-foreground text-sm'>Work Type</span>
                      <span className='font-medium text-sm'>{jobData.remote}</span>
                    </div>
                  </div> */}

                    {/* <div className='pt-6 border-t'>
                    <h3 className='font-semibold mb-3 text-sm'>Required Skills</h3>
                    <div className='flex flex-wrap gap-2'>
                      {jobData.skills.map((skill, index) => (
                        <Badge key={index} variant='secondary' className='text-xs'>
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </div> */}
                  </div>
                </div>
              </aside>

              <main className='job-layout-main'>
                <TipTapRenderer content={job.content} />

                <section id='apply' className='mt-16 scroll-mt-24'>
                  <div className='border rounded-lg p-8'>
                    <h2 className='text-2xl font-semibold mb-2'>Apply for this position</h2>
                    <p className='text-muted-foreground mb-8'>
                      Fill out the form below and we'll get back to you as soon as possible.
                    </p>
                    <ApplicationForm 
                      jobId={jobId} 
                      orgSlug={job.organization.name.toLowerCase().replace(/\s+/g, '-')}
                      serverApplicationCheck={{
                        hasApplied,
                        applicationId
                      }}
                    />
                  </div>
                </section>
              </main>
            </div>
          </HydrationBoundary>
        </div>
      </div>
    )
  } catch (error) {
    notFound()
  }
}
