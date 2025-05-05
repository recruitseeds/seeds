'use server'

import { updateCandidateProfile } from '@/supabase/mutations'
import { revalidateTag } from 'next/cache'
import { redirect } from 'next/navigation'
import { authActionClient } from './safe-action'

export const updateCandidateOnboardingStatusAction = authActionClient
  .metadata({
    name: 'update-candidate-onboarding-status',
  })

  .action(async ({ ctx }) => {
    const { user, supabase } = ctx

    console.log(`[Action: update-onboarding-status] User ID: ${user.id}`)

    try {
      const updatedProfile = await updateCandidateProfile(supabase, {
        id: user.id,
        is_onboarded: true,
      })

      console.log(
        `[Action: update-onboarding-status] Onboarding status updated:`,
        updatedProfile
      )

      revalidateTag(`candidate_profile_${user.id}`)
    } catch (error) {
      console.error(
        '[Action: update-onboarding-status] Failed to update status:',
        error
      )

      throw error instanceof Error ? error : new Error(String(error))
    }

    redirect('/candidate/profile')
  })
