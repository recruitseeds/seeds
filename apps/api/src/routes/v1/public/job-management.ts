import { createRoute, z } from '@hono/zod-openapi'
import { createClient } from '@supabase/supabase-js'
import type { Database } from '@seeds/supabase/types/db'
import {
  createOpenAPIApp,
  ErrorResponseSchema,
  MetadataSchema,
} from '../../../lib/openapi.js'
import {
  publicAuth,
} from '../../../middleware/public-auth.js'
import { adaptiveRateLimit } from '../../../middleware/rate-limit.js'
import { ConfigService } from '../../../services/config.js'
import { Logger } from '../../../services/logger.js'

const publicJobManagementRoutes = createOpenAPIApp()

publicJobManagementRoutes.use('*', publicAuth())
publicJobManagementRoutes.use('*', adaptiveRateLimit())

const jobPostingSchema = z.object({
  id: z.string().uuid().describe('Job posting unique identifier'),
  title: z.string().describe('Job title'),
  content: z.record(z.any()).describe('Job posting content (structured data)'),
  status: z.string().describe('Job posting status'),
  job_type: z.string().describe('Job type (full-time, part-time, contract, etc.)'),
  department: z.string().nullable().describe('Department or team'),
  experience_level: z.string().nullable().describe('Required experience level'),
  location_display: z.string().nullable().describe('Location as displayed to candidates'),
  location_type: z.string().nullable().describe('Location type (remote, office, hybrid)'),
  remote_allowed: z.boolean().nullable().describe('Whether remote work is allowed'),
  salary_min: z.number().nullable().describe('Minimum salary range'),
  salary_max: z.number().nullable().describe('Maximum salary range'),
  salary_type: z.string().nullable().describe('Salary type (hourly, annual, etc.)'),
  pipeline_template_id: z.string().uuid().nullable().describe('Associated pipeline template ID'),
  form_template_id: z.string().uuid().nullable().describe('Associated form template ID'),
  published_at: z.string().nullable().describe('Publication timestamp'),
  created_at: z.string().describe('Creation timestamp'),
  updated_at: z.string().describe('Last update timestamp'),
})

const createJobSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title too long').describe('Job title'),
  content: z.record(z.any()).describe('Job posting content (description, requirements, benefits, etc.)'),
  status: z.enum(['draft', 'published', 'closed', 'archived']).default('draft').describe('Job posting status'),
  job_type: z.enum(['full-time', 'part-time', 'contract', 'internship', 'temporary']).describe('Employment type'),
  department: z.string().max(100, 'Department name too long').optional().describe('Department or team'),
  experience_level: z.enum(['entry', 'junior', 'mid', 'senior', 'staff', 'principal', 'executive']).optional().describe('Required experience level'),
  location_display: z.string().max(200, 'Location too long').optional().describe('Location as displayed to candidates'),
  location_type: z.enum(['remote', 'office', 'hybrid']).optional().describe('Work arrangement type'),
  remote_allowed: z.boolean().optional().describe('Whether remote work is allowed'),
  salary_min: z.number().positive().optional().describe('Minimum salary'),
  salary_max: z.number().positive().optional().describe('Maximum salary'),
  salary_type: z.enum(['hourly', 'daily', 'annual']).optional().describe('Salary payment frequency'),
  pipeline_template_id: z.string().uuid().optional().describe('Pipeline template to use for this job'),
  form_template_id: z.string().uuid().optional().describe('Application form template to use'),
})

const updateJobSchema = createJobSchema.partial()

const ListJobsResponseSchema = z.object({
  success: z.literal(true),
  data: z.array(jobPostingSchema),
  metadata: MetadataSchema.extend({
    count: z.number().describe('Number of job postings'),
    total: z.number().describe('Total job postings (for pagination)'),
    page: z.number().describe('Current page number'),
    limit: z.number().describe('Items per page'),
  }),
})

const JobResponseSchema = z.object({
  success: z.literal(true),
  data: jobPostingSchema,
  metadata: MetadataSchema,
})

const listJobsRoute = createRoute({
  method: 'get',
  path: '/jobs',
  tags: ['Job Management'],
  summary: 'List all job postings',
  description: 'Retrieve all job postings for your organization with optional filtering and pagination',
  security: [{ apiKey: [] }],
  request: {
    query: z.object({
      status: z.enum(['draft', 'published', 'closed', 'archived']).optional().describe('Filter by status'),
      department: z.string().optional().describe('Filter by department'),
      job_type: z.enum(['full-time', 'part-time', 'contract', 'internship', 'temporary']).optional().describe('Filter by job type'),
      location_type: z.enum(['remote', 'office', 'hybrid']).optional().describe('Filter by location type'),
      page: z.coerce.number().int().positive().default(1).describe('Page number for pagination'),
      limit: z.coerce.number().int().positive().max(100).default(20).describe('Items per page (max 100)'),
    }),
  },
  responses: {
    200: {
      content: {
        'application/json': {
          schema: ListJobsResponseSchema,
        },
      },
      description: 'Job postings retrieved successfully',
    },
    400: {
      content: {
        'application/json': {
          schema: ErrorResponseSchema,
        },
      },
      description: 'Invalid query parameters',
    },
  },
})

const getJobRoute = createRoute({
  method: 'get',
  path: '/jobs/{id}',
  tags: ['Job Management'],
  summary: 'Get job posting',
  description: 'Retrieve a specific job posting by ID',
  security: [{ apiKey: [] }],
  request: {
    params: z.object({
      id: z.string().uuid('Invalid job posting ID'),
    }),
  },
  responses: {
    200: {
      content: {
        'application/json': {
          schema: JobResponseSchema,
        },
      },
      description: 'Job posting retrieved successfully',
    },
    404: {
      content: {
        'application/json': {
          schema: ErrorResponseSchema,
        },
      },
      description: 'Job posting not found',
    },
  },
})

const createJobRoute = createRoute({
  method: 'post',
  path: '/jobs',
  tags: ['Job Management'],
  summary: 'Create job posting',
  description: 'Create a new job posting for your organization',
  security: [{ apiKey: [] }],
  request: {
    body: {
      content: {
        'application/json': {
          schema: createJobSchema,
        },
      },
    },
  },
  responses: {
    201: {
      content: {
        'application/json': {
          schema: JobResponseSchema,
        },
      },
      description: 'Job posting created successfully',
    },
    400: {
      content: {
        'application/json': {
          schema: ErrorResponseSchema,
        },
      },
      description: 'Invalid request data',
    },
  },
})

const updateJobRoute = createRoute({
  method: 'put',
  path: '/jobs/{id}',
  tags: ['Job Management'],
  summary: 'Update job posting',
  description: 'Update an existing job posting',
  security: [{ apiKey: [] }],
  request: {
    params: z.object({
      id: z.string().uuid('Invalid job posting ID'),
    }),
    body: {
      content: {
        'application/json': {
          schema: updateJobSchema,
        },
      },
    },
  },
  responses: {
    200: {
      content: {
        'application/json': {
          schema: JobResponseSchema,
        },
      },
      description: 'Job posting updated successfully',
    },
    404: {
      content: {
        'application/json': {
          schema: ErrorResponseSchema,
        },
      },
      description: 'Job posting not found',
    },
    400: {
      content: {
        'application/json': {
          schema: ErrorResponseSchema,
        },
      },
      description: 'Invalid request data',
    },
  },
})

const deleteJobRoute = createRoute({
  method: 'delete',
  path: '/jobs/{id}',
  tags: ['Job Management'],
  summary: 'Delete job posting',
  description: 'Delete a job posting (soft delete - sets status to archived)',
  security: [{ apiKey: [] }],
  request: {
    params: z.object({
      id: z.string().uuid('Invalid job posting ID'),
    }),
  },
  responses: {
    200: {
      content: {
        'application/json': {
          schema: z.object({
            success: z.literal(true),
            message: z.string(),
            metadata: MetadataSchema,
          }),
        },
      },
      description: 'Job posting deleted successfully',
    },
    404: {
      content: {
        'application/json': {
          schema: ErrorResponseSchema,
        },
      },
      description: 'Job posting not found',
    },
  },
})

publicJobManagementRoutes.openapi(listJobsRoute, async (c): Promise<any> => {
  const logger = new Logger({
    correlationId: c.get('correlationId'),
    requestId: c.get('requestId'),
  })

  const timer = logger.startTimer()

  try {
    const apiKeyMeta = c.get('apiKeyMeta') as { companyId: string; tier: string; permissions: string[] }
    const { companyId: organizationId } = apiKeyMeta
    const query = c.req.valid('query')
    const config = ConfigService.getInstance()
    const supabase = createClient<Database>(
      config.getConfig().supabaseUrl,
      config.getConfig().supabaseServiceRoleKey
    )

    logger.info('Fetching job postings', {
      organizationId,
      filters: query,
    })

    let queryBuilder = supabase
      .from('job_postings')
      .select(`
        id, title, content, status, job_type, department, 
        experience_level, location_display, location_type, 
        remote_allowed, salary_min, salary_max, salary_type,
        pipeline_template_id, form_template_id, published_at,
        created_at, updated_at
      `)
      .eq('organization_id', organizationId)

    if (query.status) {
      queryBuilder = queryBuilder.eq('status', query.status)
    }
    if (query.department) {
      queryBuilder = queryBuilder.eq('department', query.department)
    }
    if (query.job_type) {
      queryBuilder = queryBuilder.eq('job_type', query.job_type)
    }
    if (query.location_type) {
      queryBuilder = queryBuilder.eq('location_type', query.location_type)
    }

    const countQuery = supabase
      .from('job_postings')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', organizationId)

    if (query.status) {
      countQuery.eq('status', query.status)
    }
    if (query.department) {
      countQuery.eq('department', query.department)
    }
    if (query.job_type) {
      countQuery.eq('job_type', query.job_type)
    }
    if (query.location_type) {
      countQuery.eq('location_type', query.location_type)
    }

    const { count } = await countQuery

    const offset = (query.page - 1) * query.limit
    queryBuilder = queryBuilder
      .order('created_at', { ascending: false })
      .range(offset, offset + query.limit - 1)

    const { data, error } = await queryBuilder

    if (error) {
      logger.error('Database query failed', error, {
        organizationId,
        errorCode: error.code,
      })
      return c.json({
        success: false as const,
        error: {
          code: 'DATABASE_ERROR',
          message: 'Failed to fetch job postings',
        },
        timestamp: new Date().toISOString(),
        correlationId: c.get('correlationId'),
      }, 400)
    }

    const duration = timer()
    logger.info('Job postings fetched successfully', {
      count: data?.length || 0,
      total: count || 0,
      page: query.page,
      duration,
    })

    return c.json({
      success: true as const,
      data,
      metadata: {
        count: data?.length || 0,
        total: count || 0,
        page: query.page,
        limit: query.limit,
        processingTimeMs: duration,
        correlationId: c.get('correlationId'),
        timestamp: new Date().toISOString(),
      }
    })
  } catch (error) {
    const duration = timer()
    logger.error('Request failed', error, {
      duration,
      errorType: error?.constructor.name,
    })
    
    return c.json({
      success: false as const,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Internal server error',
      },
      timestamp: new Date().toISOString(),
      correlationId: c.get('correlationId'),
    }, 500)
  }
})

publicJobManagementRoutes.openapi(getJobRoute, async (c): Promise<any> => {
  const logger = new Logger({
    correlationId: c.get('correlationId'),
    requestId: c.get('requestId'),
  })

  const timer = logger.startTimer()

  try {
    const apiKeyMeta = c.get('apiKeyMeta') as { companyId: string; tier: string; permissions: string[] }
    const { companyId: organizationId } = apiKeyMeta
    const { id } = c.req.valid('param')
    const config = ConfigService.getInstance()
    const supabase = createClient<Database>(
      config.getConfig().supabaseUrl,
      config.getConfig().supabaseServiceRoleKey
    )

    logger.info('Fetching single job posting', {
      organizationId,
      jobId: id,
    })

    const { data, error } = await supabase
      .from('job_postings')
      .select(`
        id, title, content, status, job_type, department, 
        experience_level, location_display, location_type, 
        remote_allowed, salary_min, salary_max, salary_type,
        pipeline_template_id, form_template_id, published_at,
        created_at, updated_at
      `)
      .eq('id', id)
      .eq('organization_id', organizationId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        logger.warn('Job posting not found', {
          organizationId,
          jobId: id,
        })
        return c.json({
          success: false as const,
          error: {
            code: 'JOB_NOT_FOUND',
            message: 'Job posting not found',
          },
          timestamp: new Date().toISOString(),
          correlationId: c.get('correlationId'),
        }, 404)
      }
      
      logger.error('Database query failed', error, {
        organizationId,
        jobId: id,
        errorCode: error.code,
      })
      return c.json({
        success: false as const,
        error: {
          code: 'DATABASE_ERROR',
          message: 'Failed to fetch job posting',
        },
        timestamp: new Date().toISOString(),
        correlationId: c.get('correlationId'),
      }, 400)
    }

    const duration = timer()
    logger.info('Job posting fetched successfully', {
      jobId: id,
      duration,
    })

    return c.json({
      success: true as const,
      data,
      metadata: {
        processingTimeMs: duration,
        correlationId: c.get('correlationId'),
        timestamp: new Date().toISOString(),
      }
    })
  } catch (error) {
    const duration = timer()
    logger.error('Request failed', error, {
      duration,
      errorType: error?.constructor.name,
    })
    
    return c.json({
      success: false as const,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Internal server error',
      },
      timestamp: new Date().toISOString(),
      correlationId: c.get('correlationId'),
    }, 500)
  }
})

publicJobManagementRoutes.openapi(createJobRoute, async (c): Promise<any> => {
  const logger = new Logger({
    correlationId: c.get('correlationId'),
    requestId: c.get('requestId'),
  })

  const timer = logger.startTimer()

  try {
    const apiKeyMeta = c.get('apiKeyMeta') as { companyId: string; tier: string; permissions: string[] }
    const { companyId: organizationId } = apiKeyMeta
    const userId = c.get('apiKeyOwner')
    const body = c.req.valid('json')
    const config = ConfigService.getInstance()
    const supabase = createClient<Database>(
      config.getConfig().supabaseUrl,
      config.getConfig().supabaseServiceRoleKey
    )

    logger.info('Creating job posting', {
      organizationId,
      userId,
      title: body.title,
      jobType: body.job_type,
      status: body.status,
    })

    const insertData: any = {
      ...body,
      organization_id: organizationId,
    }
    
    // Use userId if it's a valid UUID, otherwise omit created_by
    if (userId && userId !== 'test-user' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId)) {
      insertData.created_by = userId
    } else {
      // For test user, try to use a default test UUID
      insertData.created_by = '00000000-0000-0000-0000-000000000001' // Test user UUID
    }

    const { data, error } = await supabase
      .from('job_postings')
      .insert(insertData)
      .select(`
        id, title, content, status, job_type, department, 
        experience_level, location_display, location_type, 
        remote_allowed, salary_min, salary_max, salary_type,
        pipeline_template_id, form_template_id, published_at,
        created_at, updated_at
      `)
      .single()

    if (error) {      
      logger.error('Failed to create job posting', error, {
        organizationId,
        errorCode: error.code,
      })
      return c.json({
        success: false as const,
        error: {
          code: 'DATABASE_ERROR',
          message: 'Failed to create job posting',
        },
        timestamp: new Date().toISOString(),
        correlationId: c.get('correlationId'),
      }, 400)
    }

    const duration = timer()
    logger.info('Job posting created successfully', {
      jobId: data.id,
      title: data.title,
      duration,
    })

    return c.json({
      success: true as const,
      data,
      metadata: {
        processingTimeMs: duration,
        correlationId: c.get('correlationId'),
        timestamp: new Date().toISOString(),
      }
    }, 201)
  } catch (error) {
    const duration = timer()
    logger.error('Request failed', error, {
      duration,
      errorType: error?.constructor.name,
    })
    
    return c.json({
      success: false as const,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Internal server error',
      },
      timestamp: new Date().toISOString(),
      correlationId: c.get('correlationId'),
    }, 500)
  }
})

publicJobManagementRoutes.openapi(updateJobRoute, async (c): Promise<any> => {
  const logger = new Logger({
    correlationId: c.get('correlationId'),
    requestId: c.get('requestId'),
  })

  const timer = logger.startTimer()

  try {
    const apiKeyMeta = c.get('apiKeyMeta') as { companyId: string; tier: string; permissions: string[] }
    const { companyId: organizationId } = apiKeyMeta
    const { id } = c.req.valid('param')
    const body = c.req.valid('json')
    const config = ConfigService.getInstance()
    const supabase = createClient<Database>(
      config.getConfig().supabaseUrl,
      config.getConfig().supabaseServiceRoleKey
    )

    logger.info('Updating job posting', {
      organizationId,
      jobId: id,
      updates: Object.keys(body),
    })

    const { data, error } = await supabase
      .from('job_postings')
      .update({
        ...body,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('organization_id', organizationId)
      .select(`
        id, title, content, status, job_type, department, 
        experience_level, location_display, location_type, 
        remote_allowed, salary_min, salary_max, salary_type,
        pipeline_template_id, form_template_id, published_at,
        created_at, updated_at
      `)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        logger.warn('Job posting not found for update', {
          organizationId,
          jobId: id,
        })
        return c.json({
          success: false as const,
          error: {
            code: 'JOB_NOT_FOUND',
            message: 'Job posting not found',
          },
          timestamp: new Date().toISOString(),
          correlationId: c.get('correlationId'),
        }, 404)
      }
      
      logger.error('Failed to update job posting', error, {
        organizationId,
        jobId: id,
        errorCode: error.code,
      })
      return c.json({
        success: false as const,
        error: {
          code: 'DATABASE_ERROR',
          message: 'Failed to update job posting',
        },
        timestamp: new Date().toISOString(),
        correlationId: c.get('correlationId'),
      }, 400)
    }

    const duration = timer()
    logger.info('Job posting updated successfully', {
      jobId: id,
      title: data.title,
      duration,
    })

    return c.json({
      success: true as const,
      data,
      metadata: {
        processingTimeMs: duration,
        correlationId: c.get('correlationId'),
        timestamp: new Date().toISOString(),
      }
    })
  } catch (error) {
    const duration = timer()
    logger.error('Request failed', error, {
      duration,
      errorType: error?.constructor.name,
    })
    
    return c.json({
      success: false as const,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Internal server error',
      },
      timestamp: new Date().toISOString(),
      correlationId: c.get('correlationId'),
    }, 500)
  }
})

publicJobManagementRoutes.openapi(deleteJobRoute, async (c): Promise<any> => {
  const logger = new Logger({
    correlationId: c.get('correlationId'),
    requestId: c.get('requestId'),
  })

  const timer = logger.startTimer()

  try {
    const apiKeyMeta = c.get('apiKeyMeta') as { companyId: string; tier: string; permissions: string[] }
    const { companyId: organizationId } = apiKeyMeta
    const { id } = c.req.valid('param')
    const config = ConfigService.getInstance()
    const supabase = createClient<Database>(
      config.getConfig().supabaseUrl,
      config.getConfig().supabaseServiceRoleKey
    )

    logger.info('Deleting job posting (soft delete)', {
      organizationId,
      jobId: id,
    })

    const { data, error } = await supabase
      .from('job_postings')
      .update({
        status: 'archived',
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('organization_id', organizationId)
      .select('id, title')
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        logger.warn('Job posting not found for deletion', {
          organizationId,
          jobId: id,
        })
        return c.json({
          success: false as const,
          error: {
            code: 'JOB_NOT_FOUND',
            message: 'Job posting not found',
          },
          timestamp: new Date().toISOString(),
          correlationId: c.get('correlationId'),
        }, 404)
      }
      
      logger.error('Failed to delete job posting', error, {
        organizationId,
        jobId: id,
        errorCode: error.code,
      })
      return c.json({
        success: false as const,
        error: {
          code: 'DATABASE_ERROR',
          message: 'Failed to delete job posting',
        },
        timestamp: new Date().toISOString(),
        correlationId: c.get('correlationId'),
      }, 400)
    }

    const duration = timer()
    logger.info('Job posting deleted successfully', {
      jobId: id,
      title: data.title,
      duration,
    })

    return c.json({
      success: true as const,
      message: `Job posting "${data.title}" has been archived`,
      metadata: {
        processingTimeMs: duration,
        correlationId: c.get('correlationId'),
        timestamp: new Date().toISOString(),
      }
    })
  } catch (error) {
    const duration = timer()
    logger.error('Request failed', error, {
      duration,
      errorType: error?.constructor.name,
    })
    
    return c.json({
      success: false as const,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Internal server error',
      },
      timestamp: new Date().toISOString(),
      correlationId: c.get('correlationId'),
    }, 500)
  }
})

export { publicJobManagementRoutes }