import { createJobPosting, deleteJobPosting, updateJobPosting } from '@/supabase/mutations/organization'
import { getJobPostingById, getJobPostingsByOrganization, getOrganizationUsers } from '@/supabase/queries/organization'
import type { TablesInsert } from '@/supabase/types/db'
import { TRPCError } from '@trpc/server'
import { z } from 'zod'
import { createTRPCRouter, organizationProcedure } from '../init'

const jobStatusEnum = z.enum(['draft', 'published', 'archived', 'closed'])
const jobTypeEnum = z.enum(['full_time', 'part_time', 'contract', 'internship', 'temporary'])
const salaryTypeEnum = z.enum(['salary', 'hourly'])
const experienceLevelEnum = z.enum(['entry', 'mid', 'senior', 'lead', 'executive'])

export const organizationRouter = createTRPCRouter({
  createJobPosting: organizationProcedure
    .input(
      z.object({
        title: z.string().min(1, 'Job title is required'),
        job_type: jobTypeEnum,
        content: z.any().optional(),
        department: z.string().optional().nullable(),
        experience_level: experienceLevelEnum.optional().nullable(),
        hiring_manager_id: z.string().uuid().optional().nullable(),
        salary_min: z.number().positive().optional().nullable(),
        salary_max: z.number().positive().optional().nullable(),
        salary_type: salaryTypeEnum.optional().nullable(),
        status: jobStatusEnum.optional().default('draft'),
        pipeline_id: z.string().uuid().optional().nullable(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const organizationId = ctx.organizationId
      if (!organizationId) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Organization ID is required to create job posting',
        })
      }

      // Get the organization_users record for the current user
      const { data: orgUser, error: orgUserError } = await ctx.supabase
        .from('organization_users')
        .select('id')
        .eq('user_id', ctx.user.id)
        .eq('organization_id', organizationId)
        .single()

      if (orgUserError || !orgUser) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Organization user record not found',
        })
      }

      const params: TablesInsert<'job_postings'> = {
        ...input,
        organization_id: organizationId,
        created_by: orgUser.id, // Use organization_users.id instead of auth.users.id
      }

      try {
        return await createJobPosting(ctx.supabase, params)
      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error instanceof Error ? error.message : 'Failed to create job posting',
        })
      }
    }),
  updateJobPosting: organizationProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        title: z.string().min(1).optional(),
        job_type: jobTypeEnum.optional(),
        content: z.any().optional(),
        department: z.string().optional().nullable(),
        experience_level: experienceLevelEnum.optional().nullable(),
        hiring_manager_id: z.string().uuid().optional().nullable(),
        salary_min: z.number().positive().optional().nullable(),
        salary_max: z.number().positive().optional().nullable(),
        salary_type: salaryTypeEnum.optional().nullable(),
        status: jobStatusEnum.optional(),
        pipeline_id: z.string().uuid().optional().nullable(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        return await updateJobPosting(ctx.supabase, input)
      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error instanceof Error ? error.message : 'Failed to update job posting',
        })
      }
    }),
  getJobPosting: organizationProcedure.input(z.object({ id: z.string().uuid() })).query(async ({ ctx, input }) => {
    const { data, error } = await getJobPostingById(ctx.supabase, input.id)
    if (error) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: `Failed to get job posting: ${error.message}`,
      })
    }
    return data
  }),
  listJobPostings: organizationProcedure
    .input(
      z.object({
        page: z.number().min(1).default(1),
        pageSize: z.number().min(1).max(100).default(10),
        status: jobStatusEnum.optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const organizationId = ctx.organizationId
      if (!organizationId) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Organization ID is required',
        })
      }
      const { data, error, count } = await getJobPostingsByOrganization(
        ctx.supabase,
        organizationId,
        input.page,
        input.pageSize,
        input.status
      )
      if (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Failed to list job postings: ${error.message}`,
        })
      }
      return { data, count }
    }),
  deleteJobPosting: organizationProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const result = await deleteJobPosting(ctx.supabase, input.id)
      if (!result.success) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: result.error?.message || 'Failed to delete job posting',
        })
      }
      return { success: true }
    }),
  getOrganizationUsers: organizationProcedure.query(async ({ ctx }) => {
    const organizationId = ctx.organizationId
    if (!organizationId) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'Organization ID is required',
      })
    }
    const { data, error } = await getOrganizationUsers(ctx.supabase, organizationId)
    if (error) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: `Failed to get organization users: ${error.message}`,
      })
    }
    return data || []
  }),
})
