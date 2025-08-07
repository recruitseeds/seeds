// import { Container } from '@/components/container'
// import { SidebarNav } from '@/components/settings/sidebar-nav'

// const jobSettingsItems = [
//   {
//     title: 'General',
//     href: '/jobs/settings',
//   },
//   {
//     title: 'Location Templates',
//     href: '/jobs/settings/locations',
//   },
//   {
//     title: 'Pipeline Defaults',
//     href: '/jobs/settings/pipelines',
//   },
//   {
//     title: 'Email Templates',
//     href: '/jobs/settings/emails',
//   },
//   {
//     title: 'Application Form',
//     href: '/jobs/settings/application',
//   },
// ]

// export default function JobSettingsLayout({ children }: { children: React.ReactNode }) {
//   return (
//     <Container className='space-y-6 pb-16 mb-6 md:block py-6'>
//       <div className='flex flex-col space-y-8 lg:flex-row lg:space-x-12 lg:space-y-0'>
//         <aside className='lg:w-1/5'>
//           <SidebarNav items={jobSettingsItems} />
//         </aside>
//         <div className='flex-1 lg:max-w-4xl'>{children}</div>
//       </div>
//     </Container>
//   )
// }

import { CollapsibleIconNav } from './collapsible-icon-nav'

export default function JobSettingsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className='flex h-full'>
      <CollapsibleIconNav />
      <div className='flex-1 overflow-auto'>
        <div className='p-6 max-w-7xl mx-auto'>{children}</div>
      </div>
    </div>
  )
}
