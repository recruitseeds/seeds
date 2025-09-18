
'use server'

import { updateCandidateEducation } from '@seeds/supabase/mutations'
import { CandidateEducation } from '@seeds/supabase/queries'
import { revalidateTag } from 'next/cache'
import { authActionClient } from './safe-action'
import { updateCandidateEducationSchema } from './schema'

export const updateCandidateEducationAction = authActionClient
  .schema(updateCandidateEducationSchema)
  .metadata({
    name: 'update-candidate-education',
  })
  .action(
    async ({
      ctx,
      parsedInput,
    }): Promise<{
      success: boolean
      data?: CandidateEducation
      error?: { code: string; message: string }
    }> => {
      const { user, supabase } = ctx
      const { id, ...updateFields } = parsedInput

      
      const formattedFields = { ...updateFields }

      
      if (
        formattedFields.start_date &&
        formattedFields.start_date.length === 7
      ) {
        formattedFields.start_date = `${formattedFields.start_date}-01`
      }

      
      if (formattedFields.end_date && formattedFields.end_date.length === 7) {
        formattedFields.end_date = `${formattedFields.end_date}-01`
      }

      
      if (
        typeof formattedFields.description === 'string' &&
        formattedFields.description.trim() !== ''
      ) {
        try {
          
          JSON.parse(formattedFields.description)
        } catch {
          
          formattedFields.description = { text: formattedFields.description }
        }
      }

      try {
        console.log(
          `[Action: update-candidate-education] Updating education ID: ${id} for User ID: ${user.id} with fields:`,
          formattedFields
        )

        const updatedEducationRecord = await updateCandidateEducation(
          supabase,
          user.id,
          {
            id,
            ...formattedFields,
          }
        )

        console.log(
          `[Action: update-candidate-education] Education updated successfully with ID ${id} for User ID: ${user.id}`
        )

        revalidateTag(`candidate_education_${user.id}`)

        return { success: true, data: updatedEducationRecord }
      } catch (error: unknown) {
        let errorMessage = 'Failed to update education record.'
        const errorCode = 'UPDATE_FAILED'
        if (error instanceof Error) errorMessage = error.message
        console.error(
          `[Action: update-candidate-education] Failed for User ID: ${user.id}, Education ID: ${id}:`,
          errorMessage
        )
        return {
          success: false,
          error: { code: errorCode, message: errorMessage },
        }
      }
    }
  )
