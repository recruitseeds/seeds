import { getServerTRPCCaller, HydrateClient } from '@/trpc/server'
import { AppearanceForm } from './appearance-form'

export async function AppearanceServer() {
  const caller = await getServerTRPCCaller()
  
  
  const settings = await caller.organization.getUserSettings().catch(() => null)
  
  return (
    <HydrateClient>
      <AppearanceForm initialSettings={settings} />
    </HydrateClient>
  )
}