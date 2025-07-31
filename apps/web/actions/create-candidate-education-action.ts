'use server'

import { createCandidateEducation } from '@seeds/supabase/mutations'
import { CandidateEducation } from '@seeds/supabase/queries'
import type { TablesInsert } from '@seeds/supabase/types/db'
import { revalidateTag } from 'next/cache'
import { authActionClient } from './safe-action'
import { createCandidateEducationSchema } from './schema'

export const createCandidateEducationAction = authActionClient
  .schema(createCandidateEducationSchema)
  .metadata({
    name: 'create-candidate-education',
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

      let descriptionValue = parsedInput.description
      if (
        typeof descriptionValue === 'string' &&
        descriptionValue.trim() !== ''
      ) {
        try {
          JSON.parse(descriptionValue)
        } catch {
          descriptionValue = { text: descriptionValue }
        }
      } else if (descriptionValue === '') {
        descriptionValue = null
      }

      const createParams: TablesInsert<'candidate_education'> = {
        ...parsedInput,
        description: descriptionValue,
        candidate_id: user.id,
      }

      if (createParams.location === '') createParams.location = null
      if (createParams.end_date === '') createParams.end_date = null

      try {
        console.log(
          `[Action: create-candidate-education] Creating education for User ID: ${user.id} with params:`,
          JSON.stringify(createParams)
        )

        const newEducationRecord = await createCandidateEducation(
          supabase,
          createParams
        )

        console.log(
          `[Action: create-candidate-education] Education created successfully with ID ${newEducationRecord.id} for User ID: ${user.id}`
        )

        revalidateTag(`candidate_education_${user.id}`)

        return { success: true, data: newEducationRecord }
      } catch (error: unknown) {
        let errorMessage = 'Failed to create education record.'
        const errorCode = 'CREATE_FAILED'

        if (error instanceof Error) {
          errorMessage = error.message
          console.error(
            `[Action: create-candidate-education] Error object:`,
            error
          )
        }

        console.error(
          `[Action: create-candidate-education] Failed for User ID: ${user.id}:`,
          errorMessage
        )

        return {
          success: false,
          error: { code: errorCode, message: errorMessage },
        }
      }
    }
  )
