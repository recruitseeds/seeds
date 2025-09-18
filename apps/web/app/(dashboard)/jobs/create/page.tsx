'use client'

import { JobProfileSheet } from '@/components/job-profile-sheet'
import { BlockEditor } from '@seeds/editor'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import { useState } from 'react'
import { useTRPC } from '@/trpc/client'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { TRPCClientErrorLike } from '@trpc/client'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

export default function Page() {
  const [jobData, setJobData] = useState(null)
  const trpcClient = useTRPC()
  const queryClient = useQueryClient()
  const router = useRouter()

  const createJobPostingMutation = useMutation(
    trpcClient.organization.createJobPosting.mutationOptions({
      onSuccess: async (data) => {
        await queryClient.invalidateQueries(trpcClient.organization.listJobPostings.queryFilter())
        toast.success('Job posting saved successfully!')
        
        router.push('/jobs')
      },
      onError: (error: TRPCClientErrorLike<any>) => {
        console.error('Failed to save job posting:', error)
        toast.error(`Failed to save job posting: ${error.message}`)
      },
    })
  )

  return (
    <SidebarProvider>
      <SidebarInset className='overflow-x-auto'>
        <div className='mb-20'>
          <BlockEditor 
            jobData={jobData} 
            isJobDataLoading={false}
            onCreateJob={createJobPostingMutation.mutate}
            isCreating={createJobPostingMutation.isPending}
          />
        </div>
      </SidebarInset>
      <JobProfileSheet onJobDataChange={setJobData} jobData={jobData} />
    </SidebarProvider>
  )
}
