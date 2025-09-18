
import { OnboardingWorkExperienceForm } from '@/components/candidate/onboarding-work-experience-form'
import { createClient } from '@seeds/supabase/client/server'
import {
  getCandidateWorkExperiences,
  type CandidateWorkExperience,
} from '@seeds/supabase/queries' 
import { redirect } from 'next/navigation'

export default async function WorkExperienceOnboardingPage() {
  const supabase = await createClient() 

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    redirect('/login') 
  }

  let initialWorkExperienceData: CandidateWorkExperience[] = []

  try {
    
    const { data, error } = await getCandidateWorkExperiences(supabase, user.id)

    if (error) {
      console.error('Error fetching work experience data:', error.message)
      
    } else {
      initialWorkExperienceData = data || []
    }
  } catch (error) {
    console.error(
      'Exception fetching work experience data:',
      error instanceof Error ? error.message : 'Unknown error'
    )
    
  }

  return (
    <OnboardingWorkExperienceForm initialData={initialWorkExperienceData} />
  )
}
