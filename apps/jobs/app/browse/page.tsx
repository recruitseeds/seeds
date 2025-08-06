'use client'

import { Header } from '../../components/header'
import { JobsSection } from '../../components/jobs-section'
import { useState } from 'react'

export default function BrowsePage() {
  const [showAuthDialog, setShowAuthDialog] = useState(false)

  return (
    <div className='min-h-screen bg-background'>
      <Header />
      
      <main className='container mx-auto px-4 py-16'>
        <div className='mb-12 text-center'>
          <h1 className='text-4xl font-bold mb-4'>Browse All Jobs</h1>
          <p className='text-muted-foreground text-lg'>
            Discover opportunities from leading companies
          </p>
        </div>

        <JobsSection onAuthRequired={() => setShowAuthDialog(true)} />
      </main>
    </div>
  )
}