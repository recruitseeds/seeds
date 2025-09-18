import { getServerTRPCCaller, HydrateClient } from '@/trpc/server'
import { NotificationsForm } from './notification-form'

export async function NotificationsServer() {
  const caller = await getServerTRPCCaller()
  
  
  const settings = await caller.organization.getUserSettings().catch(() => null)
  
  return (
    <HydrateClient>
      <NotificationsForm initialSettings={settings} />
    </HydrateClient>
  )
}