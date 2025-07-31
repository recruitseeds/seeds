import { Separator } from '@/components/ui/separator'
import { AccountServer } from './account-server'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Account Settings',
  description: 'Manage your account preferences',
}

export default function SettingsAccountPage() {
  return (
    <div className='space-y-6'>
      <div>
        <h3 className='text-lg font-medium'>Account</h3>
        <p className='text-sm text-muted-foreground'>
          Update your account settings. Set your preferred language and
          timezone.
        </p>
      </div>
      <Separator />
      <AccountServer />
    </div>
  )
}
