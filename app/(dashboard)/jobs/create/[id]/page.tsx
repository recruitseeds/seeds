import type { RouterOutputs } from '@/trpc/routers/_app'
import { getServerTRPCCaller } from '@/trpc/server'
import { notFound } from 'next/navigation'
import { JobEditClient } from './job-edit-client'

interface PageProps {
  params: { id: string }
}

type JobPosting = RouterOutputs['organization']['getJobPosting']

export default async function EditJobPage({ params }: PageProps) {
  let jobPosting: JobPosting

  try {
    const caller = await getServerTRPCCaller()
    jobPosting = await caller.organization.getJobPosting({ id: params.id })

    if (!jobPosting) {
      notFound()
    }
  } catch (error) {
    notFound()
  }

  const transformedJobData = {
    id: jobPosting.id,
    title: jobPosting.title === 'Untitled' ? '' : jobPosting.title,
    job_type: (jobPosting.job_type === 'full_time' && jobPosting.title === 'Untitled'
      ? 'full_time'
      : jobPosting.job_type) as 'full_time' | 'part_time' | 'contract' | 'internship' | 'temporary',
    department: jobPosting.department,
    experience_level: jobPosting.experience_level,
    hiring_manager_id: jobPosting.hiring_manager_id,
    salary_min: jobPosting.salary_min,
    salary_max: jobPosting.salary_max,
    salary_type: jobPosting.salary_type,
    status: jobPosting.status as 'draft' | 'published' | 'archived' | 'closed',
    content: jobPosting.content,
  }

  return <JobEditClient jobId={params.id} initialJobData={transformedJobData} existingContent={jobPosting.content} />
}
