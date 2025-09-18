import { getServerTRPCCaller, HydrateClient } from '@/trpc/server'
import { ProfileForm } from './profile-form'

export async function ProfileServer() {
  const caller = await getServerTRPCCaller()
  
  
  const settings = await caller.organization.getUserSettings().catch(() => null)
  
  return (
    <HydrateClient>
      <ProfileForm initialSettings={settings} />
    </HydrateClient>
  )
}