import { HydrationBoundary } from '@tanstack/react-query'
import { ChevronLeft } from 'lucide-react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ApplicationStateProvider } from '../../../components/application-state-provider'
import { Header } from '../../../components/header'
import { TipTapRenderer } from '../../../components/tiptap-renderer'
import { getJobServerSide } from '../../../lib/server-queries'
import { ApplicationForm } from './application-form'
import { ApplyButtons } from './apply-buttons'

function formatJobType(type: string): string {
  const typeMap: Record<string, string> = {
    full_time: 'Full Time',
    part_time: 'Part Time',
    contract: 'Contract',
    internship: 'Internship',
    temporary: 'Temporary',
    freelance: 'Freelance',
  }
  return typeMap[type.toLowerCase()] || type
}

function formatDepartment(department: string | null): string {
  if (!department) return 'General'

  return department
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
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
            <ApplicationStateProvider initialState={{ hasApplied: false, applicationId: null }}>
              <div className='job-layout-container'>
                <aside className='job-layout-sidebar'>
                  <div className='job-layout-sidebar-inner'>
                    <div className='p-6 space-y-6'>
                      <div>
                        <p className='text-muted-foreground text-sm mb-2'>
                          {[formatDepartment(job.department), formatJobType(job.job_type)].filter(Boolean).join(' · ')}
                        </p>
                        <h1 className='text-3xl font-bold mb-4'>{job.title}</h1>
                        <p className='text-lg text-muted-foreground'>{job.organization.name}</p>
                      </div>

                      <ApplyButtons jobId={jobId} />
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
                      />
                    </div>
                  </section>
                </main>
              </div>
            </ApplicationStateProvider>
          </HydrationBoundary>
        </div>
      </div>
    )
  } catch (error) {
    notFound()
  }
}
