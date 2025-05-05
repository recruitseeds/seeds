import { OnboardingStepClientWrapper } from '@/components/candidate/onboarding-step-client-wrapper'
import React from 'react'

const steps = [
  {
    id: 'personal',
    title: 'Personal Information',
    description: 'Tell us about yourself',
  },
  {
    id: 'education',
    title: 'Education',
    description: 'Your academic background',
  },
  {
    id: 'experience',
    title: 'Work Experience',
    description: 'Your professional history',
  },
  { id: 'files', title: 'Files', description: 'Upload your documents' },
  { id: 'complete', title: 'Complete', description: 'All done!' },
]

export default function CandidateOnboardingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className='container mx-auto max-w-3xl py-6 px-4 md:px-6'>
      <OnboardingStepClientWrapper steps={steps}>
        {children}
      </OnboardingStepClientWrapper>
    </div>
  )
}
