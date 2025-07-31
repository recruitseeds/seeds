import type { Database } from '@seeds/supabase/types/db'
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3'
import type { SupabaseClient } from '@supabase/supabase-js'
import { v4 as uuidv4 } from 'uuid'

const R2_ACCOUNT_ID = process.env.CLOUDFLARE_R2_ACCOUNT_ID
const R2_ACCESS_KEY_ID = process.env.CLOUDFLARE_R2_ACCESS_KEY_ID
const R2_SECRET_ACCESS_KEY = process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY
export const R2_BUCKET_NAME = process.env.CLOUDFLARE_R2_BUCKET_NAME

if (
  !R2_ACCOUNT_ID ||
  !R2_ACCESS_KEY_ID ||
  !R2_SECRET_ACCESS_KEY ||
  !R2_BUCKET_NAME
) {
  console.warn(
    'R2 environment variables are not fully configured. File upload functionality may be affected.'
  )
}

let s3ClientInstance: S3Client | null = null

export function getS3Client(): S3Client {
  if (!s3ClientInstance) {
    if (!R2_ACCOUNT_ID || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY) {
      throw new Error(
        'Cannot initialize S3 client: R2 credentials are not configured.'
      )
    }
    s3ClientInstance = new S3Client({
      region: 'auto',
      endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: R2_ACCESS_KEY_ID,
        secretAccessKey: R2_SECRET_ACCESS_KEY,
      },
    })
  }
  return s3ClientInstance
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
    | 'avatar',
  dbFileType: Database['public']['Enums']['candidate_file_type']
) {
  const originalFileName = file.name || `unknown_file_${uuidv4()}`
  const fileExtension = originalFileName.split('.').pop()
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
  const baseNameForR2 = fileCategoryForR2Path
  const uniqueFilenameInR2 = `${timestamp}_${baseNameForR2}${
    fileExtension ? '.' + fileExtension : ''
  }`
  const r2Key = `candidates/${userId}/${fileCategoryForR2Path}/${uniqueFilenameInR2}`

  const fileBuffer = await file.arrayBuffer()

  await s3Client.send(
    new PutObjectCommand({
      Bucket: r2BucketName,
      Key: r2Key,
      Body: Buffer.from(fileBuffer),
      ContentType: file.type || 'application/octet-stream',
    })
  )

  const documentRecordToInsert: Database['public']['Tables']['candidate_files']['Insert'] =
    {
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
    console.error(
      `Failed to record document metadata for ${r2Key} in DB:`,
      dbError
    )
    throw new Error(
      `Failed to record document metadata: ${
        dbError?.message || 'Unknown DB error'
      }`
    )
  }

  return {
    id: insertedRecord.id,
    candidate_id: insertedRecord.candidate_id,
    file_name: insertedRecord.file_name,
    file_type:
      insertedRecord.file_type as Database['public']['Enums']['candidate_file_type'],
    mime_type: insertedRecord.mime_type,
    size_bytes: insertedRecord.size_bytes,
    storage_path: insertedRecord.storage_path,
    is_default_resume: insertedRecord.is_default_resume,
    parsed_resume_data: insertedRecord.parsed_resume_data,
  }
}
