import { ChevronLeft, Coffee, DollarSign, GraduationCap, Heart, Home, Shield } from 'lucide-react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Header } from '../../../components/header'
import { ApplicationForm } from './application-form'
import { ApplyButtons } from './apply-buttons'
import { getJobById, formatSalary, getTimeAgo } from '../../../lib/api'
import { TipTapRenderer } from '../../../components/tiptap-renderer'

interface JobPageProps {
  params: Promise<{
    orgSlug: string
    jobId: string
  }>
}

export default async function JobPage({ params }: JobPageProps) {
  const { orgSlug, jobId } = await params

  try {
    const response = await getJobById(jobId)
    const job = response.data

    return (
    <div className='min-h-screen bg-background'>
      <Header />

      <div className='container mx-auto px-4 py-4'>
        <Link
          href={`/${orgSlug}`}
          className='inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors'>
          <ChevronLeft className='h-4 w-4' />
          <span>Back to all jobs</span>
        </Link>
      </div>

      <div className='container mx-auto px-4 pb-8'>
        <div className='job-layout-container'>
          <aside className='job-layout-sidebar'>
            <div className='job-layout-sidebar-inner'>
              <div className='p-6 space-y-6'>
                <div>
                  <p className='text-muted-foreground text-sm mb-2'>
                    {job.department} · {job.job_type} · Remote/Hybrid
                  </p>
                  <h1 className='text-2xl font-bold mb-4'>{job.title}</h1>
                  <p className='text-lg text-muted-foreground'>{job.organization.name}</p>
                </div>

                <ApplyButtons />

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
            
            <div className='mt-8 p-6 bg-muted/30 rounded-lg'>
              <h3 className='text-lg font-semibold mb-4'>Job Details</h3>
              <div className='grid grid-cols-1 md:grid-cols-2 gap-4 text-sm'>
                {job.department && (
                  <div>
                    <span className='font-medium text-muted-foreground'>Department:</span>
                    <span className='ml-2'>{job.department}</span>
                  </div>
                )}
                <div>
                  <span className='font-medium text-muted-foreground'>Employment Type:</span>
                  <span className='ml-2'>{job.job_type}</span>
                </div>
                {job.experience_level && (
                  <div>
                    <span className='font-medium text-muted-foreground'>Experience Level:</span>
                    <span className='ml-2'>{job.experience_level}</span>
                  </div>
                )}
                {(job.salary_min || job.salary_max) && (
                  <div>
                    <span className='font-medium text-muted-foreground'>Salary:</span>
                    <span className='ml-2'>{formatSalary(job.salary_min, job.salary_max, job.salary_type)}</span>
                  </div>
                )}
                <div>
                  <span className='font-medium text-muted-foreground'>Posted:</span>
                  <span className='ml-2'>{job.published_at ? getTimeAgo(job.published_at) : 'Recently'}</span>
                </div>
              </div>
            </div>

            <section id='apply' className='mt-16 scroll-mt-24'>
              <div className='border rounded-lg p-8'>
                <h2 className='text-2xl font-semibold mb-2'>Apply for this position</h2>
                <p className='text-muted-foreground mb-8'>
                  Fill out the form below and we'll get back to you as soon as possible.
                </p>
                <ApplicationForm jobId={jobId} orgSlug={orgSlug} />
              </div>
            </section>
          </main>
        </div>
      </div>
    </div>
    )
  } catch (error) {
    notFound()
  }
}
