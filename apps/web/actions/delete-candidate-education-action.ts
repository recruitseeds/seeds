
'use server'

import { deleteCandidateEducation } from '@seeds/supabase/mutations'
import { revalidateTag } from 'next/cache'
import { authActionClient } from './safe-action'
import { deleteCandidateEducationSchema } from './schema' 






export const deleteCandidateEducationAction = authActionClient
  .schema(deleteCandidateEducationSchema) 
  .metadata({
    name: 'delete-candidate-education',
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
      const { id: educationId } = parsedInput

      try {
        const { success: deleteSuccess, error: deleteError } =
          await deleteCandidateEducation(supabase, educationId, user.id)

        if (!deleteSuccess || deleteError) {
          const message =
            deleteError instanceof Error
              ? deleteError.message
              : 'Supabase mutation returned unsuccessful without a specific error.'
          throw new Error(message)
        }

        revalidateTag(`candidate_education_${user.id}`)
        return { success: true }
      } catch (error: unknown) {
        let errorMessage = 'Failed to delete education record.'
        const errorCode = 'DELETE_FAILED'
        if (error instanceof Error) errorMessage = error.message
        console.error(
          `[Action: delete-candidate-education] Failed for User ID: ${user.id}, Record ID: ${educationId}:`,
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
