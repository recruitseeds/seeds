import type { PostgrestError, SupabaseClient } from '@supabase/supabase-js'
import type { Database, Tables } from '../types/db'

type Client = SupabaseClient<Database>
export type JobPosting = Tables<'job_postings'>

export async function getJobPostingById(
  supabase: Client,
  jobPostingId: string
): Promise<{
  data: JobPosting | null
  error: PostgrestError | null
}> {
  const { data, error } = await supabase.from('job_postings').select('*').eq('id', jobPostingId).single()

  if (error) {
    console.error(`Error fetching job posting ${jobPostingId}:`, error)
  }

  return { data, error }
}

export async function getJobPostingsByOrganization(
  supabase: Client,
  organizationId: string,
  page = 1,
  pageSize = 10,
  status?: string
): Promise<{
  data: JobPosting[] | null
  error: PostgrestError | null
  count: number | null
}> {
  const offset = (page - 1) * pageSize

  let query = supabase
    .from('job_postings')
    .select('*', { count: 'exact' })
    .eq('organization_id', organizationId)
    .order('created_at', { ascending: false })

  if (status) {
    query = query.eq('status', status)
  }

  query = query.range(offset, offset + pageSize - 1)

  const { data, error, count } = await query

  if (error) {
    console.error(`Error fetching job postings for organization ${organizationId}:`, error)
  }

  return { data, error, count }
}

export async function getJobPostingsByCreator(
  supabase: Client,
  creatorId: string
): Promise<{
  data: JobPosting[] | null
  error: PostgrestError | null
}> {
  const { data, error } = await supabase
    .from('job_postings')
    .select('*')
    .eq('created_by', creatorId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error(`Error fetching job postings for creator ${creatorId}:`, error)
  }

  return { data, error }
}

export async function getOrganizationUsers(
  supabase: Client,
  organizationId: string
): Promise<{
  data: Array<{ id: string; user_id: string; role: string }> | null
  error: PostgrestError | null
}> {
  const { data, error } = await supabase
    .from('organization_users')
    .select('id, user_id, role')
    .eq('organization_id', organizationId)
    .eq('status', 'active')
    .order('created_at', { ascending: true })

  if (error) {
    console.error(`Error fetching organization users for organization ${organizationId}:`, error)
  }

  return { data, error }
}
