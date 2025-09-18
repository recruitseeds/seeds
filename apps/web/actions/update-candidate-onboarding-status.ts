'use server'

import type { CandidateProfile } from '@seeds/supabase/mutations' 
import { updateCandidateProfile } from '@seeds/supabase/mutations'
import { revalidateTag } from 'next/cache'

import { z } from 'zod' 

import { authActionClient } from './safe-action'


const schema = z.object({
  isOnboarded: z.boolean(),
})

export const updateCandidateOnboardingStatusAction = authActionClient
  .schema(schema) 
  .metadata({
    name: 'update-candidate-onboarding-status',
  })
  .action(
    async ({
      ctx,
      parsedInput,
    }): Promise<{
      
      success: boolean
      data?: CandidateProfile
      error?: { code: string; message: string }
    }> => {
      const { user, supabase } = ctx
      const { isOnboarded } = parsedInput 

      console.log(
        `[Action: update-onboarding-status] User ID: ${user.id}, isOnboarded: ${isOnboarded}`
      )

      try {
        const updatedProfile = await updateCandidateProfile(supabase, {
          id: user.id,
          is_onboarded: isOnboarded, 
        })

        console.log(
          `[Action: update-onboarding-status] Onboarding status updated:`,
          updatedProfile
        )

        revalidateTag(`candidate_profile_${user.id}`)
        return { success: true, data: updatedProfile } 
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : String(error)
        console.error(
          '[Action: update-onboarding-status] Failed to update status:',
          errorMessage
        )
        
        return {
          success: false,
          error: { code: 'UPDATE_FAILED', message: errorMessage },
        }
      }

      
    }
  )
