import { getCandidateProfileAction } from '@/actions/get-candidate-profile-action'
import { PersonalInfoForm } from '@/components/candidate/onboarding-personal-form'
import { createClient } from '@/supabase/client/server'
import type { Database } from '@/supabase/types/db'
import { redirect } from 'next/navigation'

type CandidateProfile =
  Database['public']['Tables']['candidate_profiles']['Row']

export default async function PersonalInfoPage() {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    redirect('/login')
  }

  const userEmail = user.email
  if (!userEmail) {
    console.error('Authenticated user missing email address.')
    redirect('/login')
  }

  const actionResult = await getCandidateProfileAction()

  let initialProfileData: CandidateProfile | null = null
  if (actionResult?.data) {
    initialProfileData = actionResult.data
  } else if (actionResult?.serverError || actionResult?.validationErrors) {
    console.error(
      'Error fetching profile:',
      actionResult.serverError || actionResult.validationErrors
    )
  }

  return (
    <div className='container mx-auto max-w-3xl'>
      <h1 className='text-2xl font-semibold mb-6'>Personal Information</h1>
      <PersonalInfoForm
        initialData={initialProfileData}
        userEmail={userEmail}
      />
    </div>
  )
}
