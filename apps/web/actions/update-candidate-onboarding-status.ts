'use server'

import type { CandidateProfile } from '@/supabase/mutations' // Import CandidateProfile type
import { updateCandidateProfile } from '@/supabase/mutations'
import { revalidateTag } from 'next/cache'
// import { redirect } from 'next/navigation' // No longer redirecting from action
import { z } from 'zod' // Import Zod
// import type { ActionResponse } from './actions' // Removed potentially problematic import
import { authActionClient } from './safe-action'

// Define the input schema
const schema = z.object({
  isOnboarded: z.boolean(),
})

export const updateCandidateOnboardingStatusAction = authActionClient
  .schema(schema) // Use the schema
  .metadata({
    name: 'update-candidate-onboarding-status',
  })
  .action(
    async ({
      ctx,
      parsedInput,
    }): Promise<{
      // Define return type explicitly
      success: boolean
      data?: CandidateProfile
      error?: { code: string; message: string }
    }> => {
      const { user, supabase } = ctx
      const { isOnboarded } = parsedInput // Get isOnboarded from parsedInput

      console.log(
        `[Action: update-onboarding-status] User ID: ${user.id}, isOnboarded: ${isOnboarded}`
      )

      try {
        const updatedProfile = await updateCandidateProfile(supabase, {
          id: user.id,
          is_onboarded: isOnboarded, // Use the input value
        })

        console.log(
          `[Action: update-onboarding-status] Onboarding status updated:`,
          updatedProfile
        )

        revalidateTag(`candidate_profile_${user.id}`)
        return { success: true, data: updatedProfile } // Return success
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : String(error)
        console.error(
          '[Action: update-onboarding-status] Failed to update status:',
          errorMessage
        )
        // Instead of throwing, return an error object
        return {
          success: false,
          error: { code: 'UPDATE_FAILED', message: errorMessage },
        }
      }

      // redirect('/candidate/profile') // Remove redirect
    }
  )
