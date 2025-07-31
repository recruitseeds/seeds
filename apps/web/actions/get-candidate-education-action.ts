'use server'

import {
  type CandidateEducation,
  getCandidateEducation,
} from '@seeds/supabase/queries'
import { authActionClient } from './safe-action'

export const getCandidateEducationAction = authActionClient
  .metadata({
    name: 'get-candidate-education',
  })
  .action(
    async ({
      ctx,
    }): Promise<{
      success: boolean
      data?: CandidateEducation[]
      error?: { code: string; message: string }
    }> => {
      console.log('[Action: get-candidate-education] ENTERING', ctx)

      if (!ctx.user || !ctx.user.id) {
        return {
          success: false,
          error: {
            code: 'AUTH_REQUIRED',
            message: 'User authentication required',
          },
        }
      }

      try {
        const { user, supabase } = ctx

        const { data, error: queryError } = await getCandidateEducation(
          supabase,
          user.id
        )

        if (queryError) {
          return {
            success: false,
            error: {
              code: 'QUERY_ERROR',
              message: queryError.message,
            },
          }
        }

        return { success: true, data: data || [] }
      } catch (error: unknown) {
        let errorMessage = 'Failed to fetch education records.'

        if (error instanceof Error) {
          errorMessage = error.message
        } else if (typeof error === 'string') {
          errorMessage = error
        }

        return {
          success: false,
          error: { code: 'FETCH_FAILED', message: errorMessage },
        }
      }
    }
  )
