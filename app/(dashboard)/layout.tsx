'use client'

import { AppSidebar } from '@/components/left-sidebar'
import { RightAppSidebar } from '@/components/right-sidebar'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import { useBreakpoint } from '@/hooks/use-breakpoint'

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const isMobile = useBreakpoint('lg', 'max')
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>{children}</SidebarInset>
      {!isMobile ? <RightAppSidebar side='right' /> : null}
    </SidebarProvider>
  )
}
