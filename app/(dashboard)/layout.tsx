'use client'

import { DashboardHeader } from '@/components/dashboard-header'
import { AppSidebar } from '@/components/left-sidebar'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className='overflow-x-hidden'>
        <DashboardHeader />
        {children}
      </SidebarInset>
    </SidebarProvider>
  )
}
