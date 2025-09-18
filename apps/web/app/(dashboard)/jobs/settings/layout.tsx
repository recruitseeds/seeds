






































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
