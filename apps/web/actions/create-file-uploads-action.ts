'use server'

import { authActionClient } from '@/actions/safe-action'
import {
  uploadFileToR2AndRecord,
  type CandidateUploadedFileMetadata, // Keep this type for the mutation's return value
} from '@seeds/supabase/mutations' // Assuming mutations/index.ts exports it
import type { Database } from '@seeds/supabase/types/db'
import { S3Client } from '@aws-sdk/client-s3'
import type { SupabaseClient, User } from '@supabase/supabase-js'

// R2 Configuration - Remains the same
const R2_BUCKET_NAME = process.env.CLOUDFLARE_R2_BUCKET_NAME!
const R2_ACCESS_KEY_ID = process.env.CLOUDFLARE_R2_ACCESS_KEY_ID!
const R2_SECRET_ACCESS_KEY = process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY!
const R2_ACCOUNT_ID = process.env.CLOUDFLARE_R2_ACCOUNT_ID!

let s3ClientInstance: S3Client | null = null
if (
  R2_BUCKET_NAME &&
  R2_ACCESS_KEY_ID &&
  R2_SECRET_ACCESS_KEY &&
  R2_ACCOUNT_ID
) {
  s3ClientInstance = new S3Client({
    region: 'auto',
    endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: R2_ACCESS_KEY_ID,
      secretAccessKey: R2_SECRET_ACCESS_KEY,
    },
  })
} else {
  console.error(
    '[Action:handleCandidateFileUploadsAction] R2 environment variables are not fully configured. File uploads will fail.'
  )
}

// Removed extractTextFromFile and related imports (mammoth, pdf-parse)
// Removed AI SDK imports (openai, generateObject, ai)
// Removed resumeSchema import

// Context type remains the same
interface ActionContextWithOriginalInput {
  user: User
  supabase: SupabaseClient<Database>
  originalClientInput?: unknown
}

// Simplified result interface - no AI fields
export interface ProcessedFileUploadResult
  extends CandidateUploadedFileMetadata {
  originalClientKey: string // Keep track of which input field it came from
}

// Action result interface remains structurally similar, but 'results' type changes
export interface CandidateFileUploadsActionResult {
  success: boolean
  results?: ProcessedFileUploadResult[] // Uses the simplified result type
  error?: {
    code: string
    message: string
    fieldErrors?: { fileKeyOrName: string; message: string }[]
  }
}

export const handleCandidateFileUploadsAction = authActionClient
  .metadata({ name: 'handle-candidate-file-uploads' })
  .action(
    async (args: {
      ctx: ActionContextWithOriginalInput
      parsedInput: undefined // Expect FormData via originalClientInput
    }): Promise<CandidateFileUploadsActionResult> => {
      const { ctx } = args
      const { user, supabase, originalClientInput } = ctx

      if (!s3ClientInstance) {
        const errorMsg = 'File storage service is not configured on the server.'
        console.error(`[Action:handleCandidateFileUploadsAction] ${errorMsg}`)
        return {
          success: false,
          error: { code: 'STORAGE_CONFIG_ERROR', message: errorMsg },
        }
      }

      if (!(originalClientInput instanceof FormData)) {
        const errorMsg = 'Invalid input: Expected FormData.'
        console.error(
          `[Action:handleCandidateFileUploadsAction] ${errorMsg} User ID: ${
            user.id
          }. Received type: ${typeof originalClientInput}`
        )
        return {
          success: false,
          error: { code: 'INVALID_INPUT', message: errorMsg },
        }
      }
      const formData = originalClientInput

      const processedFileResults: ProcessedFileUploadResult[] = []
      const fieldErrors: { fileKeyOrName: string; message: string }[] = []
      const fileProcessingPromises: Promise<void>[] = []

      // Simplified processEntry - no AI logic
      const processEntry = async (
        fileFromFormData: File | null,
        clientKey: string,
        r2PathCategory: 'resume' | 'cover_letter' | 'transcript' | 'other',
        dbFileType: Database['public']['Enums']['candidate_file_type']
      ) => {
        if (!fileFromFormData) {
          console.log(`[Action] No file found for key: ${clientKey}. Skipping.`)
          return
        }

        console.log(
          `[Action] processEntry - Processing file for key '${clientKey}': Name: ${fileFromFormData.name}, Size: ${fileFromFormData.size}, Type: ${fileFromFormData.type}`
        )
        if (!fileFromFormData.name) {
          console.warn(
            `[Action] processEntry - File for key '${clientKey}' is missing a name property before mutation call.`
          )
        }

        try {
          // Call the mutation to upload to R2 and record in DB
          const uploadedMetadata = await uploadFileToR2AndRecord(
            supabase,
            s3ClientInstance!,
            R2_BUCKET_NAME,
            user.id,
            fileFromFormData,
            r2PathCategory,
            dbFileType
          )

          // Push the result (without AI fields)
          processedFileResults.push({
            ...uploadedMetadata,
            originalClientKey: clientKey,
          })
        } catch (uploadErr: any) {
          console.error(
            `[Action] Failed to process file ${
              fileFromFormData.name || clientKey
            } (key: ${clientKey}):`,
            uploadErr.message,
            uploadErr
          )
          fieldErrors.push({
            fileKeyOrName: fileFromFormData.name || clientKey,
            message: uploadErr.message || 'Upload and record failed.',
          })
        }
      }

      // --- Processing logic remains the same, calling the simplified processEntry ---

      const resumeFile = formData.get('resume') as File | null
      if (resumeFile) {
        fileProcessingPromises.push(
          processEntry(
            resumeFile,
            'resume',
            'resume',
            'resume' as Database['public']['Enums']['candidate_file_type'] // Ensure 'resume' matches your enum
          )
        )
      }

      const coverLetterFile = formData.get('coverLetter') as File | null
      if (coverLetterFile) {
        fileProcessingPromises.push(
          processEntry(
            coverLetterFile,
            'coverLetter',
            'cover_letter',
            'cover_letter' as Database['public']['Enums']['candidate_file_type'] // Ensure 'cover_letter' matches your enum
          )
        )
      }

      const transcriptFile = formData.get('transcript') as File | null
      if (transcriptFile) {
        fileProcessingPromises.push(
          processEntry(
            transcriptFile,
            'transcript',
            'transcript',
            'transcript' as Database['public']['Enums']['candidate_file_type'] // Ensure 'transcript' matches your enum
          )
        )
      }

      const otherFiles = formData.getAll('otherFiles')
      otherFiles.forEach((fileValue, index) => {
        if (fileValue instanceof File) {
          fileProcessingPromises.push(
            processEntry(
              fileValue,
              `otherFiles[${index}]`,
              'other',
              'other' as Database['public']['Enums']['candidate_file_type'] // Ensure 'other' matches your enum
            )
          )
        } else {
          console.warn(
            `[Action] Item for 'otherFiles' at index ${index} is not a File instance. Type: ${typeof fileValue}`,
            fileValue
          )
        }
      })

      await Promise.all(fileProcessingPromises)

      // --- Return logic remains the same ---

      if (fieldErrors.length > 0) {
        return {
          success: processedFileResults.length > 0, // Partial success
          results:
            processedFileResults.length > 0 ? processedFileResults : undefined,
          error: {
            code: 'PARTIAL_UPLOAD_FAILURE',
            message: 'Some files could not be processed.',
            fieldErrors,
          },
        }
      }

      const totalFormEntriesCount = Array.from(formData.keys()).length
      if (
        processedFileResults.length === 0 &&
        totalFormEntriesCount > 0 &&
        fieldErrors.length === 0
      ) {
        console.warn(
          '[Action] FormData had entries, but no files were processed successfully and no errors were explicitly caught for them. This might mean no files were actually appended with expected keys, or they were null.'
        )
      }

      console.log(
        `[Action] File processing completed for User ID: ${user.id}. Results: ${processedFileResults.length}, Errors: ${fieldErrors.length}`
      )
      // Return the simplified results array
      return { success: true, results: processedFileResults }
    }
  )
