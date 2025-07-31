'use client'
import { Separator } from './ui/separator'
import { SidebarTrigger } from './ui/sidebar'
import { usePathname } from 'next/navigation'

const ROUTE_TITLES: Record<string, string> = {
  '/': 'Dashboard',
  '/home': 'Home',
  '/jobs': 'Jobs',
  '/jobs/create': 'Create Job',
  '/jobs/pipelines': 'Job Pipelines',
  '/jobs/settings': 'Job Settings',
  '/templates': 'Templates',
  '/templates/create': 'Create Template',
  '/candidates': 'Candidates',
  '/documents': 'Documents',
  '/settings': 'Settings',
}

interface DashboardHeaderProps {
  overrideTitle?: string
  showSidebar?: boolean
}

export function DashboardHeader({ overrideTitle, showSidebar = true }: DashboardHeaderProps) {
  const pathname = usePathname()

  let title: string

  if (overrideTitle) {
    title = overrideTitle
  } else if (ROUTE_TITLES[pathname]) {
    title = ROUTE_TITLES[pathname]
  } else {
    const segments = pathname.split('/').filter(Boolean)

    if (segments.length > 0) {
      const lastSegment = segments[segments.length - 1]

      if (
        segments.length >= 3 &&
        segments[0] === 'jobs' &&
        segments[1] === 'create' &&
        /^[0-9a-fA-F-]+$/.test(lastSegment)
      ) {
        title = 'Create Job'
      } else if (
        segments.length >= 4 &&
        segments[0] === 'jobs' &&
        segments[1] === 'pipelines' &&
        segments[2] === 'edit' &&
        /^[0-9a-fA-F-]+$/.test(lastSegment)
      ) {
        title = 'Edit Pipeline'
      } else if (/^[0-9a-fA-F-]+$/.test(lastSegment)) {
        title = segments.length > 1 ? `${segments[segments.length - 2]} Details` : 'Details'
      } else {
        title = lastSegment
          .replace(/[-_]/g, ' ')
          .replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.slice(1).toLowerCase())
      }
    } else {
      title = 'Dashboard'
    }
  }

  return (
    <header className='group-has-data-[collapsible=icon]/sidebar-wrapper:h-12 flex h-12 shrink-0 items-center gap-2 border-b border-dashed transition-[width,height] ease-linear'>
      <div className='flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6'>
        {showSidebar && (
          <>
            <SidebarTrigger className='-ml-1' />
            <Separator orientation='vertical' className='mx-2 data-[orientation=vertical]:h-4' />
          </>
        )}
        <h1 className='text-base font-medium'>{title}</h1>
      </div>
    </header>
  )
}
