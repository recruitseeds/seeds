'use client'

import { BlockEditor } from '@/components/editor/block-editor'
import { JobProfileSheet } from '@/components/job-profile-sheet'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'

export default function Page() {
  return (
    <SidebarProvider>
      <SidebarInset>
        <BlockEditor />
      </SidebarInset>
      <JobProfileSheet />
    </SidebarProvider>
  )
}
