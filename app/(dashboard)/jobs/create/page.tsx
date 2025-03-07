'use client'

import { BlockEditor } from '@/components/editor/block-editor'
import { RightAppSidebar } from '@/components/right-sidebar'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'

export default function Page() {
  return (
    <SidebarProvider>
      <SidebarInset>
        <BlockEditor />
      </SidebarInset>
      <aside className='hidden lg:flex'>
        <RightAppSidebar side='right' />
      </aside>
    </SidebarProvider>
  )
}
