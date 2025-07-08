'use client'

import { BlockEditor } from '@/components/editor/block-editor'
import { JobProfileSheet } from '@/components/job-profile-sheet'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import { useBlockEditor } from '@/hooks/use-editor'
import { useState } from 'react'

export default function Page() {
  const { editor } = useBlockEditor()
  const [jobData, setJobData] = useState(null)

  return (
    <SidebarProvider>
      <SidebarInset>
        <BlockEditor editor={editor} jobData={jobData} />
      </SidebarInset>
      <JobProfileSheet editor={editor} onJobDataChange={setJobData} jobData={jobData} />
    </SidebarProvider>
  )
}
