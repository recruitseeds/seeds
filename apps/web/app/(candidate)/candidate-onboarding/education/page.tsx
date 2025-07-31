import { OnboardingEducationForm } from '@/components/candidate/onboarding-education-form'
import { createClient } from '@seeds/supabase/client/server'
import {
  type CandidateEducation,
  getCandidateEducation,
} from '@seeds/supabase/queries'
import { redirect } from 'next/navigation'

export default async function EducationOnboardingPage() {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    redirect('/login')
  }

  let initialEducationData: CandidateEducation[] = []

  try {
    const { data, error } = await getCandidateEducation(supabase, user.id)

    if (error) {
      console.error('Error fetching education data:', error.message)
    } else {
      initialEducationData = data || []
    }
  } catch (error) {
    console.error(
      'Exception fetching education data:',
      error instanceof Error ? error.message : 'Unknown error'
    )
  }

  return <OnboardingEducationForm initialData={initialEducationData} />
}
