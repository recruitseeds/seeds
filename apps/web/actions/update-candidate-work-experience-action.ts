'use server'

import { updateCandidateWorkExperience } from '@seeds/supabase/mutations' 
import type {
  CandidateWorkExperience,
  UpdateCandidateWorkExperienceParams, 
} from '@seeds/supabase/queries' 
import type { TablesUpdate } from '@seeds/supabase/types/db' 
import { revalidateTag } from 'next/cache'
import { authActionClient } from './safe-action' 
import { updateCandidateWorkExperienceSchema } from './schema' 


interface WorkExperienceUpdatePayload
  extends Omit<
    TablesUpdate<'candidate_work_experiences'>,
    'id' | 'candidate_id' | 'created_at' | 'updated_at'
  > {
  
  
}

export const updateCandidateWorkExperienceAction = authActionClient
  .schema(updateCandidateWorkExperienceSchema)
  .metadata({
    name: 'update-candidate-work-experience',
  })
  .action(
    async ({
      ctx,
      parsedInput,
    }): Promise<{
      success: boolean
      data?: CandidateWorkExperience
      error?: { code: string; message: string; details?: any }
    }> => {
      const { user, supabase } = ctx
      const { id, ...updateFieldsFromSchema } = parsedInput
      let actionReturnValue: {
        success: boolean
        data?: CandidateWorkExperience
        error?: { code: string; message: string; details?: any }
      }

      console.log(
        `[Action: update-candidate-work-experience] STARTING. User ID: ${user.id}, Record ID: ${id}, Parsed Input:`,
        JSON.stringify(updateFieldsFromSchema, null, 2)
      )

      const finalUpdateFields: Partial<WorkExperienceUpdatePayload> = {}

      if (updateFieldsFromSchema.job_title !== undefined) {
        finalUpdateFields.job_title = updateFieldsFromSchema.job_title
      }
      if (updateFieldsFromSchema.company_name !== undefined) {
        finalUpdateFields.company_name = updateFieldsFromSchema.company_name
      }
      if (updateFieldsFromSchema.location !== undefined) {
        finalUpdateFields.location =
          updateFieldsFromSchema.location === ''
            ? null
            : updateFieldsFromSchema.location
      }
      if (updateFieldsFromSchema.start_date !== undefined) {
        finalUpdateFields.start_date = updateFieldsFromSchema.start_date
      }

      if (updateFieldsFromSchema.description !== undefined) {
        if (typeof updateFieldsFromSchema.description === 'string') {
          if (updateFieldsFromSchema.description.trim() === '') {
            finalUpdateFields.description = null
          } else {
            try {
              
              JSON.parse(updateFieldsFromSchema.description)
              finalUpdateFields.description = updateFieldsFromSchema.description
            } catch {
              
              finalUpdateFields.description = {
                text: updateFieldsFromSchema.description,
              }
              
              
            }
          }
        } else {
          finalUpdateFields.description = updateFieldsFromSchema.description
        }
      }

      if (updateFieldsFromSchema.is_current === true) {
        finalUpdateFields.is_current = true
        finalUpdateFields.end_date = null
      } else if (updateFieldsFromSchema.end_date !== undefined) {
        if (
          updateFieldsFromSchema.end_date === null ||
          updateFieldsFromSchema.end_date.toUpperCase() === 'PRESENT' ||
          updateFieldsFromSchema.end_date === ''
        ) {
          finalUpdateFields.end_date = null
          if (updateFieldsFromSchema.is_current !== false) {
            finalUpdateFields.is_current = true
          } else {
            finalUpdateFields.is_current = false
          }
        } else {
          finalUpdateFields.end_date = updateFieldsFromSchema.end_date
          finalUpdateFields.is_current = false
        }
      } else if (updateFieldsFromSchema.is_current === false) {
        finalUpdateFields.is_current = false
        
      }
      

      console.log(
        `[Action: update-candidate-work-experience] Processed finalUpdateFields for ID ${id}:`,
        JSON.stringify(finalUpdateFields, null, 2)
      )

      try {
        if (Object.keys(finalUpdateFields).length === 0) {
          console.warn(
            `[Action: update-candidate-work-experience] No actual changes to apply for ID ${id} after processing input.`
          )
          try {
            const { data: existingData, error: fetchError } = await supabase
              .from('candidate_work_experiences')
              .select('*')
              .eq('id', id)
              .eq('candidate_id', user.id)
              .single()

            if (fetchError) {
              throw fetchError 
            }

            if (existingData) {
              actionReturnValue = {
                success: true, 
                data: existingData as CandidateWorkExperience,
                
                
                
                
                
                error: {
                  
                  code: 'NO_CHANGES_NEEDED',
                  message: 'No fields to update, existing data returned.',
                },
              }
              console.log(
                '!!!!!! [Action: update-candidate-work-experience] FINAL RETURN VALUE (NO_CHANGES_NEEDED branch):',
                JSON.stringify(actionReturnValue, null, 2)
              )
              return actionReturnValue
            } else {
              
              throw new Error('No changes and existing record not found.')
            }
          } catch (errorInNoChangesBranch) {
            console.error(
              '[Action: update-candidate-work-experience] Error in NO_CHANGES_NEEDED branch while fetching existing record for ID ' +
                id +
                ':',
              errorInNoChangesBranch
            )
            actionReturnValue = {
              success: false,
              error: {
                code: 'NO_CHANGES_FETCH_FAILED',
                message:
                  errorInNoChangesBranch instanceof Error
                    ? errorInNoChangesBranch.message
                    : 'No updatable fields, and failed to fetch existing record.',
              },
            }
            console.log(
              '!!!!!! [Action: update-candidate-work-experience] FINAL RETURN VALUE (NO_CHANGES_FETCH_FAILED branch):',
              JSON.stringify(actionReturnValue, null, 2)
            )
            return actionReturnValue
          }
        }

        console.log(
          `[Action: update-candidate-work-experience] Calling mutation for record ID: ${id}, user ID: ${user.id}`
        )

        const mutationParams: UpdateCandidateWorkExperienceParams = {
          id,
          ...finalUpdateFields,
        } as UpdateCandidateWorkExperienceParams 

        const updatedRecord = await updateCandidateWorkExperience(
          supabase,
          user.id,
          mutationParams
        )

        console.log(
          `[Action: update-candidate-work-experience] Mutation returned:`,
          JSON.stringify(updatedRecord, null, 2)
        )

        if (!updatedRecord || typeof updatedRecord.id === 'undefined') {
          console.error(
            `[Action: update-candidate-work-experience] Mutation returned invalid or null data despite not throwing. Record:`,
            updatedRecord
          )
          actionReturnValue = {
            success: false,
            error: {
              code: 'MUTATION_INVALID_DATA_AFTER_SUCCESS',
              message:
                'Mutation seemed to succeed but returned malformed data.',
            },
          }
          console.log(
            '!!!!!! [Action: update-candidate-work-experience] FINAL RETURN VALUE (MUTATION_INVALID_DATA branch):',
            JSON.stringify(actionReturnValue, null, 2)
          )
          return actionReturnValue
        }

        revalidateTag(`candidate_work_experiences_${user.id}`)
        actionReturnValue = { success: true, data: updatedRecord }
        console.log(
          '!!!!!! [Action: update-candidate-work-experience] FINAL RETURN VALUE (SUCCESS branch):',
          JSON.stringify(actionReturnValue, null, 2)
        )
        return actionReturnValue
      } catch (error: unknown) {
        let errorMessage = 'An unexpected error occurred during update.'
        const errorCode = 'ACTION_TRY_CATCH_FAILURE'
        let errorDetails: any = undefined

        if (error instanceof Error) {
          errorMessage = error.message
          
          if ((error as any).details) errorDetails = (error as any).details
          if ((error as any).code)
            errorDetails = {
              ...(errorDetails || {}),
              pgCode: (error as any).code,
            }
        } else if (typeof error === 'string') {
          errorMessage = error
        }

        console.error(
          `[Action: update-candidate-work-experience] CAUGHT ERROR in main try-catch. User ID: ${user.id}, Record ID: ${id}: Message: "${errorMessage}"`,
          { errorObjectString: String(error), errorDetails }
        )
        actionReturnValue = {
          success: false,
          error: {
            code: errorCode,
            message: errorMessage,
            details: errorDetails,
          },
        }
        console.log(
          '!!!!!! [Action: update-candidate-work-experience] FINAL RETURN VALUE (CATCH branch):',
          JSON.stringify(actionReturnValue, null, 2)
        )
        return actionReturnValue
      }
    }
  )
