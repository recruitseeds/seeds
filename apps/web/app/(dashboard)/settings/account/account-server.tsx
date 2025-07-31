import { getServerTRPCCaller, HydrateClient } from '@/trpc/server'
import { AccountForm } from './account-form'

export async function AccountServer() {
  const caller = await getServerTRPCCaller()
  
  // Fetch user settings server-side
  const settings = await caller.organization.getUserSettings().catch(() => null)
  
  return (
    <HydrateClient>
      <AccountForm initialSettings={settings} />
    </HydrateClient>
  )
}