import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database, Tables, TablesInsert, TablesUpdate } from '../types/db'

export type UpdateCandidateProfileParams = {
  id: string
  first_name?: string | null
  last_name?: string | null
  job_title?: string | null
  phone_number?: string | null
  location?: string | null
  personal_website_url?: string | null
  linkedin_url?: string | null
  github_url?: string | null
  twitter_url?: string | null
  bio?: string | null
  is_onboarded?: boolean
}

type Client = SupabaseClient<Database>

export async function updateCandidateProfile(
  supabase: Client,
  data: UpdateCandidateProfileParams
) {
  const { id, ...input } = data

  if (Object.keys(input).length === 0) {
    console.warn('No fields provided to updateCandidateProfile.')
    return supabase.from('candidate_profiles').select('*').eq('id', id).single()
  }

  const { data: updatedData, error } = await supabase
    .from('candidate_profiles')
    .update(input)
    .eq('id', id)
    .select('*')
    .single()

  if (error) {
    console.error('Error updating candidate profile:', error)
    throw new Error(`Failed to update candidate profile: ${error.message}`)
  }

  if (!updatedData) {
    throw new Error(`Candidate profile with ID ${id} not found after update.`)
  }

  console.log('Successfully updated profile:', updatedData)
  return updatedData
}

export type CandidateProfile =
  Database['public']['Tables']['candidate_profiles']['Row']

export async function getCandidateProfileById(
  supabase: Client,
  userId: string
): Promise<CandidateProfile | null> {
  console.log(`Querying profile for user ID: ${userId}`)
  const { data, error } = await supabase
    .from('candidate_profiles')
    .select('*')
    .eq('id', userId)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      console.log(`No profile found for user ID: ${userId}`)
      return null
    }
    console.error('Error fetching candidate profile by ID:', error)
    throw new Error(`Failed to fetch candidate profile: ${error.message}`)
  }

  console.log(`Profile found for user ID ${userId}:`, data)
  return data
}

export type UpdateCandidateEducationParams =
  TablesUpdate<'candidate_education'> & {
    id: string
  }

export type CandidateEducation = Tables<'candidate_education'>

export async function updateCandidateEducation(
  supabase: Client,
  candidateId: string,
  params: UpdateCandidateEducationParams
): Promise<CandidateEducation> {
  const { id, ...updatePayload } = params

  Object.keys(updatePayload).forEach((key) => {
    if (updatePayload[key as keyof typeof updatePayload] === undefined) {
      delete updatePayload[key as keyof typeof updatePayload]
    }
  })

  if (Object.keys(updatePayload).length === 0) {
    console.warn('No fields provided to updateCandidateEducationRecord.')
    const { data: existingData, error: fetchError } = await supabase
      .from('candidate_education')
      .select('*')
      .eq('id', id)
      .eq('candidate_id', candidateId)
      .single()

    if (fetchError || !existingData) {
      console.error(
        'Error fetching existing education record or not found:',
        fetchError
      )
      throw new Error(
        `Education record with ID ${id} not found or not owned by candidate ${candidateId}.`
      )
    }
    return existingData
  }

  const { data: updatedData, error } = await supabase
    .from('candidate_education')
    .update(updatePayload)
    .eq('id', id)
    .eq('candidate_id', candidateId)
    .select('*')
    .single()

  if (error) {
    console.error('Error updating candidate education:', error)
    if (error.code === 'PGRST116') {
      throw new Error(
        `Education record with ID ${id} not found or not owned by candidate ${candidateId}.`
      )
    }
    throw new Error(`Failed to update education record: ${error.message}`)
  }

  if (!updatedData) {
    throw new Error(
      `Education record with ID ${id} not found after attempted update.`
    )
  }

  console.log('Successfully updated education record:', updatedData)
  return updatedData
}

export type CreateCandidateEducationParams = TablesInsert<'candidate_education'>

export async function createCandidateEducation(
  supabase: Client,
  params: CreateCandidateEducationParams
): Promise<CandidateEducation> {
  if (!params.candidate_id) {
    throw new Error('candidate_id is required to create an education record.')
  }

  const { data: insertedData, error } = await supabase
    .from('candidate_education')
    .insert(params)
    .select('*')
    .single()

  if (error) {
    console.error('Error creating candidate education:', error)
    throw new Error(`Failed to create education record: ${error.message}`)
  }

  if (!insertedData) {
    throw new Error(
      'Failed to create education record: No data returned after insert.'
    )
  }

  console.log('Successfully created education record:', insertedData)
  return insertedData
}
