import { CandidateProfile } from '@/components/candidate/candidate-profile'
import { HydrateClient, prefetch, trpc } from '@/trpc/server'
import type { Metadata } from 'next'
import { Suspense } from 'react'

export const metadata: Metadata = {
  title: 'Candidate Profile | Seeds',
}

function CandidateProfileLoading() {
  return <div className='p-6 text-center'>Loading profile sections...</div>
}

export default async function CandidateProfilePage() {
  try {
    await Promise.all([
      prefetch(trpc.candidate.getProfile.queryOptions(undefined)),
      prefetch(
        trpc.candidate.listApplications.queryOptions({
          page: 1,
          pageSize: 10,
        })
      ),
      prefetch(trpc.candidate.listWorkExperiences.queryOptions(undefined)),
      prefetch(trpc.candidate.listEducation.queryOptions(undefined)),
      prefetch(trpc.candidate.listSkills.queryOptions(undefined)),
      prefetch(trpc.candidate.listFiles.queryOptions(undefined)),
    ])
  } catch (error) {
    console.error('Error prefetching all profile data on server:', error)
  }

  return (
    <HydrateClient>
      <Suspense fallback={<CandidateProfileLoading />}>
        <CandidateProfile />
      </Suspense>
    </HydrateClient>
  )
}
