'use server'

import {
  getCandidateWorkExperiences,
  type CandidateWorkExperience,
} from '@seeds/supabase/queries'
import { authActionClient } from './safe-action'

export const getCandidateWorkExperiencesAction = authActionClient
  .metadata({
    name: 'get-candidate-work-experiences',
  })
  .action(
    async ({
      ctx,
    }): Promise<{
      success: boolean
      data?: CandidateWorkExperience[]
      error?: { code: string; message: string }
    }> => {
      const { user, supabase } = ctx

      console.log(
        `[Action: get-candidate-work-experiences] Fetching for User ID: ${user.id}`
      )

      try {
        const { data, error: queryError } = await getCandidateWorkExperiences(
          supabase,
          user.id
        )

        if (queryError) {
          console.error(
            `[Action: get-candidate-work-experiences] Query error for User ID: ${user.id}:`,
            queryError.message
          )
          return {
            success: false,
            error: {
              code: 'QUERY_ERROR',
              message: queryError.message,
            },
          }
        }

        console.log(
          `[Action: get-candidate-work-experiences] Successfully fetched ${
            data?.length || 0
          } records for User ID: ${user.id}`
        )
        return { success: true, data: data || [] }
      } catch (error: unknown) {
        let errorMessage = 'Failed to fetch work experience records.'
        if (error instanceof Error) errorMessage = error.message

        console.error(
          `[Action: get-candidate-work-experiences] Catch block error for User ID: ${user.id}:`,
          errorMessage,
          error
        )
        return {
          success: false,
          error: { code: 'FETCH_FAILED', message: errorMessage },
        }
      }
    }
  )
