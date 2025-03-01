'use client'

import { AppSidebar } from '@/components/left-sidebar'
import { RightAppSidebar } from '@/components/right-sidebar'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { Button } from '@/components/ui/button'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import { useBreakpoint } from '@/hooks/use-breakpoint'
import { BlockEditor } from '../components/editor/block-editor'

export default function Page() {
  const isMobile = useBreakpoint('lg', 'max')
  return (
    <>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <header className='flex h-16 shrink-0 items-center justify-between px-4'>
            <div className='flex items-center gap-2'>
              <Breadcrumb>
                <BreadcrumbList>
                  <BreadcrumbItem className='hidden md:block'>
                    <BreadcrumbLink href='#'>Home</BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator className='hidden md:block' />
                  <BreadcrumbItem>
                    <BreadcrumbPage>Create Job Posting</BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
            </div>
            <div className='flex items-center'>
              <Button variant='secondary'>Preview</Button>
            </div>
          </header>
          <BlockEditor />
        </SidebarInset>
        {!isMobile ? <RightAppSidebar side='right' /> : null}
      </SidebarProvider>
    </>
  )
}
