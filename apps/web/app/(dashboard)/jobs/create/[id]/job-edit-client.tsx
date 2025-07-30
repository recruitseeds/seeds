'use client'

import { JobProfileSheet } from '@/components/job-profile-sheet'
import { BlockEditor } from '@seeds/editor'
import { SidebarInset, SidebarProvider } from '@seeds/ui/sidebar'
import type { Json } from '@/supabase/types/db'
import { useState } from 'react'
import { useTRPC } from '@/trpc/client'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { TRPCClientErrorLike } from '@trpc/client'
import { toast } from 'sonner'

interface TransformedJobData {
  id?: string
  title: string
  job_type: 'full_time' | 'part_time' | 'contract' | 'internship' | 'temporary'
  content?: Json
  status?: 'draft' | 'published' | 'archived' | 'closed'
  department?: string | null
  experience_level?: string | null
  hiring_manager_id?: string | null
  salary_min?: number | null
  salary_max?: number | null
  salary_type?: string | null
}

interface JobEditClientProps {
  jobId: string
  initialJobData: TransformedJobData
  existingContent: Json
}

export function JobEditClient({ jobId, initialJobData, existingContent }: JobEditClientProps) {
  const [jobData, setJobData] = useState(initialJobData)
  const trpcClient = useTRPC()
  const queryClient = useQueryClient()

  const updateJobPostingMutation = useMutation(
    trpcClient.organization.updateJobPosting.mutationOptions({
      onSuccess: async (data, variables) => {
        await queryClient.invalidateQueries(trpcClient.organization.listJobPostings.queryFilter())
        await queryClient.invalidateQueries(trpcClient.organization.getJobPosting.queryFilter({ id: jobId }))
        toast.success('Job posting updated successfully!')
      },
      onError: (error: TRPCClientErrorLike<any>) => {
        console.error('Failed to update job posting:', error)
        toast.error(`Failed to update job posting: ${error.message}`)
      },
    })
  )

  return (
    <SidebarProvider>
      <SidebarInset className='overflow-x-auto'>
        <div className='mb-20'>
          <BlockEditor
            jobData={jobData}
            existingContent={existingContent}
            jobId={jobId}
            isEditing={true}
            isJobDataLoading={false}
            onUpdateJob={updateJobPostingMutation.mutate}
            isUpdating={updateJobPostingMutation.isPending}
          />
        </div>
      </SidebarInset>
      <JobProfileSheet onJobDataChange={setJobData} jobData={jobData} isEditing={true} />
    </SidebarProvider>
  )
}
