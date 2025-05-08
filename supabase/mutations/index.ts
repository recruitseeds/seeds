import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3'
import type { SupabaseClient } from '@supabase/supabase-js'
import { v4 as uuidv4 } from 'uuid'
import type {
  Database,
  Json,
  Tables,
  TablesInsert,
  TablesUpdate,
} from '../types/db'

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

export type CreateCandidateWorkExperienceParams =
  TablesInsert<'candidate_work_experiences'>
export type UpdateCandidateWorkExperienceParams =
  TablesUpdate<'candidate_work_experiences'> & {
    id: string
  }

export async function createCandidateWorkExperience(
  supabase: Client,
  params: CreateCandidateWorkExperienceParams
): Promise<Tables<'candidate_work_experiences'>> {
  if (!params.candidate_id) {
    throw new Error(
      'candidate_id is required to create a work experience record.'
    )
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
    console.error('Error creating candidate work experience:', error)
    throw new Error(`Failed to create work experience record: ${error.message}`)
  }
  if (!insertedData) {
    throw new Error(
      'Failed to create work experience record: No data returned after insert.'
    )
  }
  console.log('Successfully created work experience record:', insertedData)
  return insertedData
}

export type CandidateWorkExperience = Tables<'candidate_work_experiences'>
export async function updateCandidateWorkExperience(
  supabase: Client,
  candidateId: string, // This is the user's ID, used to ensure ownership
  params: UpdateCandidateWorkExperienceParams
): Promise<CandidateWorkExperience> {
  const { id, ...updatePayload } = params

  // Remove undefined fields to prevent Supabase errors if a field is not meant to be updated
  Object.keys(updatePayload).forEach((key) => {
    if (updatePayload[key as keyof typeof updatePayload] === undefined) {
      delete updatePayload[key as keyof typeof updatePayload]
    }
  })

  if (Object.keys(updatePayload).length === 0) {
    console.warn(
      `[Mutation: updateCandidateWorkExperience] No fields provided to update for ID: ${id}. Fetching existing.`
    )
    // If no fields to update, fetch and return the existing record
    // This behavior might need adjustment based on whether an error or the existing record is preferred
    const { data: existingData, error: fetchError } = await supabase
      .from('candidate_work_experiences')
      .select('*')
      .eq('id', id)
      .eq('candidate_id', candidateId)
      .single()

    if (fetchError || !existingData) {
      console.error(
        `[Mutation: updateCandidateWorkExperience] Error fetching existing record or not found for ID ${id} and candidate ${candidateId}:`,
        fetchError
      )
      throw new Error(
        `Work experience record with ID ${id} not found or not owned by candidate ${candidateId}.`
      )
    }
    return existingData
  }

  console.log(
    `[Mutation: updateCandidateWorkExperience] Attempting to update record ID: ${id} for candidate ID: ${candidateId} with payload:`,
    updatePayload
  )

  const { data: updatedData, error } = await supabase
    .from('candidate_work_experiences')
    .update(updatePayload)
    .eq('id', id)
    .eq('candidate_id', candidateId) // Crucial for security and correctness
    .select('*')
    .single()

  console.log(
    `[Mutation: updateCandidateWorkExperience] Supabase response for ID ${id}:`,
    { updatedData, error }
  )
  console.log(
    `[Mutation: updateCandidateWorkExperience] candidateId used in query: ${candidateId}`
  )

  if (error) {
    console.error(
      `[Mutation: updateCandidateWorkExperience] Supabase error for ID ${id}:`,
      error
    )
    if (error.code === 'PGRST116') {
      // PostgREST error for "No rows found"
      throw new Error(
        `Work experience record with ID ${id} not found or not owned by candidate ${candidateId}. (Error code: ${error.code})`
      )
    }
    throw new Error(
      `Failed to update work experience record for ID ${id}: ${error.message} (Code: ${error.code})`
    )
  }

  if (!updatedData) {
    console.error(
      `[Mutation: updateCandidateWorkExperience] No data returned from Supabase after update for ID ${id}. This will throw an error. This usually means the record did not match the .eq() conditions after the update, or RLS prevented the select.`
    )
    throw new Error(
      `Work experience record with ID ${id} not found after attempted update (candidateId: ${candidateId}). Check RLS or if record exists with this candidate_id.`
    )
  }

  console.log(
    `[Mutation: updateCandidateWorkExperience] Successfully updated and returning data for ID ${id}:`,
    updatedData
  )
  return updatedData as CandidateWorkExperience // Ensure the return type matches
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
    console.error(
      `Error deleting work experience ${workExperienceId} for candidate ${candidateId}:`,
      error
    )
    return { success: false, error }
  }
  console.log(
    `Successfully deleted work experience ${workExperienceId} for candidate ${candidateId}`
  )
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
  const fileNameForError = 'name' in file ? (file as File).name : 'unknown file'

  if (typeof file.arrayBuffer === 'function') {
    console.log(
      '[Util:getArrayBufferFromFile] Using file.arrayBuffer() method.'
    )
    return await file.arrayBuffer()
  }
  // The File API also provides a stream() method. Blobs also have a stream() method.
  // This can be a fallback or alternative way to read the file.
  else if (typeof file.stream === 'function') {
    console.warn(
      `[Util:getArrayBufferFromFile] file.arrayBuffer not available or not a function for '${fileNameForError}'. Attempting to read from file.stream().`
    )
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
    const concatenated = new Uint8Array(
      chunks.reduce((acc, val) => acc + val.length, 0)
    )
    let offset = 0
    for (const chunk of chunks) {
      concatenated.set(chunk, offset)
      offset += chunk.length
    }
    return concatenated.buffer
  } else {
    console.error(
      `[Util:getArrayBufferFromFile] Cannot get ArrayBuffer for '${fileNameForError}': 'file' object has neither arrayBuffer() nor stream() method.`,
      {
        fileName: fileNameForError,
        fileType: file.type,
        objectKeys: Object.keys(file),
      }
    )
    throw new Error(
      `Could not read file content for "${fileNameForError}". Object is not a recognized File or Streamable type.`
    )
  }
}

export async function uploadFileToR2AndRecord(
  supabase: SupabaseClient<Database>,
  s3Client: S3Client,
  r2BucketName: string,
  userId: string, // This is the candidate_id
  file: File,
  fileCategoryForR2Path: 'resume' | 'cover_letter' | 'transcript' | 'other', // For R2 path organization
  dbFileType: Database['public']['Enums']['candidate_file_type'] // For the database column
): Promise<CandidateUploadedFileMetadata> {
  const originalFileName = file.name || `unknown_file_${uuidv4()}` // Fallback for filename in DB
  if (!file.name) {
    console.warn(
      `[Mutation:uploadFileToR2AndRecord] File object received without a 'name' property. Using fallback for DB record: '${originalFileName}'.`
    )
  }

  const fileExtension = originalFileName.split('.').pop() // Get extension from original name
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-')

  // Use the fileCategoryForR2Path as the base name for the R2 key.
  const baseNameForR2 = fileCategoryForR2Path // e.g., "resume", "cover_letter"

  const uniqueFilenameInR2 = `${timestamp}_${baseNameForR2}${
    fileExtension ? '.' + fileExtension : ''
  }`
  // Path structure in R2
  const r2Key = `candidates/${userId}/${fileCategoryForR2Path}/${uniqueFilenameInR2}`

  console.log(
    `[Mutation:uploadFileToR2AndRecord] Uploading (original name: '${originalFileName}') to R2 Bucket: ${r2BucketName}, Key: ${r2Key}`
  )

  const fileBuffer = await getArrayBufferFromFile(file)

  await s3Client.send(
    new PutObjectCommand({
      Bucket: r2BucketName,
      Key: r2Key,
      Body: Buffer.from(fileBuffer),
      ContentType: file.type || 'application/octet-stream',
    })
  )
  console.log(
    `[Mutation:uploadFileToR2AndRecord] File (original name: '${originalFileName}') uploaded to R2.`
  )

  // Prepare the record for your `candidate_files` table
  // The `file_name` stored in DB is the original user-provided filename.
  const documentRecordToInsert: Database['public']['Tables']['candidate_files']['Insert'] =
    {
      candidate_id: userId,
      file_name: originalFileName, // Store the actual original/fallback name here
      file_type: dbFileType,
      mime_type: file.type || null,
      size_bytes: file.size,
      storage_path: r2Key, // This path uses the category-based unique name
      // is_default_resume, parsed_resume_data, etc., are handled by other logic/actions
    }

  // Insert into `candidate_files` table
  const { data: insertedRecord, error: dbError } = await supabase
    .from('candidate_files')
    .insert(documentRecordToInsert)
    .select(
      // Select the columns you need for the CandidateUploadedFileMetadata interface
      // Ensure these match your `candidate_files` table and the interface
      'id, candidate_id, file_name, file_type, mime_type, size_bytes, storage_path, is_default_resume, parsed_resume_data'
    )
    .single()

  if (dbError || !insertedRecord) {
    console.error(
      `[Mutation:uploadFileToR2AndRecord] Failed to record document metadata for ${r2Key} in DB (table: candidate_files):`,
      dbError
    )
    // Consider deleting from R2 if DB insert fails for atomicity
    throw new Error(
      `Failed to record document metadata in candidate_files: ${
        dbError?.message || 'Unknown DB error'
      }`
    )
  }

  console.log(
    `[Mutation:uploadFileToR2AndRecord] Metadata recorded in candidate_files for ${r2Key}. DB ID: ${insertedRecord.id}`
  )

  // Map the `insertedRecord` to the `CandidateUploadedFileMetadata` interface
  return {
    id: insertedRecord.id,
    candidate_id: insertedRecord.candidate_id,
    file_name: insertedRecord.file_name, // This is the originalFileName stored in DB
    file_type:
      insertedRecord.file_type as Database['public']['Enums']['candidate_file_type'],
    mime_type: insertedRecord.mime_type,
    size_bytes: insertedRecord.size_bytes,
    storage_path: insertedRecord.storage_path, // This is the R2 key
    is_default_resume: insertedRecord.is_default_resume,
    parsed_resume_data: insertedRecord.parsed_resume_data,
  }
}
