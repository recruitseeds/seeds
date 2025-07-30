'use server'

import { createCandidateWorkExperience } from '@/supabase/mutations'
import type { CandidateWorkExperience } from '@/supabase/queries'
import type { TablesInsert } from '@/supabase/types/db'
import { revalidateTag } from 'next/cache'
import { authActionClient } from './safe-action'
import { createCandidateWorkExperienceSchema } from './schema'

export const createCandidateWorkExperienceAction = authActionClient
  .schema(createCandidateWorkExperienceSchema)
  .metadata({
    name: 'create-candidate-work-experience',
  })
  .action(
    async ({
      ctx,
      parsedInput,
    }): Promise<{
      success: boolean
      data?: CandidateWorkExperience
      error?: { code: string; message: string }
    }> => {
      const { user, supabase } = ctx

      let finalDescription = parsedInput.description
      if (typeof parsedInput.description === 'string') {
        if (parsedInput.description.trim() === '') {
          finalDescription = null
        } else {
          try {
            JSON.parse(parsedInput.description)
          } catch (e) {
            finalDescription = { text: parsedInput.description }
          }
        }
      }

      const isCurrentJob =
        parsedInput.is_current ??
        (parsedInput.end_date?.toUpperCase() === 'PRESENT' ||
          !parsedInput.end_date)

      const createParams: TablesInsert<'candidate_work_experiences'> = {
        candidate_id: user.id,
        job_title: parsedInput.job_title,
        company_name: parsedInput.company_name,
        location: parsedInput.location === '' ? null : parsedInput.location,
        start_date: parsedInput.start_date,
        end_date:
          parsedInput.end_date?.toUpperCase() === 'PRESENT' ||
          parsedInput.end_date === ''
            ? null
            : parsedInput.end_date,
        is_current: isCurrentJob,
        description: finalDescription,
      }

      try {
        const newRecord = await createCandidateWorkExperience(
          supabase,
          createParams
        )
        revalidateTag(`candidate_work_experiences_${user.id}`)
        return { success: true, data: newRecord }
      } catch (error: unknown) {
        let errorMessage = 'Failed to create work experience record.'
        const errorCode = 'CREATE_FAILED'
        if (error instanceof Error) errorMessage = error.message
        console.error(
          `[Action: create-candidate-work-experience] Failed for User ID: ${user.id}:`,
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
