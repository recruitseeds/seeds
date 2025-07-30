'use server'

import { deleteCandidateWorkExperience } from '@/supabase/mutations'
import { revalidateTag } from 'next/cache'
import { authActionClient } from './safe-action'
import { deleteCandidateWorkExperienceSchema } from './schema'

export const deleteCandidateWorkExperienceAction = authActionClient
  .schema(deleteCandidateWorkExperienceSchema)
  .metadata({
    name: 'delete-candidate-work-experience',
  })
  .action(
    async ({
      ctx,
      parsedInput,
    }): Promise<{
      success: boolean
      error?: { code: string; message: string }
    }> => {
      const { user, supabase } = ctx
      const { id } = parsedInput

      try {
        const { success: deleteSuccess, error: deleteError } =
          await deleteCandidateWorkExperience(supabase, id, user.id)

        if (!deleteSuccess || deleteError) {
          throw (
            deleteError ||
            new Error('Supabase mutation returned unsuccessful without error.')
          )
        }
        revalidateTag(`candidate_work_experiences_${user.id}`)
        return { success: true }
      } catch (error: unknown) {
        let errorMessage = 'Failed to delete work experience record.'
        const errorCode = 'DELETE_FAILED'
        if (error instanceof Error) errorMessage = error.message
        console.error(
          `[Action: delete-candidate-work-experience] Failed for User ID: ${user.id}, Record ID: ${id}:`,
          errorMessage,
          error
        )
        return {
          success: false,
          error: { code: errorCode, message: errorMessage },
        }
      }
    }
  )
