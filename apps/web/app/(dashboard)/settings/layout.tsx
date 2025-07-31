import type { Metadata } from 'next'

import { SidebarNav } from '@/components/settings/sidebar-nav'

export const metadata: Metadata = {
  title: 'Settings',
  description: 'Manage your account settings and preferences',
}

const sidebarNavItems = [
  {
    title: 'Profile',
    href: '/settings/profile',
  },
  {
    title: 'Account',
    href: '/settings/account',
  },
  {
    title: 'Appearance',
    href: '/settings/appearance',
  },
  {
    title: 'Notifications',
    href: '/settings/notifications',
  },
]

interface SettingsLayoutProps {
  children: React.ReactNode
}

export default function SettingsLayout({ children }: SettingsLayoutProps) {
  return (
    <div className='space-y-6 px-10 pb-16 mb-6 md:block'>
      <div className='flex flex-col space-y-8 lg:flex-row lg:space-x-12 lg:space-y-0 my-6'>
        <aside className='lg:w-1/5'>
          <SidebarNav items={sidebarNavItems} />
        </aside>
        <div className='flex-1 lg:max-w-2xl'>{children}</div>
      </div>
    </div>
  )
}
