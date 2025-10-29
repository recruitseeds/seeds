import { createRoute, z } from '@hono/zod-openapi'
import type { Database } from '@seeds/supabase/types/db'
import { createClient } from '@supabase/supabase-js'
import type { Context } from 'hono'
import { createOpenAPIApp, ErrorResponseSchema, MetadataSchema } from '../../../lib/openapi.js'
import { ConfigService } from '../../../services/config.js'
import { Logger } from '../../../services/logger.js'

const testSavedJobsRoutes = createOpenAPIApp()

const SavedJobResponseSchema = z
  .object({
    success: z.literal(true).describe('Indicates successful response'),
    data: z
      .object({
        id: z.string().uuid().describe('Saved job entry ID'),
        jobId: z.string().uuid().describe('Job posting ID'),
        savedAt: z.string().describe('When the job was saved'),
      })
      .describe('Saved job information'),
    metadata: MetadataSchema,
  })
  .describe('Successful save job response')

const SavedJobCheckResponseSchema = z
  .object({
    success: z.literal(true).describe('Indicates successful response'),
    data: z
      .object({
        isSaved: z.boolean().describe('Whether the job is currently saved by the user'),
      })
      .describe('Saved job status information'),
    metadata: MetadataSchema,
  })
  .describe('Saved job status check response')

const saveJobTestRoute = createRoute({
  method: 'post',
  path: '/',
  tags: ['Test - Saved Jobs'],
  summary: '[TEST] Save a job posting (no auth)',
  description: `
TEST ENDPOINT - No authentication required.

Save a job posting for later reference. This creates a saved job entry
that can be retrieved later.
  `,
  request: {
    body: {
      content: {
        'application/json': {
          schema: z.object({
            jobId: z.string().uuid().describe('Job posting ID to save'),
          }),
        },
      },
      description: 'Job ID to save',
    },
  },
  responses: {
    200: {
      content: {
        'application/json': {
          schema: SavedJobResponseSchema,
        },
      },
      description: 'Job saved successfully',
    },
    400: {
      content: {
        'application/json': {
          schema: ErrorResponseSchema,
        },
      },
      description: 'Invalid request data',
    },
    404: {
      content: {
        'application/json': {
          schema: ErrorResponseSchema,
        },
      },
      description: 'Job posting not found',
    },
    409: {
      content: {
        'application/json': {
          schema: ErrorResponseSchema,
        },
      },
      description: 'Job already saved',
    },
    500: {
      content: {
        'application/json': {
          schema: ErrorResponseSchema,
        },
      },
      description: 'Internal server error',
    },
  },
})

const unsaveJobTestRoute = createRoute({
  method: 'delete',
  path: '/{jobId}',
  tags: ['Test - Saved Jobs'],
  summary: '[TEST] Remove a saved job (no auth)',
  description: `
TEST ENDPOINT - No authentication required.

Remove a job from the saved jobs list.
  `,
  request: {
    params: z.object({
      jobId: z.string().uuid().describe('Job posting ID to unsave'),
    }),
  },
  responses: {
    200: {
      content: {
        'application/json': {
          schema: z.object({
            success: z.literal(true),
            metadata: MetadataSchema,
          }),
        },
      },
      description: 'Job unsaved successfully',
    },
    404: {
      content: {
        'application/json': {
          schema: ErrorResponseSchema,
        },
      },
      description: 'Saved job not found',
    },
    500: {
      content: {
        'application/json': {
          schema: ErrorResponseSchema,
        },
      },
      description: 'Internal server error',
    },
  },
})

const checkSavedJobTestRoute = createRoute({
  method: 'get',
  path: '/{jobId}/check',
  tags: ['Test - Saved Jobs'],
  summary: '[TEST] Check if job is saved (no auth)',
  description: `
TEST ENDPOINT - No authentication required.

Check whether a specific job is currently saved.
  `,
  request: {
    params: z.object({
      jobId: z.string().uuid().describe('Job posting ID to check'),
    }),
  },
  responses: {
    200: {
      content: {
        'application/json': {
          schema: SavedJobCheckResponseSchema,
        },
      },
      description: 'Successfully checked saved job status',
    },
    400: {
      content: {
        'application/json': {
          schema: ErrorResponseSchema,
        },
      },
      description: 'Invalid job ID',
    },
    500: {
      content: {
        'application/json': {
          schema: ErrorResponseSchema,
        },
      },
      description: 'Internal server error',
    },
  },
})

// Database operations for saved jobs

testSavedJobsRoutes.openapi(saveJobTestRoute, async (c: Context): Promise<any> => {
  const startTime = Date.now()
  const correlationId = c.get('correlationId') || crypto.randomUUID()
  const logger = new Logger({ correlationId, requestId: c.get('requestId') })

  try {
    const body = await c.req.json()
    const { jobId, email = 'test@example.com' } = body

    if (!jobId) {
      return c.json(
        {
          success: false as const,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Job ID is required',
          },
          timestamp: new Date().toISOString(),
          correlationId,
        },
        400
      )
    }

    logger.info('Saving job (test endpoint)', { jobId, email })

    const config = ConfigService.getInstance().getConfig()
    const supabase = createClient<Database>(config.supabaseUrl, config.supabaseServiceRoleKey)

    // Check if job exists
    const { data: job, error: jobError } = await supabase
      .from('job_postings')
      .select('id, title')
      .eq('id', jobId)
      .eq('status', 'published')
      .single()

    if (jobError || !job) {
      logger.warn('Job not found for saving (test endpoint)', { jobId, error: jobError?.message })
      return c.json(
        {
          success: false as const,
          error: {
            code: 'JOB_NOT_FOUND',
            message: 'Job posting not found or not published',
          },
          timestamp: new Date().toISOString(),
          correlationId,
        },
        404
      )
    }

    // Try to insert saved job (will fail if already exists due to unique constraint)
    const { data: savedJob, error: saveError } = await supabase
      .from('saved_jobs')
      .insert({
        job_id: jobId,
        candidate_email: email,
        saved_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (saveError) {
      if (saveError.code === '23505') { // Unique constraint violation
        logger.info('Job already saved (test endpoint)', { jobId, email })
        return c.json(
          {
            success: false as const,
            error: {
              code: 'ALREADY_SAVED',
              message: 'Job is already saved',
            },
            timestamp: new Date().toISOString(),
            correlationId,
          },
          409
        )
      }

      logger.error('Failed to save job (test endpoint)', {
        jobId,
        email,
        error: saveError.message
      })
      throw saveError
    }

    logger.info('Job saved successfully (test endpoint)', {
      jobId,
      email,
      savedJobId: savedJob.id,
      processingTimeMs: Date.now() - startTime,
    })

    return c.json({
      success: true as const,
      data: {
        id: savedJob.id,
        jobId: savedJob.job_id,
        savedAt: savedJob.saved_at || new Date().toISOString(),
      },
      metadata: {
        processingTimeMs: Date.now() - startTime,
        correlationId,
        timestamp: new Date().toISOString(),
      },
    })
  } catch (error) {
    logger.error('Failed to save job (test endpoint)', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    })

    return c.json(
      {
        success: false as const,
        error: {
          code: 'SAVE_ERROR',
          message: 'An error occurred while saving the job. Please try again.',
        },
        timestamp: new Date().toISOString(),
        correlationId,
      },
      500
    )
  }
})

testSavedJobsRoutes.openapi(unsaveJobTestRoute, async (c: Context): Promise<any> => {
  const startTime = Date.now()
  const correlationId = c.get('correlationId') || crypto.randomUUID()
  const logger = new Logger({ correlationId, requestId: c.get('requestId') })

  try {
    const params = c.req.param()
    const jobId = params.jobId
    const email = c.req.query('email') || 'test@example.com' // Default for testing

    logger.info('Unsaving job (test endpoint)', { jobId, email })

    const config = ConfigService.getInstance().getConfig()
    const supabase = createClient<Database>(config.supabaseUrl, config.supabaseServiceRoleKey)

    // Delete the saved job
    const { data: deletedJob, error: deleteError } = await supabase
      .from('saved_jobs')
      .delete()
      .eq('job_id', jobId)
      .eq('candidate_email', email)
      .select()
      .maybeSingle()

    if (deleteError) {
      logger.error('Failed to unsave job (test endpoint)', {
        jobId,
        email,
        error: deleteError.message
      })
      throw deleteError
    }

    if (!deletedJob) {
      logger.warn('Job not found in saved jobs (test endpoint)', { jobId, email })
      return c.json(
        {
          success: false as const,
          error: {
            code: 'NOT_SAVED',
            message: 'Job is not currently saved',
          },
          timestamp: new Date().toISOString(),
          correlationId,
        },
        404
      )
    }

    logger.info('Job unsaved successfully (test endpoint)', {
      jobId,
      email,
      processingTimeMs: Date.now() - startTime,
    })

    return c.json({
      success: true as const,
      metadata: {
        processingTimeMs: Date.now() - startTime,
        correlationId,
        timestamp: new Date().toISOString(),
      },
    })
  } catch (error) {
    logger.error('Failed to unsave job (test endpoint)', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    })

    return c.json(
      {
        success: false as const,
        error: {
          code: 'UNSAVE_ERROR',
          message: 'An error occurred while unsaving the job. Please try again.',
        },
        timestamp: new Date().toISOString(),
        correlationId,
      },
      500
    )
  }
})

testSavedJobsRoutes.openapi(checkSavedJobTestRoute, async (c: Context): Promise<any> => {
  const startTime = Date.now()
  const correlationId = c.get('correlationId') || crypto.randomUUID()
  const logger = new Logger({ correlationId, requestId: c.get('requestId') })

  try {
    const params = c.req.param()
    const jobId = params.jobId
    const email = c.req.query('email') || 'test@example.com' // Default for testing

    logger.info('Checking saved job status (test endpoint)', { jobId, email })

    const config = ConfigService.getInstance().getConfig()
    const supabase = createClient<Database>(config.supabaseUrl, config.supabaseServiceRoleKey)

    // Check if job is saved
    const { data: savedJob, error: checkError } = await supabase
      .from('saved_jobs')
      .select('id')
      .eq('job_id', jobId)
      .eq('candidate_email', email)
      .maybeSingle()

    if (checkError) {
      logger.error('Failed to check saved job status (test endpoint)', {
        jobId,
        email,
        error: checkError.message
      })
      throw checkError
    }

    const isSaved = !!savedJob

    logger.info('Saved job status checked (test endpoint)', {
      jobId,
      email,
      isSaved,
      processingTimeMs: Date.now() - startTime,
    })

    return c.json({
      success: true as const,
      data: {
        isSaved,
      },
      metadata: {
        processingTimeMs: Date.now() - startTime,
        correlationId,
        timestamp: new Date().toISOString(),
      },
    })
  } catch (error) {
    logger.error('Failed to check saved job status (test endpoint)', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    })

    return c.json(
      {
        success: false as const,
        error: {
          code: 'CHECK_ERROR',
          message: 'An error occurred while checking saved job status. Please try again.',
        },
        timestamp: new Date().toISOString(),
        correlationId,
      },
      500
    )
  }
})

export { testSavedJobsRoutes }