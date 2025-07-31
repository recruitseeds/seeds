import { getServerTRPCCaller, HydrateClient } from '@/trpc/server'
import { AppearanceForm } from './appearance-form'

export async function AppearanceServer() {
  const caller = await getServerTRPCCaller()
  
  // Fetch user settings server-side
  const settings = await caller.organization.getUserSettings().catch(() => null)
  
  return (
    <HydrateClient>
      <AppearanceForm initialSettings={settings} />
    </HydrateClient>
  )
}