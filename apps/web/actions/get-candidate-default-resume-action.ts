'use server'

import type { CandidateFile } from '@/supabase/queries'
import { getDefaultCandidateResume } from '@/supabase/queries'
import { authActionClient } from './safe-action'

export const getCandidateDefaultResumeAction = authActionClient
  .metadata({
    name: 'get-default-candidate-resume',
  })
  .action(
    async ({
      ctx,
    }): Promise<{
      success: boolean
      data?: CandidateFile | null
      error?: { code: string; message: string }
    }> => {
      const { user, supabase } = ctx

      console.log(
        `[Action: get-default-resume] Fetching default resume for User ID: ${user.id}`
      )

      try {
        const defaultResumeData = await getDefaultCandidateResume(
          supabase,
          user.id
        )

        if (defaultResumeData) {
          console.log(
            `[Action: get-default-resume] Default resume found for User ID: ${user.id}`
          )
          return { success: true, data: defaultResumeData }
        } else {
          console.log(
            `[Action: get-default-resume] No default resume found for User ID: ${user.id}`
          )
          return { success: true, data: null }
        }
      } catch (error: unknown) {
        let errorMessage = 'Failed to fetch default resume record.'
        if (error instanceof Error) errorMessage = error.message

        console.error(
          `[Action: get-default-resume] Catch block error for User ID: ${user.id}:`,
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
