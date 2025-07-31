// src/app/(candidate)/candidate-onboarding/experience/page.tsx
import { OnboardingWorkExperienceForm } from '@/components/candidate/onboarding-work-experience-form'
import { createClient } from '@seeds/supabase/client/server'
import {
  getCandidateWorkExperiences,
  type CandidateWorkExperience,
} from '@seeds/supabase/queries' // Ensure CandidateWorkExperience is exported
import { redirect } from 'next/navigation'

export default async function WorkExperienceOnboardingPage() {
  const supabase = await createClient() // Using server client for RSC

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    redirect('/login') // Or your desired login page
  }

  let initialWorkExperienceData: CandidateWorkExperience[] = []

  try {
    // Fetch directly using your query function
    const { data, error } = await getCandidateWorkExperiences(supabase, user.id)

    if (error) {
      console.error('Error fetching work experience data:', error.message)
      // Optionally, you could throw an error here or pass an error state to the form
    } else {
      initialWorkExperienceData = data || []
    }
  } catch (error) {
    console.error(
      'Exception fetching work experience data:',
      error instanceof Error ? error.message : 'Unknown error'
    )
    // Handle this case, perhaps by showing an error message in the UI
  }

  return (
    <OnboardingWorkExperienceForm initialData={initialWorkExperienceData} />
  )
}
