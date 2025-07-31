'use server'

import { getCandidateProfile } from '@seeds/supabase/queries'
import { authActionClient } from './safe-action'

import type { Database } from '@seeds/supabase/types/db'
type CandidateProfile =
  Database['public']['Tables']['candidate_profiles']['Row']

export const getCandidateProfileAction = authActionClient
  .metadata({
    name: 'get-candidate-profile',
  })
  .action(async ({ ctx }): Promise<CandidateProfile | null> => {
    const { user, supabase } = ctx

    console.log(
      `[Action: get-candidate-profile] Attempting to fetch profile for User ID: ${user.id}`
    )

    try {
      const profile = await getCandidateProfile(supabase, user.id)

      console.log(
        `[Action: get-candidate-profile] Successfully fetched profile for User ID: ${user.id}`
      )
      return profile.data
    } catch (error) {
      console.error(
        `[Action: get-candidate-profile] Failed to fetch profile for User ID: ${user.id}:`,
        error instanceof Error ? error.message : String(error)
      )
      return null
    }
  })
