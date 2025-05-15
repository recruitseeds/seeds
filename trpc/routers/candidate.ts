import {
  getS3Client,
  R2_BUCKET_NAME,
  uploadFileToR2AndRecord,
} from '@/lib/s3-client'
import {
  createCandidateApplication,
  createCandidateEducation,
  createCandidateWorkExperience,
  createMultipleCandidateApplications,
  deleteCandidateEducation,
  deleteCandidateWorkExperience,
  updateCandidateEducation,
  updateCandidateProfile,
  updateCandidateWorkExperience,
} from '@/supabase/mutations'
import {
  getCandidateApplicationsPaginated,
  getCandidateEducation,
  getCandidateFilesByCandidateId,
  getCandidateProfile,
  getCandidateWorkExperienceById,
  getCandidateWorkExperiences,
  getDefaultCandidateResume,
} from '@/supabase/queries'
import type { Database, TablesInsert } from '@/supabase/types/db'
import { PostgrestError } from '@supabase/supabase-js'
import { TRPCError } from '@trpc/server'
import { z } from 'zod'
import { candidateProcedure, createTRPCRouter } from '../init'

const applicationStatusEnum = z.enum([
  'applied',
  'in-review',
  'interview',
  'rejected',
  'offer',
])
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

const candidateFileTypeEnum = z.enum([
  'resume',
  'cover_letter',
  'transcript',
  'other',
])

type ApplicationStatus =
  Database['public']['Enums']['candidate_application_status']

export const candidateRouter = createTRPCRouter({
  getProfile: candidateProcedure.query(async ({ ctx }) => {
    const { data, error } = await getCandidateProfile(ctx.supabase, ctx.user.id)
    if (error) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: `Failed to get profile: ${
          (error as { message?: string })?.message ?? String(error)
        }`,
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
    const { data, error } = await getCandidateEducation(
      ctx.supabase,
      ctx.user.id
    )
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
        degree: z.string().optional().nullable(),
        field_of_study: z.string().optional().nullable(),
        start_date: z.string().datetime({ offset: true }).optional(),
        end_date: z.string().datetime({ offset: true }).optional().nullable(),
        description: z.string().optional().nullable(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return updateCandidateEducation(ctx.supabase, ctx.user.id, input)
    }),

  deleteEducation: candidateProcedure
    .input(z.object({ educationId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      return deleteCandidateEducation(
        ctx.supabase,
        input.educationId,
        ctx.user.id
      )
    }),

  listWorkExperiences: candidateProcedure.query(async ({ ctx }) => {
    const { data, error } = await getCandidateWorkExperiences(
      ctx.supabase,
      ctx.user.id
    )
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
      const { data, error } = await getCandidateWorkExperienceById(
        ctx.supabase,
        input.workExperienceId,
        ctx.user.id
      )
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
      .select('id, category_name, skill_name, proficiency_level')
      .eq('candidate_id', ctx.user.id)

    if (skillsError) {
      console.error('Error fetching skills:', skillsError)
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to fetch skills',
      })
    }

    if (!skillsData) return []

    const groupedSkills: Record<
      string,
      { id: string; name: string; skills: string[] }
    > = {}

    for (const skill of skillsData) {
      if (!groupedSkills[skill.category_name]) {
        groupedSkills[skill.category_name] = {
          id: skill.category_name,
          name: skill.category_name,
          skills: [],
        }
      }
      groupedSkills[skill.category_name].skills.push(skill.skill_name)
    }
    return Object.values(groupedSkills)
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
      return deleteCandidateWorkExperience(
        ctx.supabase,
        input.workExperienceId,
        ctx.user.id
      )
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
          'avatar',
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
          arrayBuffer: async () => {
            const ab = new ArrayBuffer(fileBuffer.length)
            const view = new Uint8Array(ab)
            for (let i = 0; i < fileBuffer.length; ++i) {
              view[i] = fileBuffer[i]
            }
            return ab
          },
        } as File

        return await uploadFileToR2AndRecord(
          ctx.supabase,
          s3Client,
          R2_BUCKET_NAME,
          ctx.user.id,
          pseudoFile,
          input.fileCategoryForR2Path,
          input.dbFileType as Database['public']['Enums']['candidate_file_type']
        )
      } catch (error: unknown) {
        console.error('Error in uploadFile tRPC mutation:', error)
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `File upload failed: ${
            error instanceof Error ? error.message : String(error)
          }`,
        })
      }
    }),

  listApplications: candidateProcedure
    .input(
      z.object({
        page: z.number().min(1).default(1),
        pageSize: z.number().min(1).max(100).default(10),
      })
    )
    .query(async ({ ctx, input }) => {
      const result = await getCandidateApplicationsPaginated(
        ctx.supabase,
        ctx.user.id,
        input.page,
        input.pageSize
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
      [key in ApplicationStatus]?: 'inReview' | 'interviews' | 'offers'
    } = {
      applied: undefined,
      'in-review': 'inReview',
      interview: 'interviews',
      rejected: undefined,
      offer: 'offers',
    }

    applications.forEach((app) => {
      const category = statusMap[app.status as ApplicationStatus]
      if (category === 'inReview') {
        inReview++
      } else if (category === 'interviews') {
        interviews++
      } else if (category === 'offers') {
        offers++
      }
    })

    return {
      total: applications.length,
      inReview,
      interviews,
      offers,
    }
  }),

  createApplication: candidateProcedure
    .input(z.object(baseApplicationSchema))
    .mutation(async ({ ctx, input }) => {
      const params: TablesInsert<'candidate_applications'> = {
        ...input,
        candidate_id: ctx.user.id,
      }
      try {
        return await createCandidateApplication(ctx.supabase, params)
      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message:
            error instanceof Error
              ? error.message
              : 'Failed to create application',
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
      const applicationsToInsert: TablesInsert<'candidate_applications'>[] =
        input.map((app) => ({
          ...app,
          candidate_id: ctx.user.id,
          source: app.source || 'import',
        }))

      try {
        const result = await createMultipleCandidateApplications(
          ctx.supabase,
          applicationsToInsert
        )
        return {
          success: !result.error,
          count: result.count ?? 0,
          errors: result.error
            ? [(result.error as PostgrestError).message]
            : [],
        }
      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message:
            error instanceof Error
              ? error.message
              : 'Failed to import applications',
        })
      }
    }),
})
