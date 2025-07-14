'use client'

import { JobProfileSheet } from '@/components/job-profile-sheet'
import { BlockEditor } from '@/components/ui/editor/block-editor'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import type { Json } from '@/supabase/types/db'
import { useState } from 'react'

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
          />
        </div>
      </SidebarInset>
      <JobProfileSheet onJobDataChange={setJobData} jobData={jobData} isEditing={true} />
    </SidebarProvider>
  )
}
