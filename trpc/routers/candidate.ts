// src/trpc/routers/candidate.ts

import { R2_BUCKET_NAME, getS3Client, uploadFileToR2AndRecord } from '@/lib/s3-client'
import {
  createCandidateApplication,
  createCandidateEducation,
  createCandidateSkill,
  createCandidateWorkExperience,
  createMultipleCandidateApplications,
  deleteCandidateEducation,
  deleteCandidateSkill,
  deleteCandidateWorkExperience,
  updateCandidateEducation,
  updateCandidateProfile,
  updateCandidateWorkExperience,
} from '@/supabase/mutations'
import {
  getCandidateApplicationsPaginated,
  getCandidateContactInfo,
  getCandidateEducation,
  getCandidateFilesByCandidateId,
  getCandidateProfile,
  getCandidateWorkExperienceById,
  getCandidateWorkExperiences,
  getDefaultCandidateResume,
} from '@/supabase/queries'
import type { Database, TablesInsert } from '@/supabase/types/db'
import { DeleteObjectCommand } from '@aws-sdk/client-s3'
import type { PostgrestError } from '@supabase/supabase-js'
import { TRPCError } from '@trpc/server'
import { z } from 'zod'
import { candidateProcedure, createTRPCRouter } from '../init'

const applicationStatusEnum = z.enum(['applied', 'in-review', 'interview', 'rejected', 'offer'])
const applicationSourceEnum = z.enum(['platform', 'manual', 'import'])

const baseApplicationSchema = {
  job_title: z.string().min(1, 'Job title is required.'),
  company_name: z.string().min(1, 'Company name is required.'),
  application_date: z.string().datetime({ message: 'Invalid date format.' }),
  application_url: z.string().url().optional().nullable(),
  company_logo_url: z.string().url().optional().nullable(),
  contact_email: z.string().email().optional().nullable(),
  contact_person: z.string().optional().nullable(),
  next_step_date: z.string().datetime().optional().nullable(),
  next_step_description: z.string().optional().nullable(),
  salary_range: z.string().optional().nullable(),
  source: applicationSourceEnum.optional().default('manual'),
  status: applicationStatusEnum.optional().default('applied'),
  job_id: z.string().optional().nullable(),
}

const candidateFileTypeEnum = z.enum(['resume', 'cover_letter', 'transcript', 'other'])

type ApplicationStatusType = Database['public']['Enums']['candidate_application_status']

export const candidateRouter = createTRPCRouter({
  getProfile: candidateProcedure.query(async ({ ctx }) => {
    const { data, error } = await getCandidateProfile(ctx.supabase, ctx.user.id)
    if (error) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: `Failed to get profile: ${(error as { message?: string })?.message ?? String(error)}`,
      })
    }
    return data
  }),

  updateProfile: candidateProcedure
    .input(
      z.object({
        first_name: z.string().min(1).max(255).optional().nullable(),
        last_name: z.string().min(1).max(255).optional().nullable(),
        job_title: z.string().max(255).optional().nullable(),
        phone_number: z.string().max(50).optional().nullable(),
        location: z.string().max(255).optional().nullable(),
        personal_website_url: z.string().url().optional().nullable(),
        linkedin_url: z.string().url().optional().nullable(),
        github_url: z.string().url().optional().nullable(),
        twitter_url: z.string().url().optional().nullable(),
        bio: z.string().max(2000).optional().nullable(),
        is_onboarded: z.boolean().optional(),
        avatar_url: z.string().optional().nullable(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return updateCandidateProfile(ctx.supabase, {
        id: ctx.user.id,
        ...input,
      })
    }),

  listEducation: candidateProcedure.query(async ({ ctx }) => {
    const { data, error } = await getCandidateEducation(ctx.supabase, ctx.user.id)
    if (error) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: `Failed to list education: ${error.message}`,
      })
    }
    return data
  }),

  createEducation: candidateProcedure
    .input(
      z.object({
        institution_name: z.string().min(1),
        degree_name: z.string().min(1),
        field_of_study: z.string().optional().nullable(),
        start_date: z.string().datetime({ offset: true }),
        end_date: z.string().datetime({ offset: true }).optional().nullable(),
        description: z.string().optional().nullable(),
        is_current: z.boolean().default(false),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const params: TablesInsert<'candidate_education'> = {
        ...input,
        candidate_id: ctx.user.id,
      }
      return createCandidateEducation(ctx.supabase, params)
    }),

  updateEducation: candidateProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        institution_name: z.string().min(1).optional(),
        degree_name: z.string().optional().nullable(),
        field_of_study: z.string().optional().nullable(),
        start_date: z.string().datetime({ offset: true }).optional(),
        end_date: z.string().datetime({ offset: true }).optional().nullable(),
        description: z.string().optional().nullable(),
        is_current: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return updateCandidateEducation(ctx.supabase, ctx.user.id, input)
    }),

  deleteEducation: candidateProcedure
    .input(z.object({ educationId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      return deleteCandidateEducation(ctx.supabase, input.educationId, ctx.user.id)
    }),

  listWorkExperiences: candidateProcedure.query(async ({ ctx }) => {
    const { data, error } = await getCandidateWorkExperiences(ctx.supabase, ctx.user.id)
    if (error) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: `Failed to list work experiences: ${error.message}`,
      })
    }
    return data
  }),

  getWorkExperienceById: candidateProcedure
    .input(z.object({ workExperienceId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const { data, error } = await getCandidateWorkExperienceById(ctx.supabase, input.workExperienceId, ctx.user.id)
      if (error) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: `Work experience not found or access denied: ${error.message}`,
        })
      }
      return data
    }),

  listSkills: candidateProcedure.query(async ({ ctx }) => {
    const { data: skillsData, error: skillsError } = await ctx.supabase
      .from('candidate_skills')
      .select('id, skill_name, proficiency_level')
      .eq('candidate_id', ctx.user.id)
      .order('skill_name', { ascending: true })

    if (skillsError) {
      console.error('Error fetching skills:', skillsError)
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to fetch skills',
      })
    }

    if (!skillsData) return []

    const proficiencyMap: Record<number, string> = {
      1: 'beginner',
      2: 'intermediate',
      3: 'advanced',
      4: 'expert',
    }

    return skillsData.map((skill) => ({
      id: skill.id,
      name: skill.skill_name,
      proficiency_level: proficiencyMap[skill.proficiency_level || 2] || 'intermediate',
    }))
  }),

  createWorkExperience: candidateProcedure
    .input(
      z.object({
        job_title: z.string().min(1),
        company_name: z.string().min(1),
        location: z.string().optional().nullable(),
        start_date: z.string().datetime({ offset: true }),
        end_date: z.string().datetime({ offset: true }).optional().nullable(),
        description: z.string().optional().nullable(),
        is_current: z.boolean().optional().default(false),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const params: TablesInsert<'candidate_work_experiences'> = {
        ...input,
        candidate_id: ctx.user.id,
      }
      return createCandidateWorkExperience(ctx.supabase, params)
    }),

  updateWorkExperience: candidateProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        job_title: z.string().min(1).optional(),
        company_name: z.string().min(1).optional(),
        location: z.string().optional().nullable(),
        start_date: z.string().datetime({ offset: true }).optional(),
        end_date: z.string().datetime({ offset: true }).optional().nullable(),
        description: z.string().optional().nullable(),
        is_current: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return updateCandidateWorkExperience(ctx.supabase, ctx.user.id, input)
    }),

  deleteWorkExperience: candidateProcedure
    .input(z.object({ workExperienceId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      return deleteCandidateWorkExperience(ctx.supabase, input.workExperienceId, ctx.user.id)
    }),

  listFiles: candidateProcedure.query(async ({ ctx }) => {
    return getCandidateFilesByCandidateId(ctx.supabase, ctx.user.id)
  }),

  getDefaultResume: candidateProcedure.query(async ({ ctx }) => {
    return getDefaultCandidateResume(ctx.supabase, ctx.user.id)
  }),

  uploadFile: candidateProcedure
    .input(
      z.object({
        fileName: z.string(),
        fileMimeType: z.string(),
        fileContentBase64: z.string(),
        fileCategoryForR2Path: z.enum([
          'resume',
          'cover_letter',
          'transcript',
          'other',
          'portfolio',
          'certification',
          'reference',
          'eligibility',
        ]),
        dbFileType: candidateFileTypeEnum,
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!R2_BUCKET_NAME) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'R2 bucket name is not configured on the server.',
        })
      }
      const s3Client = getS3Client()

      try {
        const fileBuffer = Buffer.from(input.fileContentBase64, 'base64')
        const pseudoFile = {
          name: input.fileName,
          type: input.fileMimeType,
          size: fileBuffer.byteLength,
          arrayBuffer: async () => fileBuffer,
          stream: () => new ReadableStream(),
        } as unknown as File

        return await uploadFileToR2AndRecord(
          ctx.supabase,
          s3Client,
          R2_BUCKET_NAME,
          ctx.user.id,
          pseudoFile,
          input.fileCategoryForR2Path,
          input.dbFileType
        )
      } catch (error: unknown) {
        console.error('Error in uploadFile tRPC mutation:', error)
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `File upload failed: ${error instanceof Error ? error.message : String(error)}`,
        })
      }
    }),

  deleteFile: candidateProcedure.input(z.object({ fileId: z.string().uuid() })).mutation(async ({ ctx, input }) => {
    const { data: file, error: fetchError } = await ctx.supabase
      .from('candidate_files')
      .select('storage_path')
      .eq('id', input.fileId)
      .eq('candidate_id', ctx.user.id)
      .single()

    if (fetchError || !file) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'File not found or you do not have permission to delete it.',
      })
    }

    try {
      const s3Client = getS3Client()
      await s3Client.send(
        new DeleteObjectCommand({
          Bucket: R2_BUCKET_NAME,
          Key: file.storage_path,
        })
      )
    } catch (r2Error) {
      console.error(`Failed to delete file from R2 storage: ${file.storage_path}`, r2Error)
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Could not delete file from storage. Please try again.',
      })
    }

    const { error: deleteDbError } = await ctx.supabase.from('candidate_files').delete().eq('id', input.fileId)

    if (deleteDbError) {
      console.error(`Failed to delete file record from database: ${input.fileId}`, deleteDbError)
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to delete file record. Please try again.',
      })
    }

    return { success: true }
  }),

  setDefaultResume: candidateProcedure
    .input(z.object({ fileId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const { error: transactionError } = await ctx.supabase.rpc('set_default_resume_for_candidate', {
        p_candidate_id: ctx.user.id,
        p_file_id: input.fileId,
      })

      if (transactionError) {
        console.error('Error in set_default_resume RPC:', transactionError)
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Failed to set default resume: ${transactionError.message}`,
        })
      }

      return { success: true }
    }),

  listApplications: candidateProcedure
    .input(
      z.object({
        page: z.number().min(1).default(1),
        pageSize: z.number().min(1).max(100).default(10),
        search: z.string().optional(),
        status: applicationStatusEnum.optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const result = await getCandidateApplicationsPaginated(
        ctx.supabase,
        ctx.user.id,
        input.page,
        input.pageSize,
        input.search,
        input.status
      )
      if (result.error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Failed to list applications: ${result.error.message}`,
        })
      }
      return { data: result.data, count: result.count }
    }),

  getApplicationSummary: candidateProcedure.query(async ({ ctx }) => {
    const candidateId = ctx.user.id

    const { data: applications, error } = await ctx.supabase
      .from('candidate_applications')
      .select('status')
      .eq('candidate_id', candidateId)

    if (error) {
      console.error('Error fetching applications for summary:', error)
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to fetch application summary.',
      })
    }

    let inReview = 0
    let interviews = 0
    let offers = 0

    const statusMap: {
      [key in ApplicationStatusType]?: 'inReview' | 'interviews' | 'offers'
    } = {
      applied: undefined,
      'in-review': 'inReview',
      interview: 'interviews',
      rejected: undefined,
      offer: 'offers',
    }

    for (const app of applications) {
      const category = statusMap[app.status as ApplicationStatusType]
      if (category === 'inReview') {
        inReview++
      } else if (category === 'interviews') {
        interviews++
      } else if (category === 'offers') {
        offers++
      }
    }

    return {
      total: applications.length,
      inReview,
      interviews,
      offers,
    }
  }),

  createApplication: candidateProcedure.input(z.object(baseApplicationSchema)).mutation(async ({ ctx, input }) => {
    const params: TablesInsert<'candidate_applications'> = {
      ...input,
      candidate_id: ctx.user.id,
    }
    try {
      return await createCandidateApplication(ctx.supabase, params)
    } catch (error) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: error instanceof Error ? error.message : 'Failed to create application',
      })
    }
  }),

  importApplications: candidateProcedure
    .input(z.array(z.object(baseApplicationSchema)))
    .mutation(async ({ ctx, input }) => {
      if (input.length === 0) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'No applications provided for import.',
        })
      }
      const applicationsToInsert: TablesInsert<'candidate_applications'>[] = input.map((app) => ({
        ...app,
        candidate_id: ctx.user.id,
        source: app.source || 'import',
      }))

      try {
        const result = await createMultipleCandidateApplications(ctx.supabase, applicationsToInsert)
        return {
          success: !result.error,
          count: result.count ?? 0,
          errors: result.error ? [(result.error as PostgrestError).message] : [],
        }
      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error instanceof Error ? error.message : 'Failed to import applications',
        })
      }
    }),

  getContactInfo: candidateProcedure.query(async ({ ctx }) => {
    const { data, error } = await getCandidateContactInfo(ctx.supabase, ctx.user.id)

    if (error || !data) {
      return {
        id: ctx.user.id,
        email: ctx.user.email || null,
        first_name: null,
        last_name: null,
        phone_number: null,
        location: null,
        personal_website_url: null,
        linkedin_url: null,
        github_url: null,
        twitter_url: null,
        bio: null,
      }
    }

    return {
      ...data,
      email: ctx.user.email || null,
    }
  }),

  updateContactInfo: candidateProcedure
    .input(
      z.object({
        phone_number: z.string().max(50).optional().nullable(),
        location: z.string().max(255).optional().nullable(),
        personal_website_url: z.string().url().optional().nullable(),
        linkedin_url: z.string().url().optional().nullable(),
        github_url: z.string().url().optional().nullable(),
        twitter_url: z.string().url().optional().nullable(),
        bio: z.string().max(2000).optional().nullable(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return updateCandidateProfile(ctx.supabase, {
        id: ctx.user.id,
        ...input,
      })
    }),

  createSkill: candidateProcedure
    .input(
      z.object({
        skill_name: z.string().min(1, 'Skill name is required'),
        proficiency_level: z.enum(['beginner', 'intermediate', 'advanced', 'expert']).default('intermediate'),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const proficiencyMap: Record<string, number> = {
        beginner: 1,
        intermediate: 2,
        advanced: 3,
        expert: 4,
      }

      const params: TablesInsert<'candidate_skills'> = {
        candidate_id: ctx.user.id,
        category_name: 'General',
        skill_name: input.skill_name,
        proficiency_level: proficiencyMap[input.proficiency_level],
      }

      return createCandidateSkill(ctx.supabase, params)
    }),

  deleteSkill: candidateProcedure.input(z.object({ skillId: z.string().uuid() })).mutation(async ({ ctx, input }) => {
    return deleteCandidateSkill(ctx.supabase, input.skillId, ctx.user.id)
  }),
})
