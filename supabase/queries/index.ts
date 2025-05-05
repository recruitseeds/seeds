import type { PostgrestError, SupabaseClient } from '@supabase/supabase-js'
import type { Database, Tables } from '../types/db'

type Client = SupabaseClient<Database>
export type CandidateEducation = Tables<'candidate_education'>

export async function getCandidateProfile(supabase: Client, userId: string) {
  return supabase
    .from('candidate_profiles')
    .select('*')
    .eq('id', userId)
    .single()
    .throwOnError()
}

type ApplicationFull =
  Database['public']['Tables']['candidate_applications']['Row']

type PaginatedApplicationsResult = {
  data: ApplicationFull[] | null
  count: number | null
  error: PostgrestError | Error | null
}

export async function getCandidateApplicationsPaginated(
  supabase: Client,
  userId: string,
  page: number = 1,
  pageSize: number = 10
): Promise<PaginatedApplicationsResult> {
  const rangeFrom = (page - 1) * pageSize
  const rangeTo = rangeFrom + pageSize - 1

  const { data, error, count } = await supabase
    .from('candidate_applications')
    .select(
      `
      id,
      candidate_id,
      job_title,
      company_name,
      company_logo_url,
      status,
      application_date,
      next_step_description,
      next_step_date,
      source,
      job_id,
      application_url,
      contact_person,
      contact_email,
      salary_range,
      created_at,
      updated_at
    `,
      { count: 'exact' }
    )
    .eq('candidate_id', userId)
    .order('application_date', { ascending: false })
    .range(rangeFrom, rangeTo)

  if (error) {
    console.error('Error fetching paginated applications: ', error)
    return { data: null, count: null, error: error }
  }
  return { data, count, error: null }
}

export async function getCandidateEducation(
  supabase: Client,
  candidateId: string
): Promise<{
  data: CandidateEducation[] | null
  error: PostgrestError | null
}> {
  const { data, error } = await supabase
    .from('candidate_education')
    .select('*')
    .eq('candidate_id', candidateId)
    .order('start_date', { ascending: false })

  if (error) {
    console.error(
      `Error fetching education for candidate ${candidateId}:`,
      error
    )
  }

  return { data, error }
}
