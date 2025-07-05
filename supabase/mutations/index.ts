// src/supabase/mutations.ts

import type { S3Client } from '@aws-sdk/client-s3'
import type { SupabaseClient } from '@supabase/supabase-js'
import { v4 as uuidv4 } from 'uuid'
import type { Database, Json, Tables, TablesInsert, TablesUpdate } from '../types/db'

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

export async function updateCandidateProfile(supabase: Client, data: UpdateCandidateProfileParams) {
  const { id, ...input } = data

  if (Object.keys(input).length === 0) {
    const { data: existingData, error: fetchError } = await supabase
      .from('candidate_profiles')
      .select('*')
      .eq('id', id)
      .single()

    if (fetchError) {
      throw new Error(`Failed to fetch candidate profile (no-update path): ${fetchError.message}`)
    }
    if (!existingData) {
      throw new Error(`Candidate profile with ID ${id} not found.`)
    }
    return existingData
  }

  const { data: updatedData, error } = await supabase
    .from('candidate_profiles')
    .update(input)
    .eq('id', id)
    .select('*')
    .single()

  if (error) {
    throw new Error(`Failed to update candidate profile: ${error.message}`)
  }

  if (!updatedData) {
    throw new Error(`Candidate profile with ID ${id} not found after update.`)
  }

  return updatedData
}

export type CandidateProfile = Database['public']['Tables']['candidate_profiles']['Row']

export async function getCandidateProfileById(supabase: Client, userId: string): Promise<CandidateProfile | null> {
  const { data, error } = await supabase.from('candidate_profiles').select('*').eq('id', userId).single()

  if (error) {
    if (error.code === 'PGRST116') {
      return null
    }
    throw new Error(`Failed to fetch candidate profile: ${error.message}`)
  }

  return data
}

export type UpdateCandidateEducationParams = TablesUpdate<'candidate_education'> & {
  id: string
}

export type CandidateEducation = Tables<'candidate_education'>

export async function updateCandidateEducation(
  supabase: Client,
  candidateId: string,
  params: UpdateCandidateEducationParams
): Promise<CandidateEducation> {
  const { id, ...updatePayload } = params

  for (const key of Object.keys(updatePayload)) {
    if (updatePayload[key as keyof typeof updatePayload] === undefined) {
      delete updatePayload[key as keyof typeof updatePayload]
    }
  }

  if (Object.keys(updatePayload).length === 0) {
    const { data: existingData, error: fetchError } = await supabase
      .from('candidate_education')
      .select('*')
      .eq('id', id)
      .eq('candidate_id', candidateId)
      .single()

    if (fetchError || !existingData) {
      throw new Error(`Education record with ID ${id} not found or not owned by candidate ${candidateId}.`)
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
    if (error.code === 'PGRST116') {
      throw new Error(`Education record with ID ${id} not found or not owned by candidate ${candidateId}.`)
    }
    throw new Error(`Failed to update education record: ${error.message}`)
  }

  if (!updatedData) {
    throw new Error(`Education record with ID ${id} not found after attempted update.`)
  }

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

  const { data: insertedData, error } = await supabase.from('candidate_education').insert(params).select('*').single()

  if (error) {
    throw new Error(`Failed to create education record: ${error.message}`)
  }

  if (!insertedData) {
    throw new Error('Failed to create education record: No data returned after insert.')
  }

  return insertedData
}

export type CreateCandidateWorkExperienceParams = TablesInsert<'candidate_work_experiences'>
export type UpdateCandidateWorkExperienceParams = TablesUpdate<'candidate_work_experiences'> & {
  id: string
}

export async function createCandidateWorkExperience(
  supabase: Client,
  params: CreateCandidateWorkExperienceParams
): Promise<Tables<'candidate_work_experiences'>> {
  if (!params.candidate_id) {
    throw new Error('candidate_id is required to create a work experience record.')
  }

  if (!params.job_title || !params.company_name || !params.start_date) {
    throw new Error('Job title, company name, and start date are required.')
  }

  const { data: insertedData, error } = await supabase
    .from('candidate_work_experiences')
    .insert(params)
    .select('*')
    .single()

  if (error) {
    throw new Error(`Failed to create work experience record: ${error.message}`)
  }
  if (!insertedData) {
    throw new Error('Failed to create work experience record: No data returned after insert.')
  }
  return insertedData
}

export type CandidateWorkExperience = Tables<'candidate_work_experiences'>
export async function updateCandidateWorkExperience(
  supabase: Client,
  candidateId: string,
  params: UpdateCandidateWorkExperienceParams
): Promise<CandidateWorkExperience> {
  const { id, ...updatePayload } = params

  for (const key of Object.keys(updatePayload)) {
    if (updatePayload[key as keyof typeof updatePayload] === undefined) {
      delete updatePayload[key as keyof typeof updatePayload]
    }
  }

  if (Object.keys(updatePayload).length === 0) {
    const { data: existingData, error: fetchError } = await supabase
      .from('candidate_work_experiences')
      .select('*')
      .eq('id', id)
      .eq('candidate_id', candidateId)
      .single()

    if (fetchError || !existingData) {
      throw new Error(`Work experience record with ID ${id} not found or not owned by candidate ${candidateId}.`)
    }
    return existingData
  }

  const { data: updatedData, error } = await supabase
    .from('candidate_work_experiences')
    .update(updatePayload)
    .eq('id', id)
    .eq('candidate_id', candidateId)
    .select('*')
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      throw new Error(
        `Work experience record with ID ${id} not found or not owned by candidate ${candidateId}. (Error code: ${error.code})`
      )
    }
    throw new Error(`Failed to update work experience record for ID ${id}: ${error.message} (Code: ${error.code})`)
  }

  if (!updatedData) {
    throw new Error(
      `Work experience record with ID ${id} not found after attempted update (candidateId: ${candidateId}). Check RLS or if record exists with this candidate_id.`
    )
  }

  return updatedData as CandidateWorkExperience
}

export async function deleteCandidateWorkExperience(
  supabase: Client,
  workExperienceId: string,
  candidateId: string
): Promise<{ success: boolean; error?: Error }> {
  const { error } = await supabase
    .from('candidate_work_experiences')
    .delete()
    .eq('id', workExperienceId)
    .eq('candidate_id', candidateId)

  if (error) {
    return { success: false, error }
  }
  return { success: true }
}

export interface CandidateUploadedFileMetadata {
  id: string
  candidate_id: string
  file_name: string
  file_type: Database['public']['Enums']['candidate_file_type']
  mime_type: string | null
  size_bytes: number | null
  storage_path: string
  is_default_resume?: boolean | null
  parsed_resume_data?: Json | null
}

async function getArrayBufferFromFile(file: File | Blob): Promise<ArrayBuffer> {
  if (typeof file.arrayBuffer === 'function') {
    return await file.arrayBuffer()
  }

  if (typeof file.stream === 'function') {
    const stream = file.stream()
    const reader = stream.getReader()
    const chunks: Uint8Array[] = []
    try {
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        chunks.push(value)
      }
    } finally {
      reader.releaseLock()
    }
    const concatenated = new Uint8Array(chunks.reduce((acc, val) => acc + val.length, 0))
    let offset = 0
    for (const chunk of chunks) {
      concatenated.set(chunk, offset)
      offset += chunk.length
    }
    return concatenated.buffer
  }

  throw new Error('Could not read file content. Object is not a recognized File or Streamable type.')
}

export async function uploadFileToR2AndRecord(
  supabase: SupabaseClient<Database>,
  s3Client: S3Client,
  r2BucketName: string,
  userId: string,
  file: File,
  fileCategoryForR2Path:
    | 'resume'
    | 'cover_letter'
    | 'transcript'
    | 'other'
    | 'portfolio'
    | 'certification'
    | 'reference'
    | 'eligibility',
  dbFileType: Database['public']['Enums']['candidate_file_type']
): Promise<CandidateUploadedFileMetadata> {
  const originalFileName = file.name || `unknown_file_${uuidv4()}`
  const fileExtension = originalFileName.split('.').pop()
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
  const baseNameForR2 = fileCategoryForR2Path
  const uniqueFilenameInR2 = `${timestamp}_${baseNameForR2}${fileExtension ? `.${fileExtension}` : ''}`
  const r2Key = `candidates/${userId}/${fileCategoryForR2Path}/${uniqueFilenameInR2}`

  const fileBuffer = await getArrayBufferFromFile(file)

  await s3Client.send(
    new (
      await import('@aws-sdk/client-s3')
    ).PutObjectCommand({
      Bucket: r2BucketName,
      Key: r2Key,
      Body: Buffer.from(fileBuffer),
      ContentType: file.type || 'application/octet-stream',
    })
  )

  const documentRecordToInsert: Database['public']['Tables']['candidate_files']['Insert'] = {
    candidate_id: userId,
    file_name: originalFileName,
    file_type: dbFileType,
    mime_type: file.type || null,
    size_bytes: file.size,
    storage_path: r2Key,
  }

  const { data: insertedRecord, error: dbError } = await supabase
    .from('candidate_files')
    .insert(documentRecordToInsert)
    .select(
      'id, candidate_id, file_name, file_type, mime_type, size_bytes, storage_path, is_default_resume, parsed_resume_data'
    )
    .single()

  if (dbError || !insertedRecord) {
    throw new Error(`Failed to record document metadata in candidate_files: ${dbError?.message || 'Unknown DB error'}`)
  }

  return {
    id: insertedRecord.id,
    candidate_id: insertedRecord.candidate_id,
    file_name: insertedRecord.file_name,
    file_type: insertedRecord.file_type as Database['public']['Enums']['candidate_file_type'],
    mime_type: insertedRecord.mime_type,
    size_bytes: insertedRecord.size_bytes,
    storage_path: insertedRecord.storage_path,
    is_default_resume: insertedRecord.is_default_resume,
    parsed_resume_data: insertedRecord.parsed_resume_data,
  }
}

export async function deleteCandidateEducation(
  supabase: Client,
  educationId: string,
  candidateId: string
): Promise<{ success: boolean; error?: Error }> {
  const { error } = await supabase
    .from('candidate_education')
    .delete()
    .eq('id', educationId)
    .eq('candidate_id', candidateId)

  if (error) {
    return { success: false, error }
  }
  return { success: true }
}

export type CreateCandidateApplicationParams = TablesInsert<'candidate_applications'>

export async function createCandidateApplication(
  supabase: SupabaseClient<Database>,
  params: CreateCandidateApplicationParams
) {
  if (!params.candidate_id) {
    throw new Error('candidate_id is required to create an application.')
  }
  if (!params.job_title || !params.company_name || !params.application_date) {
    throw new Error('Job title, company name, and application date are required.')
  }

  const { data: insertedData, error } = await supabase
    .from('candidate_applications')
    .insert(params)
    .select('*')
    .single()

  if (error) {
    throw new Error(`Failed to create application: ${error.message}`)
  }
  if (!insertedData) {
    throw new Error('Failed to create application: No data returned after insert.')
  }
  return insertedData
}

export type UpdateCandidateApplicationParams = TablesUpdate<'candidate_applications'> & {
  id: string
}

export async function updateCandidateApplication(
  supabase: Client,
  candidateId: string,
  applicationId: string,
  updateData: Partial<TablesUpdate<'candidate_applications'>>
): Promise<Tables<'candidate_applications'>> {
  console.log('updateCandidateApplication called with:', {
    candidateId,
    applicationId,
    updateData,
  })

  const cleanUpdateData = Object.fromEntries(Object.entries(updateData).filter(([_, value]) => value !== undefined))

  console.log('cleanUpdateData:', cleanUpdateData)

  if (Object.keys(cleanUpdateData).length === 0) {
    console.log('No data to update, fetching existing data')
    const { data: existingData, error: fetchError } = await supabase
      .from('candidate_applications')
      .select('*')
      .eq('id', applicationId)
      .eq('candidate_id', candidateId)
      .single()

    if (fetchError || !existingData) {
      throw new Error(`Application with ID ${applicationId} not found or not owned by candidate ${candidateId}.`)
    }
    return existingData
  }

  console.log('Updating application with data:', cleanUpdateData)

  const { data: updatedData, error } = await supabase
    .from('candidate_applications')
    .update(cleanUpdateData)
    .eq('id', applicationId)
    .eq('candidate_id', candidateId)
    .select('*')
    .single()

  console.log('Supabase update result:', { updatedData, error })

  if (error) {
    console.error('Supabase update error:', error)
    if (error.code === 'PGRST116') {
      throw new Error(`Application with ID ${applicationId} not found or not owned by candidate ${candidateId}.`)
    }
    throw new Error(`Failed to update application: ${error.message}`)
  }

  if (!updatedData) {
    throw new Error(`Application with ID ${applicationId} not found after update.`)
  }

  console.log('Successfully updated application:', updatedData)
  return updatedData
}

export async function createMultipleCandidateApplications(
  supabase: SupabaseClient<Database>,
  applications: CreateCandidateApplicationParams[]
) {
  if (!applications || applications.length === 0) {
    return { data: [], error: null, count: 0 }
  }

  for (const app of applications) {
    if (!app.candidate_id) {
      throw new Error('candidate_id is required for all applications in batch.')
    }
    if (!app.job_title || !app.company_name || !app.application_date) {
      throw new Error('Job title, company name, and application date are required for all applications in batch.')
    }
  }

  const { data, error, count } = await supabase.from('candidate_applications').insert(applications).select('*')

  if (error) {
    throw new Error(`Failed to create multiple applications: ${error.message}`)
  }
  return { data, error, count }
}

export type CreateCandidateSkillParams = TablesInsert<'candidate_skills'>
export type CandidateSkill = Tables<'candidate_skills'>

export async function createCandidateSkill(
  supabase: Client,
  params: CreateCandidateSkillParams
): Promise<CandidateSkill> {
  if (!params.candidate_id) {
    throw new Error('candidate_id is required to create a skill.')
  }

  const { data: insertedData, error } = await supabase.from('candidate_skills').insert(params).select('*').single()

  if (error) {
    throw new Error(`Failed to create skill: ${error.message}`)
  }

  if (!insertedData) {
    throw new Error('Failed to create skill: No data returned after insert.')
  }

  return insertedData
}

export async function deleteCandidateSkill(
  supabase: Client,
  skillId: string,
  candidateId: string
): Promise<{ success: boolean; error?: Error }> {
  const { error } = await supabase.from('candidate_skills').delete().eq('id', skillId).eq('candidate_id', candidateId)

  if (error) {
    return { success: false, error }
  }
  return { success: true }
}
