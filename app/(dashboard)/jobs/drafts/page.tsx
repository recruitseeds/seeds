import { DraftsPage } from '@/components/drafts/drafts'
import { HydrateClient, getServerTRPCCaller } from '@/trpc/server'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Draft Job Postings | Seeds',
}

export default async function DraftsServerPage() {
  const caller = await getServerTRPCCaller()

  const draftsData = await caller.organization.listJobPostings({
    status: 'draft',
    page: 1,
    pageSize: 50,
  })

  return (
    <HydrateClient>
      <DraftsPage initialDraftsData={draftsData} />
    </HydrateClient>
  )
}
