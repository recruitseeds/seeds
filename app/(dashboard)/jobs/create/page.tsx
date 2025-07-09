'use client'

import { JobProfileSheet } from '@/components/job-profile-sheet'
import { BlockEditor } from '@/components/ui/editor/block-editor'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import { useState } from 'react'

export default function Page() {
  const [jobData, setJobData] = useState(null)

  return (
    <SidebarProvider>
      <SidebarInset className='overflow-x-auto'>
        <div className='mb-20'>
          <BlockEditor jobData={jobData} />
        </div>
      </SidebarInset>
      <JobProfileSheet onJobDataChange={setJobData} jobData={jobData} />
    </SidebarProvider>
  )
}
