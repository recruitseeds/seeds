'use client'

import { JobProfileSheet } from '@/components/job-profile-sheet'
import { BlockEditor } from '@/components/ui/editor/block-editor'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import { useTRPC } from '@/trpc/client'
import { useQuery } from '@tanstack/react-query'
import { Loader2 } from 'lucide-react'
import { notFound, useParams } from 'next/navigation'
import { useEffect, useState } from 'react'

export default function EditJobPage() {
  const params = useParams()
  const id = params.id as string
  const [jobData, setJobData] = useState(null)
  const trpcClient = useTRPC()

  // Fetch the existing job posting using your established pattern
  const queryOptionsObj = trpcClient.organization.getJobPosting.queryOptions({ id: id })

  const { data: existingJob, isLoading, error } = useQuery(queryOptionsObj)

  // Update jobData state when existingJob loads
  useEffect(() => {
    if (existingJob) {
      const transformedJobData = {
        id: existingJob.id,
        title: existingJob.title,
        job_type: existingJob.job_type,
        department: existingJob.department,
        experience_level: existingJob.experience_level,
        hiring_manager_id: existingJob.hiring_manager_id,
        salary_min: existingJob.salary_min,
        salary_max: existingJob.salary_max,
        salary_type: existingJob.salary_type,
        status: existingJob.status,
        content: existingJob.content,
      }
      setJobData(transformedJobData)
    }
  }, [existingJob])

  // Handle error cases
  if (error) {
    if (error.data?.code === 'NOT_FOUND') {
      notFound()
    }
    return (
      <div className='container mx-auto py-8'>
        <div className='text-center'>
          <h1 className='text-2xl font-bold text-red-600 mb-4'>Error Loading Job</h1>
          <p className='text-gray-600'>{error.message}</p>
        </div>
      </div>
    )
  }

  // Loading state
  if (isLoading) {
    return (
      <div className='container mx-auto py-8'>
        <div className='flex items-center justify-center min-h-[400px]'>
          <div className='flex items-center gap-3'>
            <Loader2 className='h-6 w-6 animate-spin' />
            <span className='text-lg'>Loading job posting...</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <SidebarProvider>
      <SidebarInset className='overflow-x-auto'>
        <div className='mb-20'>
          <BlockEditor jobData={jobData} existingContent={existingJob?.content} jobId={id} isEditing={true} />
        </div>
      </SidebarInset>
      <JobProfileSheet onJobDataChange={setJobData} jobData={jobData} isEditing={true} />
    </SidebarProvider>
  )
}
