import { getServerTRPCCaller, HydrateClient } from '@/trpc/server'
import { NotificationsForm } from './notification-form'

export async function NotificationsServer() {
  const caller = await getServerTRPCCaller()
  
  // Fetch user settings server-side
  const settings = await caller.organization.getUserSettings().catch(() => null)
  
  return (
    <HydrateClient>
      <NotificationsForm initialSettings={settings} />
    </HydrateClient>
  )
}