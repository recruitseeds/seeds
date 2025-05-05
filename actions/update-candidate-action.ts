'use server'

import { revalidatePath as nextRevalidatePath, revalidateTag } from 'next/cache'
import { authActionClient } from './safe-action'
import { updateCandidateProfileSchema } from './schema'

export const updateCandidateProfileAction = authActionClient
  .schema(updateCandidateProfileSchema)
  .metadata({
    name: 'update-candidate-profile',
  })
  .action(async ({ ctx, parsedInput }) => {
    const { user, supabase } = ctx

    if (!parsedInput) {
      console.error(
        `[Action: update-candidate] Input data is missing for User ID: ${user.id}`
      )
      return {
        success: false,
        error: { code: 'INPUT_ERROR', message: 'Input data is missing.' },
      }
    }

    try {
      console.log(
        `[Action: update-candidate] Updating profile for User ID: ${user.id}`
      )

      await supabase
        .from('candidate_profiles')
        .update({
          first_name: parsedInput.firstName,
          last_name: parsedInput.lastName,
          job_title: parsedInput.jobTitle ?? null,
          location: parsedInput.location,
          phone_number: parsedInput.phone ?? null,
          personal_website_url: parsedInput.website || null,
          linkedin_url: parsedInput.linkedin || null,
          github_url: parsedInput.github || null,
          twitter_url: parsedInput.twitter || null,
          bio: parsedInput.bio ?? null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id)
        .throwOnError()

      console.log(
        `[Action: update-candidate] Profile updated successfully for User ID: ${user.id}`
      )

      revalidateTag(`candidate_profile_${user.id}`)
      if (parsedInput.revalidatePath) {
        console.log(
          `[Action: update-candidate-profile] Revalidating path: ${parsedInput.revalidatePath}`
        )
        nextRevalidatePath(parsedInput.revalidatePath)
      }

      return {
        success: true,
        data: { message: 'Profile updated successfully' },
      }
    } catch (error: unknown) {
      let errorMessage = 'Failed to update profile.'
      if (error instanceof Error) {
        errorMessage = error.message
      }
      console.error(
        `[Action: update-candidate] Failed to update profile for User ID: ${user.id}:`,
        errorMessage
      )
      return {
        success: false,
        error: {
          code: 'UPDATE_FAILED',
          message: errorMessage,
        },
      }
    }
  })
