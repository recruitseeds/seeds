'use client'

import { CandidateProfile } from '@/components/candidate/candidate-profile'
import { Suspense } from 'react'

function CandidateProfileLoading() {
  return <div>Loading profile...</div>
}

export default function Home() {
  return (
    <main>
      <Suspense fallback={<CandidateProfileLoading />}>
        <CandidateProfile />
      </Suspense>
    </main>
  )
}
