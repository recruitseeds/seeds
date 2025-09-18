'use server'

import { authActionClient } from '@/actions/safe-action'
import type { Database } from '@seeds/supabase/types/db'
import { openai } from '@ai-sdk/openai'
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3'
import type { SupabaseClient, User } from '@supabase/supabase-js'
import { generateObject } from 'ai'
import mammoth from 'mammoth'
import pdf from 'pdf-parse'
import { resumeSchema, type ResumeData } from './schema'

const R2_BUCKET_NAME = process.env.CLOUDFLARE_R2_BUCKET_NAME!
const R2_ACCESS_KEY_ID = process.env.CLOUDFLARE_R2_ACCESS_KEY_ID!
const R2_SECRET_ACCESS_KEY = process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY!
const R2_ACCOUNT_ID = process.env.CLOUDFLARE_R2_ACCOUNT_ID!

if (
  !R2_BUCKET_NAME ||
  !R2_ACCESS_KEY_ID ||
  !R2_SECRET_ACCESS_KEY ||
  !R2_ACCOUNT_ID
) {
  console.error(
    '[Action: parseAndStore] R2 environment variables are not fully configured!'
  )
}

const s3Client = new S3Client({
  region: 'auto',
  endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID,
    secretAccessKey: R2_SECRET_ACCESS_KEY,
  },
})

async function extractTextFromFile(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)

  if (file.type === 'application/pdf') {
    const data = await pdf(buffer)
    return data.text
  } else if (
    file.type ===
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ) {
    const { value } = await mammoth.extractRawText({ buffer })
    return value
  } else if (file.type === 'application/msword') {
    try {
      const { value } = await mammoth.extractRawText({ buffer })
      return value
    } catch (e) {
      console.warn(
        '[Action: parseAndStore] Could not parse .doc file, attempting as plain text.',
        e
      )
      return file.text()
    }
  } else if (file.type === 'text/plain') {
    return file.text()
  } else {
    throw new Error(
      'Unsupported file type. Please upload PDF, DOCX, DOC, or TXT.'
    )
  }
}

interface ActionContextWithOriginalInput {
  user: User
  supabase: SupabaseClient<Database>
  originalClientInput?: unknown
}

export const parseAndStoreResumeAction = authActionClient
  .metadata({
    name: 'parse-and-store-resume-file',
  })
  .action(
    async (args: {
      ctx: ActionContextWithOriginalInput
      parsedInput: undefined
    }) => {
      const { ctx } = args
      const { user, supabase, originalClientInput } = ctx
      const authUserId = user.id

      const formData = originalClientInput as FormData

      if (!(formData instanceof FormData)) {
        const errorMsg = 'Invalid input type, expected FormData.'
        console.error(
          `[Action]: ${errorMsg} User ID: ${authUserId}.`
        )
        return {
          success: false,
          error: { code: 'INPUT_ERROR', message: errorMsg },
        }
      }

      const file = formData.get('resumeFile') as File | null
      if (!file) {
        const errorMsg = 'No file provided.'
        console.error(
          `[Action: parseAndStore] ${errorMsg} User ID: ${authUserId}`
        )
        return {
          success: false,
          error: { code: 'INPUT_ERROR', message: errorMsg },
        }
      }

      let actualCandidateProfileId: string
      let parsedDataFromAI: ResumeData | undefined

      try {
        console.log(
          `[Action: parseAndStore] Starting for Auth User ID: ${authUserId}, File: ${file.name}`
        )

        const { data: profile, error: profileError } = await supabase
          .from('candidate_profiles')
          .select('id')
          .eq('id', authUserId)
          .single()

        if (profileError && profileError.code !== 'PGRST116') {
          throw new Error(`Failed to fetch profile: ${profileError.message}`)
        }

        if (!profile) {
          const { data: newProfile, error: newProfileError } = await supabase
            .from('candidate_profiles')
            .insert({ id: authUserId })
            .select('id')
            .single()
          if (newProfileError || !newProfile) {
            throw new Error(
              `Failed to create profile: ${
                newProfileError?.message || 'Unknown error'
              }`
            )
          }
          actualCandidateProfileId = newProfile.id
        } else {
          actualCandidateProfileId = profile.id
        }
        console.log(
          `[Action: parseAndStore] Candidate Profile ID: ${actualCandidateProfileId}`
        )

        const resumeText = await extractTextFromFile(file)
        if (!resumeText.trim()) {
          throw new Error(
            'Could not extract text from the resume or file is empty.'
          )
        }
        console.log(
          `[Action: parseAndStore] Text extracted for Profile ID: ${actualCandidateProfileId}`
        )

        try {
          const { object } = await generateObject({
            model: openai('gpt-4o-mini'),
            system: `You are an expert resume parser. Extract information from the provided resume text and return it in a structured JSON format strictly according to the provided schema.
          Focus on accuracy. If a field is not present or clearly identifiable in the resume, omit it or use an appropriate null/empty value as per the schema's optional fields.
          Prioritize information typically found in standard resume sections like contact details, summary, work experience, education, and skills.
          For dates, try to infer a consistent format like YYYY-MM or Month YYYY if possible, but return what's written if ambiguous.
          For descriptions/responsibilities, keep them concise.`,
            prompt: `Please parse the following resume text:

          --- RESUME TEXT START ---
          ${resumeText}
          --- RESUME TEXT END ---

          Extract the information into the JSON schema provided.`,
            schema: resumeSchema,
          })
          parsedDataFromAI = object as ResumeData
        } catch (aiErr) {
          console.error(
            `[Action: parseAndStore] AI parsing error for Profile ID: ${actualCandidateProfileId}:`,
            aiErr
          )
          const message =
            aiErr instanceof Error ? aiErr.message : 'AI parsing failed.'
          throw new Error(`AI Error: ${message}`)
        }
        console.log(
          `[Action: parseAndStore] AI parsing successful for Profile ID: ${actualCandidateProfileId}`
        )

        const sanitizedOriginalFilename = file.name.replace(
          /[^a-zA-Z0-9._-]/g,
          '_'
        )
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
        const uniqueFilename = `${timestamp}_${sanitizedOriginalFilename}`
        const r2Key = `candidates/${authUserId}/resumes/${uniqueFilename}`

        const fileBuffer = await file.arrayBuffer()
        await s3Client.send(
          new PutObjectCommand({
            Bucket: R2_BUCKET_NAME,
            Key: r2Key,
            Body: Buffer.from(fileBuffer),
            ContentType: file.type,
          })
        )
        console.log(
          `[Action: parseAndStore] File uploaded to R2 for Auth User ID: ${authUserId}, Key: ${r2Key}`
        )

        const { error } = await supabase.rpc('process_uploaded_resume', {
          p_auth_user_id: authUserId,
          p_file_name: file.name,
          p_file_type: 'resume',
          p_mime_type: file.type,
          p_storage_path: r2Key,
          p_size_bytes: file.size,
          p_parsed_resume_data: parsedDataFromAI,
        })

        if (error) {
          throw new Error(`Failed to save file record: ${error.message}`)
        }
        console.log(
          `[Action: parseAndStore] RPC successful for Profile ID: ${actualCandidateProfileId}`
        )

        console.log(
          `[Action: parseAndStore] Completed successfully for Auth User ID: ${authUserId}`
        )
        return {
          success: true,
          data: {
            extractedData: parsedDataFromAI,
            message: 'Resume processed and stored successfully!',
          },
        }
      } catch (error: unknown) {
        let errorMessage =
          'An unexpected error occurred during resume processing.'
        if (error instanceof Error) {
          errorMessage = error.message
        }
        console.error(
          `[Action: parseAndStore] Overall catch block error for Auth User ID: ${authUserId}:`,
          errorMessage,
          error
        )
        return {
          success: false,
          error: {
            code: 'ACTION_FAILED',
            message: errorMessage,
          },
        }
      }
    }
  )
