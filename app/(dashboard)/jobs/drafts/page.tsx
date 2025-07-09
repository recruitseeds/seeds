import { DraftsPage } from '@/components/drafts/drafts'
import { HydrateClient, getServerTRPCCaller } from '@/trpc/server'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Draft Job Postings | Seeds',
}

export default async function DraftsServerPage() {
  const caller = await getServerTRPCCaller()

  // Fetch initial drafts data on the server
  const draftsData = await caller.organization.listJobPostings({
    status: 'draft',
    page: 1,
    pageSize: 50, // Get more since we're not paginating yet
  })

  return (
    <HydrateClient>
      <DraftsPage initialDraftsData={draftsData} />
    </HydrateClient>
  )
}
