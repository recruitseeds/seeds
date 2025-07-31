import { redirect } from 'next/navigation'

export default function SettingsPage() {
  // Redirect to profile page by default
  redirect('/settings/profile')
}
