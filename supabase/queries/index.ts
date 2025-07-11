import type { PostgrestError, SupabaseClient } from '@supabase/supabase-js'
import type { Database, Tables } from '../types/db'

type Client = SupabaseClient<Database>
export type CandidateEducation = Tables<'candidate_education'>

export async function getCandidateProfile(supabase: Client, userId: string) {
  return supabase.from('candidate_profiles').select('*').eq('id', userId).single().throwOnError()
}

export async function getCandidateApplicationsPaginated(
  client: SupabaseClient<Database>,
  candidateId: string,
  page: number,
  pageSize: number,
  searchCompanyName?: string,
  status?: Database['public']['Enums']['candidate_application_status']
) {
  const offset = (page - 1) * pageSize

  let query = client
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
      next_steps,
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
    .eq('candidate_id', candidateId)
    .order('application_date', { ascending: false })

  if (searchCompanyName && searchCompanyName.trim() !== '') {
    query = query.ilike('company_name', `%${searchCompanyName.trim()}%`)
  }

  if (status) {
    query = query.eq('status', status)
  }

  query = query.range(offset, offset + pageSize - 1)

  const { data, error, count } = await query

  // Add debug logging
  if (data) {
    console.log('Query result - first application next_steps:', data[0]?.next_steps)
  }

  return { data, error, count }
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
    .order('end_date', { ascending: false, nullsFirst: true })
    .order('start_date', { ascending: false })

  if (error) {
    console.error(`Error fetching education for candidate ${candidateId}:`, error)
  }

  return { data, error }
}

export type CandidateWorkExperience = Tables<'candidate_work_experiences'>

export async function getCandidateWorkExperiences(
  supabase: Client,
  candidateId: string
): Promise<{
  data: CandidateWorkExperience[] | null
  error: PostgrestError | null
}> {
  const { data, error } = await supabase
    .from('candidate_work_experiences')
    .select('*')
    .eq('candidate_id', candidateId)
    .order('end_date', { ascending: false, nullsFirst: true })
    .order('start_date', { ascending: false })

  if (error) {
    console.error(`Error fetching work experiences for candidate ${candidateId}:`, error)
  }
  return { data, error }
}

export async function getCandidateWorkExperienceById(
  supabase: Client,
  workExperienceId: string,
  candidateId: string
): Promise<{
  data: CandidateWorkExperience | null
  error: PostgrestError | null
}> {
  const { data, error } = await supabase
    .from('candidate_work_experiences')
    .select('*')
    .eq('id', workExperienceId)
    .eq('candidate_id', candidateId)
    .single()

  if (error) {
    console.error(`Error fetching work experience ${workExperienceId} for candidate ${candidateId}:`, error)
  }
  return { data, error }
}

export type CandidateFile = Tables<'candidate_files'>

export async function getDefaultCandidateResume(supabase: Client, userId: string): Promise<CandidateFile | null> {
  console.log(`[Query] Fetching default resume for user: ${userId}`)
  const { data, error } = await supabase
    .from('candidate_files')
    .select('*')
    .eq('candidate_id', userId)
    .eq('file_type', 'resume')
    .eq('is_default_resume', true)
    .maybeSingle()

  if (error) {
    console.error(`[Query] Error fetching default resume for user ${userId}:`, error)
    return null
  }

  if (!data) {
    console.log(`[Query] No default resume found for user ${userId}.`)
    return null
  }

  console.log(`[Query] Default resume found for user ${userId}: ID ${data.id}`)
  return data
}

export async function getCandidateEducationByCandidateId(
  supabase: Client,
  candidateId: string
): Promise<CandidateEducation[]> {
  const { data, error } = await supabase.from('candidate_education').select('*').eq('candidate_id', candidateId)

  if (error) {
    console.error('Error fetching candidate education records:', error)
    return []
  }
  return data || []
}

export async function getCandidateWorkExperienceByCandidateId(
  supabase: Client,
  candidateId: string
): Promise<CandidateWorkExperience[]> {
  const { data, error } = await supabase.from('candidate_work_experiences').select('*').eq('candidate_id', candidateId)

  if (error) {
    console.error('Error fetching candidate work experience records:', error)
    return []
  }
  return data || []
}

export async function getCandidateFilesByCandidateId(
  supabase: SupabaseClient<Database>,
  candidateId: string
): Promise<Tables<'candidate_files'>[]> {
  const { data, error } = await supabase
    .from('candidate_files')
    .select('*')
    .eq('candidate_id', candidateId)
    .order('is_default_resume', { ascending: false, nullsFirst: false })
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching candidate files:', error)
    return []
  }
  return data || []
}

export type CandidateContactInfo = Pick<
  Tables<'candidate_profiles'>,
  'phone_number' | 'location' | 'personal_website_url' | 'linkedin_url' | 'github_url' | 'twitter_url' | 'bio'
>

export async function getCandidateContactInfo(
  supabase: Client,
  userId: string
): Promise<{
  data: CandidateContactInfo | null
  error: PostgrestError | null
}> {
  const { data, error } = await supabase
    .from('candidate_profiles')
    .select(
      'first_name, last_name, phone_number, location, personal_website_url, linkedin_url, github_url, twitter_url, bio'
    )
    .eq('id', userId)
    .single()

  if (error) {
    console.error(`Error fetching contact info for candidate ${userId}:`, error)
  }

  return { data, error }
}

export type CandidateSkill = Tables<'candidate_skills'>

export async function getCandidateSkills(
  supabase: Client,
  candidateId: string
): Promise<{
  data: CandidateSkill[] | null
  error: PostgrestError | null
}> {
  const { data, error } = await supabase
    .from('candidate_skills')
    .select('*')
    .eq('candidate_id', candidateId)
    .order('category_name', { ascending: true })
    .order('skill_name', { ascending: true })

  if (error) {
    console.error(`Error fetching skills for candidate ${candidateId}:`, error)
  }

  return { data, error }
}

export interface SkillCategory {
  id: string
  name: string
  skills: Array<{
    id: string
    name: string
    proficiency_level: string
  }>
}

export async function getCandidateSkillsGrouped(
  supabase: Client,
  candidateId: string
): Promise<{
  data: SkillCategory[] | null
  error: PostgrestError | null
}> {
  const { data: skills, error } = await getCandidateSkills(supabase, candidateId)

  if (error || !skills) {
    return { data: null, error }
  }

  const grouped = skills.reduce((acc, skill) => {
    const categoryName = skill.category_name || 'Uncategorized'

    if (!acc[categoryName]) {
      acc[categoryName] = {
        id: categoryName.toLowerCase().replace(/\s+/g, '-'),
        name: categoryName,
        skills: [],
      }
    }

    acc[categoryName].skills.push({
      id: skill.id,
      name: skill.skill_name,
      proficiency_level: typeof skill.proficiency_level === 'string' ? skill.proficiency_level : 'intermediate',
    })

    return acc
  }, {} as Record<string, SkillCategory>)

  return { data: Object.values(grouped), error: null }
}

export const getContactInfo = async (supabase: SupabaseClient, userId: string) => {
  const { data, error } = await supabase
    .from('candidate_profiles')
    .select(
      `
      phone_number,
      location,
      personal_website_url,
      linkedin_url,
      github_url,
      twitter_url,
      bio
    `
    )
    .eq('id', userId)
    .single()

  if (error && error.code !== 'PGRST116') {
    throw error
  }

  return data
}
