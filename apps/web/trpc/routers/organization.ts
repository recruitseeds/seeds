import {
  createJobPosting,
  deleteJobPosting,
  duplicateJobPosting,
  updateJobPosting,
} from '@/supabase/mutations/organization'
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
          updated_at,
          hiring_manager_id,
          hiring_manager:organization_users!hiring_manager_id(
            id,
            user_id,
            name,
            email
          )
        `,
          { count: 'exact' }
        )
        .eq('organization_id', organizationId)

      if (search) {
        query = query.or(`title.ilike.%${search}%,department.ilike.%${search}%`)
      }

      if (status) {
        query = query.eq('status', status)
      }

      if (sort && sort.length === 2) {
        const [column, direction] = sort
        query = query.order(column, { ascending: direction === 'asc' })
      } else {
        query = query.order('created_at', { ascending: false })
      }

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

      const enrichedData = await Promise.all(
        (data || []).map(async (job) => {
          const hiring_manager_name = job.hiring_manager?.name || job.hiring_manager?.email || null

          const { count: applicant_count } = await ctx.supabase
            .from('job_applications')
            .select('*', { count: 'exact', head: true })
            .eq('job_posting_id', job.id)

          return {
            ...job,
            hiring_manager_name,
            applicant_count: applicant_count || 0,
          }
        })
      )

      const nextCursor =
        enrichedData && enrichedData.length === limit ? enrichedData[enrichedData.length - 1]?.created_at : undefined

      return {
        data: enrichedData || [],
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
        created_by: orgUser.id,
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
        published_at: z.string().datetime().optional().nullable(),
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

  duplicateJobPosting: organizationProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      try {
        return await duplicateJobPosting(ctx.supabase, input.id)
      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error instanceof Error ? error.message : 'Failed to duplicate job posting',
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
        pageSize: z.number().min(1).max(1000).default(10),
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

  getUserSettings: organizationProcedure.query(async ({ ctx }) => {
    const organizationId = ctx.organizationId
    if (!organizationId) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'Organization ID is required',
      })
    }

    const { data, error } = await ctx.supabase
      .from('organization_users')
      .select('settings')
      .eq('user_id', ctx.user.id)
      .eq('organization_id', organizationId)
      .single()

    if (error) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: `Failed to fetch user settings: ${error.message}`,
      })
    }

    return data?.settings || null
  }),

  updateUserSettings: organizationProcedure
    .input(
      z.object({
        settings: z.record(z.unknown()),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const organizationId = ctx.organizationId
      if (!organizationId) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Organization ID is required',
        })
      }

      const { data, error } = await ctx.supabase
        .from('organization_users')
        .update({ settings: input.settings as Json })
        .eq('user_id', ctx.user.id)
        .eq('organization_id', organizationId)
        .select('settings')
        .single()

      if (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Failed to update user settings: ${error.message}`,
        })
      }

      return data?.settings || null
    }),

  updateUserSettingsPartial: organizationProcedure
    .input(
      z.object({
        path: z.string(),
        value: z.unknown(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const organizationId = ctx.organizationId
      if (!organizationId) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Organization ID is required',
        })
      }

      // First get current settings
      const { data: currentData, error: fetchError } = await ctx.supabase
        .from('organization_users')
        .select('settings')
        .eq('user_id', ctx.user.id)
        .eq('organization_id', organizationId)
        .single()

      if (fetchError) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Failed to fetch current settings: ${fetchError.message}`,
        })
      }

      // Merge the new value into existing settings
      const currentSettings = (currentData?.settings as Record<string, unknown>) || {}
      const pathParts = input.path.split('.')
      let target = currentSettings

      // Navigate to the parent of the target property
      for (let i = 0; i < pathParts.length - 1; i++) {
        if (!(pathParts[i] in target)) {
          target[pathParts[i]] = {}
        }
        target = target[pathParts[i]] as Record<string, unknown>
      }

      // Set the value
      target[pathParts[pathParts.length - 1]] = input.value

      // Update the database
      const { data, error } = await ctx.supabase
        .from('organization_users')
        .update({ settings: currentSettings as Json })
        .eq('user_id', ctx.user.id)
        .eq('organization_id', organizationId)
        .select('settings')
        .single()

      if (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Failed to update user settings: ${error.message}`,
        })
      }

      return data?.settings || null
    }),

  // Pipeline Management
  createPipeline: organizationProcedure
    .input(
      z.object({
        name: z.string().min(1, 'Pipeline name is required'),
        description: z.string().optional().nullable(),
        category_id: z.string().uuid().optional().nullable(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const organizationId = ctx.organizationId
      if (!organizationId) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Organization ID is required',
        })
      }

      const { data: orgUser } = await ctx.supabase
        .from('organization_users')
        .select('id')
        .eq('user_id', ctx.user.id)
        .eq('organization_id', organizationId)
        .single()

      if (!orgUser) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Organization user record not found',
        })
      }

      const { data, error } = await ctx.supabase
        .from('hiring_pipelines')
        .insert({
          ...input,
          organization_id: organizationId,
          created_by: orgUser.id,
          status: 'active',
        })
        .select('*')
        .single()

      if (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Failed to create pipeline: ${error.message}`,
        })
      }

      return data
    }),

  listPipelines: organizationProcedure.query(async ({ ctx }) => {
    const organizationId = ctx.organizationId
    if (!organizationId) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'Organization ID is required',
      })
    }

    const { data, error } = await ctx.supabase
      .from('hiring_pipelines')
      .select(
        `
        *,
        pipeline_steps(
          id,
          name,
          step_order,
          description,
          duration_days
        )
      `
      )
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false })

    if (error) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: `Failed to fetch pipelines: ${error.message}`,
      })
    }

    return data || []
  }),

  getPipeline: organizationProcedure.input(z.object({ id: z.string().uuid() })).query(async ({ ctx, input }) => {
    const organizationId = ctx.organizationId
    if (!organizationId) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'Organization ID is required',
      })
    }

    const { data, error } = await ctx.supabase
      .from('hiring_pipelines')
      .select(
        `
          *,
          pipeline_steps(
            id,
            name,
            step_order,
            description,
            duration_days,
            task_owner_id,
            automation_config,
            permissions,
            task_owner:organization_users!task_owner_id(
              id,
              name,
              email
            )
          )
        `
      )
      .eq('id', input.id)
      .eq('organization_id', organizationId)
      .single()

    if (error) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: `Failed to fetch pipeline: ${error.message}`,
      })
    }

    return data
  }),

  // Updated mutation handlers for pipeline steps in your organization router
  // Add these updated mutations to replace the existing ones:

  createPipelineStep: organizationProcedure
    .input(
      z.object({
        pipeline_id: z.string().uuid(),
        name: z.string().min(1, 'Step name is required'),
        description: z.string().optional().nullable(),
        step_order: z.number().int().min(0),
        duration_days: z.number().int().min(0).optional().nullable(),
        task_owner_id: z.string().uuid().optional().nullable(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // First create the step
      const { data, error } = await ctx.supabase
        .from('pipeline_steps')
        .insert(input)
        .select(
          `
        id,
        name,
        step_order,
        description,
        duration_days,
        task_owner_id,
        automation_config,
        permissions,
        task_owner:organization_users!task_owner_id(
          id,
          name,
          email
        )
      `
        )
        .single()

      if (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Failed to create pipeline step: ${error.message}`,
        })
      }

      return data
    }),

  updatePipelineStep: organizationProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        name: z.string().min(1).optional(),
        description: z.string().optional().nullable(),
        step_order: z.number().int().min(0).optional(),
        duration_days: z.number().int().min(0).optional().nullable(),
        task_owner_id: z.string().uuid().optional().nullable(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...updateData } = input

      // Update and return with relations
      const { data, error } = await ctx.supabase
        .from('pipeline_steps')
        .update(updateData)
        .eq('id', id)
        .select(
          `
        id,
        name,
        step_order,
        description,
        duration_days,
        task_owner_id,
        automation_config,
        permissions,
        task_owner:organization_users!task_owner_id(
          id,
          name,
          email
        )
      `
        )
        .single()

      if (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Failed to update pipeline step: ${error.message}`,
        })
      }

      return data
    }),

  deletePipelineStep: organizationProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      // Get the step data before deleting (for optimistic update rollback)
      const { data: stepToDelete } = await ctx.supabase.from('pipeline_steps').select('*').eq('id', input.id).single()

      const { error } = await ctx.supabase.from('pipeline_steps').delete().eq('id', input.id)

      if (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Failed to delete pipeline step: ${error.message}`,
        })
      }

      // Return the deleted step info
      return { success: true, deletedStep: stepToDelete }
    }),

  deletePipeline: organizationProcedure.input(z.object({ id: z.string().uuid() })).mutation(async ({ ctx, input }) => {
    const organizationId = ctx.organizationId
    if (!organizationId) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'Organization ID is required',
      })
    }

    // First delete all pipeline steps
    const { error: stepsError } = await ctx.supabase.from('pipeline_steps').delete().eq('pipeline_id', input.id)

    if (stepsError) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: `Failed to delete pipeline steps: ${stepsError.message}`,
      })
    }

    // Then delete the pipeline
    const { error } = await ctx.supabase
      .from('hiring_pipelines')
      .delete()
      .eq('id', input.id)
      .eq('organization_id', organizationId)

    if (error) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: `Failed to delete pipeline: ${error.message}`,
      })
    }

    return { success: true }
  }),

  updatePipelineStatus: organizationProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        status: z.enum(['active', 'inactive', 'archived']),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const organizationId = ctx.organizationId
      if (!organizationId) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Organization ID is required',
        })
      }

      const { data, error } = await ctx.supabase
        .from('hiring_pipelines')
        .update({ status: input.status })
        .eq('id', input.id)
        .eq('organization_id', organizationId)
        .select('*')
        .single()

      if (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Failed to update pipeline status: ${error.message}`,
        })
      }

      return data
    }),
})
