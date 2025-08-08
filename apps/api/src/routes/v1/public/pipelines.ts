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

const publicPipelinesRoutes = createOpenAPIApp()

publicPipelinesRoutes.use('*', publicAuth())
publicPipelinesRoutes.use('*', adaptiveRateLimit())

const pipelineStepSchema = z.object({
  id: z.string().min(1).describe('Unique step identifier'),
  name: z.string().min(1, 'Step name is required').describe('Human-readable step name'),
  type: z.enum([
    'application',
    'auto_screen', 
    'manual_review',
    'interview',
    'assessment',
    'reference_check',
    'offer'
  ]).describe('Step type defining behavior'),
  order: z.number().int().positive().describe('Step order in pipeline (1-based)'),
  config: z.record(z.any()).optional().describe('Step-specific configuration'),
})

const pipelineTemplateSchema = z.object({
  id: z.string().uuid().describe('Pipeline template unique identifier'),
  name: z.string().describe('Pipeline template name'),
  description: z.string().nullable().describe('Optional description'),
  category: z.string().nullable().describe('Pipeline category'),
  is_default: z.boolean().describe('Whether this is the default pipeline'),
  steps: z.array(pipelineStepSchema).describe('Pipeline steps in order'),
  created_at: z.string().describe('Creation timestamp'),
  updated_at: z.string().describe('Last update timestamp'),
})

const createPipelineSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name too long').describe('Pipeline template name'),
  description: z.string().max(500, 'Description too long').optional().describe('Optional description'),
  category: z.enum([
    'general',
    'engineering', 
    'sales',
    'marketing',
    'design',
    'operations',
    'other'
  ]).optional().describe('Pipeline category for organization'),
  is_default: z.boolean().optional().describe('Whether this is the default pipeline'),
  steps: z.array(pipelineStepSchema)
    .min(1, 'At least one step is required')
    .max(20, 'Too many steps')
    .describe('Pipeline steps in order'),
})


const ListPipelinesResponseSchema = z.object({
  success: z.literal(true),
  data: z.array(pipelineTemplateSchema),
  metadata: MetadataSchema.extend({
    count: z.number().describe('Number of pipeline templates'),
  }),
})

const PipelineResponseSchema = z.object({
  success: z.literal(true),
  data: pipelineTemplateSchema,
  metadata: MetadataSchema,
})

const listPipelinesRoute = createRoute({
  method: 'get',
  path: '/pipelines',
  tags: ['Pipeline Templates'],
  summary: 'List all pipeline templates',
  description: 'Retrieve all pipeline templates for your organization',
  security: [{ apiKey: [] }],
  responses: {
    200: {
      content: {
        'application/json': {
          schema: ListPipelinesResponseSchema,
        },
      },
      description: 'Pipeline templates retrieved successfully',
    },
    400: {
      content: {
        'application/json': {
          schema: ErrorResponseSchema,
        },
      },
      description: 'Bad request',
    },
  },
})

const getPipelineRoute = createRoute({
  method: 'get',
  path: '/pipelines/{id}',
  tags: ['Pipeline Templates'],
  summary: 'Get pipeline template',
  description: 'Retrieve a specific pipeline template by ID',
  security: [{ apiKey: [] }],
  request: {
    params: z.object({
      id: z.string().uuid('Invalid pipeline template ID'),
    }),
  },
  responses: {
    200: {
      content: {
        'application/json': {
          schema: PipelineResponseSchema,
        },
      },
      description: 'Pipeline template retrieved successfully',
    },
    404: {
      content: {
        'application/json': {
          schema: ErrorResponseSchema,
        },
      },
      description: 'Pipeline template not found',
    },
  },
})

const createPipelineRoute = createRoute({
  method: 'post',
  path: '/pipelines',
  tags: ['Pipeline Templates'],
  summary: 'Create pipeline template',
  description: 'Create a new pipeline template for your organization',
  security: [{ apiKey: [] }],
  request: {
    body: {
      content: {
        'application/json': {
          schema: createPipelineSchema,
        },
      },
    },
  },
  responses: {
    201: {
      content: {
        'application/json': {
          schema: PipelineResponseSchema,
        },
      },
      description: 'Pipeline template created successfully',
    },
    400: {
      content: {
        'application/json': {
          schema: ErrorResponseSchema,
        },
      },
      description: 'Bad request',
    },
    409: {
      content: {
        'application/json': {
          schema: ErrorResponseSchema,
        },
      },
      description: 'Pipeline template name already exists',
    },
  },
})

publicPipelinesRoutes.openapi(listPipelinesRoute, async (c): Promise<any> => {
  const logger = new Logger({
    correlationId: c.get('correlationId'),
    requestId: c.get('requestId'),
  })

  const timer = logger.startTimer()

  try {
    const apiKeyMeta = c.get('apiKeyMeta') as { companyId: string; tier: string; permissions: string[] }
    const { companyId: organizationId } = apiKeyMeta
    const config = ConfigService.getInstance()
    const supabase = createClient<Database>(
      config.getConfig().supabaseUrl,
      config.getConfig().supabaseServiceRoleKey
    )

    logger.info('Fetching pipeline templates', {
      organizationId,
    })

    const { data, error } = await supabase
      .from('pipeline_templates')
      .select('id, name, description, category, is_default, steps, created_at, updated_at')
      .eq('organization_id', organizationId)
      .order('is_default', { ascending: false })
      .order('created_at', { ascending: false })

    if (error) {
      logger.error('Database query failed', error, {
        organizationId,
        errorCode: error.code,
      })
      return c.json({
        success: false as const,
        error: {
          code: 'DATABASE_ERROR',
          message: 'Failed to fetch pipeline templates',
        },
        timestamp: new Date().toISOString(),
        correlationId: c.get('correlationId'),
      }, 400)
    }

    const duration = timer()
    logger.info('Pipeline templates fetched successfully', {
      count: data?.length || 0,
      duration,
    })

    return c.json({
      success: true as const,
      data,
      metadata: {
        count: data?.length || 0,
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

publicPipelinesRoutes.openapi(getPipelineRoute, async (c): Promise<any> => {
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

    logger.info('Fetching single pipeline template', {
      organizationId,
      pipelineId: id,
    })

    const { data, error } = await supabase
      .from('pipeline_templates')
      .select('id, name, description, category, is_default, steps, created_at, updated_at')
      .eq('id', id)
      .eq('organization_id', organizationId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        logger.warn('Pipeline template not found', {
          organizationId,
          pipelineId: id,
        })
        return c.json({
          success: false as const,
          error: {
            code: 'PIPELINE_NOT_FOUND',
            message: 'Pipeline template not found',
          },
          timestamp: new Date().toISOString(),
          correlationId: c.get('correlationId'),
        }, 404)
      }
      
      logger.error('Database query failed', error, {
        organizationId,
        pipelineId: id,
        errorCode: error.code,
      })
      return c.json({
        success: false as const,
        error: {
          code: 'DATABASE_ERROR',
          message: 'Failed to fetch pipeline template',
        },
        timestamp: new Date().toISOString(),
        correlationId: c.get('correlationId'),
      }, 400)
    }

    const duration = timer()
    logger.info('Pipeline template fetched successfully', {
      pipelineId: id,
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

publicPipelinesRoutes.openapi(createPipelineRoute, async (c): Promise<any> => {
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

    logger.info('Creating pipeline template', {
      organizationId,
      userId,
      name: body.name,
      category: body.category,
      isDefault: body.is_default,
      stepCount: body.steps.length,
    })

    if (body.is_default) {
      logger.info('Unsetting other default pipelines', { organizationId })
      
      const { error: updateError } = await supabase
        .from('pipeline_templates')
        .update({ is_default: false })
        .eq('organization_id', organizationId)

      if (updateError) {
        logger.error('Failed to unset default pipelines', updateError, {
          organizationId,
          errorCode: updateError.code,
        })
        return c.json({
          success: false as const,
          error: {
            code: 'DATABASE_ERROR',
            message: 'Failed to update default pipelines',
          },
          timestamp: new Date().toISOString(),
          correlationId: c.get('correlationId'),
        }, 400)
      }
    }

    const insertData: any = {
      ...body,
      organization_id: organizationId,
    };
    
    // Only add created_by if userId is provided and is a valid UUID
    if (userId && userId !== 'test-user') {
      insertData.created_by = userId;
    }

    const { data, error } = await supabase
      .from('pipeline_templates')
      .insert(insertData)
      .select('id, name, description, category, is_default, steps, created_at, updated_at')
      .single()

    if (error) {
      if (error.code === '23505') {
        logger.warn('Pipeline template name already exists', {
          organizationId,
          name: body.name,
        })
        return c.json({
          success: false as const,
          error: {
            code: 'DUPLICATE_NAME',
            message: 'Pipeline template with this name already exists',
          },
          timestamp: new Date().toISOString(),
          correlationId: c.get('correlationId'),
        }, 409)
      }
      
      logger.error('Failed to create pipeline template', error, {
        organizationId,
        errorCode: error.code,
      })
      return c.json({
        success: false as const,
        error: {
          code: 'DATABASE_ERROR',
          message: 'Failed to create pipeline template',
        },
        timestamp: new Date().toISOString(),
        correlationId: c.get('correlationId'),
      }, 400)
    }

    const duration = timer()
    logger.info('Pipeline template created successfully', {
      pipelineId: data.id,
      name: data.name,
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

export { publicPipelinesRoutes }