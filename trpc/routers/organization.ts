import { createJobPosting, deleteJobPosting, updateJobPosting } from '@/supabase/mutations/organization'
import { getJobPostingById, getJobPostingsByOrganization, getOrganizationUsers } from '@/supabase/queries/organization'
import type { Json, TablesInsert } from '@/supabase/types/db'
import { TRPCError } from '@trpc/server'
import { z } from 'zod'
import { createTRPCRouter, organizationProcedure } from '../init'

const jobStatusEnum = z.enum(['draft', 'published', 'archived', 'closed'])
const jobTypeEnum = z.enum(['full_time', 'part_time', 'contract', 'internship', 'temporary'])
const salaryTypeEnum = z.enum(['salary', 'hourly'])
const experienceLevelEnum = z.enum(['entry', 'mid', 'senior', 'lead', 'executive'])

export const organizationRouter = createTRPCRouter({
  listJobs: organizationProcedure
    .input(
      z.object({
        cursor: z.string().optional(),
        limit: z.number().min(1).max(100).default(50),
        search: z.string().optional(),
        status: jobStatusEnum.optional(),
        sort: z.array(z.string()).length(2).optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const { cursor, limit, search, status, sort } = input
      const organizationId = ctx.organizationId

      let query = ctx.supabase
        .from('job_postings')
        .select(
          `
          id,
          title,
          job_type,
          status,
          department,
          experience_level,
          salary_min,
          salary_max,
          salary_type,
          created_at,
          updated_at
        `,
          { count: 'exact' }
        )
        .eq('organization_id', organizationId)

      // Search filter
      if (search) {
        query = query.or(`title.ilike.%${search}%,department.ilike.%${search}%`)
      }

      // Status filter
      if (status) {
        query = query.eq('status', status)
      }

      // Sorting
      if (sort && sort.length === 2) {
        const [column, direction] = sort
        query = query.order(column, { ascending: direction === 'asc' })
      } else {
        query = query.order('created_at', { ascending: false })
      }

      // Cursor pagination
      if (cursor) {
        query = query.lt('created_at', cursor)
      }

      query = query.limit(limit)

      const { data, error, count } = await query

      if (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch job postings',
        })
      }

      const nextCursor = data && data.length === limit ? data[data.length - 1]?.created_at : undefined

      return {
        data: data || [],
        meta: {
          count: count || 0,
          cursor: nextCursor,
        },
      }
    }),

  createJobPosting: organizationProcedure
    .input(
      z.object({
        title: z.string().min(1, 'Job title is required'),
        job_type: jobTypeEnum,
        content: z.record(z.unknown()).optional(),
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
        content: input.content as Json,
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
        content: z.record(z.unknown()).optional(),
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
        return await updateJobPosting(ctx.supabase, {
          ...input,
          content: input.content as Json,
        })
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
