import { Hono } from 'hono'
import { z } from 'zod'
import { zValidator } from '@hono/zod-validator'
import { createClient } from '@/lib/supabase/server'
import { internalAuth } from '@/middleware/internal-auth'
import { Logger } from '@/services/logger'
import { HTTPException } from 'hono/HTTPException'

// Schema definitions following API design standards
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

const updatePipelineSchema = createPipelineSchema.partial()

const app = new Hono()

// Apply internal authentication to all routes
app.use('*', internalAuth())

// List all pipeline templates
app.get('/', async (c) => {
  const logger = new Logger({
    correlationId: c.get('correlationId'),
    requestId: c.get('requestId'),
    endpoint: '/api/v1/internal/pipelines',
    method: 'GET',
  })

  const timer = logger.startTimer()

  try {
    const { organizationId } = c.get('user')
    const supabase = createClient(c)

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
      throw new HTTPException(400, { message: 'Failed to fetch pipeline templates' })
    }

    const duration = timer()
    logger.info('Pipeline templates fetched successfully', {
      count: data?.length || 0,
      duration,
    })

    return c.json({
      success: true,
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
      errorType: error.constructor.name,
    })
    
    if (error instanceof HTTPException) {
      throw error
    }
    
    throw new HTTPException(500, { message: 'Internal server error' })
  }
})

// Get single pipeline template
app.get('/:id', zValidator('param', z.object({
  id: z.string().uuid('Invalid pipeline template ID')
})), async (c) => {
  const logger = new Logger({
    correlationId: c.get('correlationId'),
    requestId: c.get('requestId'),
    endpoint: `/api/v1/internal/pipelines/${c.req.param('id')}`,
    method: 'GET',
  })

  const timer = logger.startTimer()

  try {
    const { organizationId } = c.get('user')
    const { id } = c.req.valid('param')
    const supabase = createClient(c)

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
        throw new HTTPException(404, { message: 'Pipeline template not found' })
      }
      
      logger.error('Database query failed', error, {
        organizationId,
        pipelineId: id,
        errorCode: error.code,
      })
      throw new HTTPException(400, { message: 'Failed to fetch pipeline template' })
    }

    const duration = timer()
    logger.info('Pipeline template fetched successfully', {
      pipelineId: id,
      duration,
    })

    return c.json({
      success: true,
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
      errorType: error.constructor.name,
    })
    
    if (error instanceof HTTPException) {
      throw error
    }
    
    throw new HTTPException(500, { message: 'Internal server error' })
  }
})

// Create pipeline template
app.post('/', zValidator('json', createPipelineSchema), async (c) => {
  const logger = new Logger({
    correlationId: c.get('correlationId'),
    requestId: c.get('requestId'),
    endpoint: '/api/v1/internal/pipelines',
    method: 'POST',
  })

  const timer = logger.startTimer()

  try {
    const { organizationId, userId } = c.get('user')
    const body = c.req.valid('json')
    const supabase = createClient(c)

    logger.info('Creating pipeline template', {
      organizationId,
      userId,
      name: body.name,
      category: body.category,
      isDefault: body.is_default,
      stepCount: body.steps.length,
    })

    // If setting as default, unset other defaults
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
        throw new HTTPException(400, { message: 'Failed to update default pipelines' })
      }
    }

    const { data, error } = await supabase
      .from('pipeline_templates')
      .insert({
        ...body,
        organization_id: organizationId,
        created_by: userId,
      })
      .select('id, name, description, category, is_default, steps, created_at, updated_at')
      .single()

    if (error) {
      if (error.code === '23505') { // Unique constraint violation
        logger.warn('Pipeline template name already exists', {
          organizationId,
          name: body.name,
        })
        throw new HTTPException(409, { message: 'Pipeline template with this name already exists' })
      }
      
      logger.error('Failed to create pipeline template', error, {
        organizationId,
        errorCode: error.code,
      })
      throw new HTTPException(400, { message: 'Failed to create pipeline template' })
    }

    const duration = timer()
    logger.info('Pipeline template created successfully', {
      pipelineId: data.id,
      name: data.name,
      duration,
    })

    return c.json({
      success: true,
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
      errorType: error.constructor.name,
    })
    
    if (error instanceof HTTPException) {
      throw error
    }
    
    throw new HTTPException(500, { message: 'Internal server error' })
  }
})

// Update pipeline template
app.put('/:id', 
  zValidator('param', z.object({ id: z.string().uuid() })),
  zValidator('json', updatePipelineSchema),
  async (c) => {
    const logger = new Logger({
      correlationId: c.get('correlationId'),
      requestId: c.get('requestId'),
      endpoint: `/api/v1/internal/pipelines/${c.req.param('id')}`,
      method: 'PUT',
    })

    const timer = logger.startTimer()

    try {
      const { organizationId } = c.get('user')
      const { id } = c.req.valid('param')
      const body = c.req.valid('json')
      const supabase = createClient(c)

      logger.info('Updating pipeline template', {
        organizationId,
        pipelineId: id,
        updates: Object.keys(body),
      })

      // If setting as default, unset other defaults
      if (body.is_default) {
        logger.info('Unsetting other default pipelines', { organizationId })
        
        const { error: updateError } = await supabase
          .from('pipeline_templates')
          .update({ is_default: false })
          .eq('organization_id', organizationId)
          .neq('id', id)

        if (updateError) {
          logger.error('Failed to unset default pipelines', updateError, {
            organizationId,
            errorCode: updateError.code,
          })
          throw new HTTPException(400, { message: 'Failed to update default pipelines' })
        }
      }

      const { data, error } = await supabase
        .from('pipeline_templates')
        .update({
          ...body,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .eq('organization_id', organizationId)
        .select('id, name, description, category, is_default, steps, created_at, updated_at')
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          logger.warn('Pipeline template not found for update', {
            organizationId,
            pipelineId: id,
          })
          throw new HTTPException(404, { message: 'Pipeline template not found' })
        }
        
        if (error.code === '23505') {
          logger.warn('Pipeline template name already exists', {
            organizationId,
            name: body.name,
          })
          throw new HTTPException(409, { message: 'Pipeline template with this name already exists' })
        }
        
        logger.error('Failed to update pipeline template', error, {
          organizationId,
          pipelineId: id,
          errorCode: error.code,
        })
        throw new HTTPException(400, { message: 'Failed to update pipeline template' })
      }

      const duration = timer()
      logger.info('Pipeline template updated successfully', {
        pipelineId: id,
        duration,
      })

      return c.json({
        success: true,
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
        errorType: error.constructor.name,
      })
      
      if (error instanceof HTTPException) {
        throw error
      }
      
      throw new HTTPException(500, { message: 'Internal server error' })
    }
  }
)

// Delete pipeline template
app.delete('/:id', zValidator('param', z.object({
  id: z.string().uuid()
})), async (c) => {
  const logger = new Logger({
    correlationId: c.get('correlationId'),
    requestId: c.get('requestId'),
    endpoint: `/api/v1/internal/pipelines/${c.req.param('id')}`,
    method: 'DELETE',
  })

  const timer = logger.startTimer()

  try {
    const { organizationId } = c.get('user')
    const { id } = c.req.valid('param')
    const supabase = createClient(c)

    logger.info('Deleting pipeline template', {
      organizationId,
      pipelineId: id,
    })

    // Check if this pipeline is in use by any job postings
    const { count, error: countError } = await supabase
      .from('job_postings')
      .select('id', { count: 'exact', head: true })
      .eq('pipeline_template_id', id)
      .eq('organization_id', organizationId)

    if (countError) {
      logger.error('Failed to check pipeline usage', countError, {
        organizationId,
        pipelineId: id,
      })
      throw new HTTPException(400, { message: 'Failed to check pipeline usage' })
    }

    if (count && count > 0) {
      logger.warn('Cannot delete pipeline in use', {
        organizationId,
        pipelineId: id,
        jobPostingsCount: count,
      })
      throw new HTTPException(409, { 
        message: `Cannot delete pipeline template. It is currently used by ${count} job posting(s).` 
      })
    }

    const { error } = await supabase
      .from('pipeline_templates')
      .delete()
      .eq('id', id)
      .eq('organization_id', organizationId)

    if (error) {
      logger.error('Failed to delete pipeline template', error, {
        organizationId,
        pipelineId: id,
        errorCode: error.code,
      })
      throw new HTTPException(400, { message: 'Failed to delete pipeline template' })
    }

    const duration = timer()
    logger.info('Pipeline template deleted successfully', {
      pipelineId: id,
      duration,
    })

    return c.json({
      success: true,
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
      errorType: error.constructor.name,
    })
    
    if (error instanceof HTTPException) {
      throw error
    }
    
    throw new HTTPException(500, { message: 'Internal server error' })
  }
})

// Duplicate pipeline template
app.post('/:id/duplicate', zValidator('param', z.object({
  id: z.string().uuid()
})), async (c) => {
  const logger = new Logger({
    correlationId: c.get('correlationId'),
    requestId: c.get('requestId'),
    endpoint: `/api/v1/internal/pipelines/${c.req.param('id')}/duplicate`,
    method: 'POST',
  })

  const timer = logger.startTimer()

  try {
    const { organizationId, userId } = c.get('user')
    const { id } = c.req.valid('param')
    const supabase = createClient(c)

    logger.info('Duplicating pipeline template', {
      organizationId,
      userId,
      sourcePipelineId: id,
    })

    // Get original template
    const { data: original, error: fetchError } = await supabase
      .from('pipeline_templates')
      .select('name, description, category, steps')
      .eq('id', id)
      .eq('organization_id', organizationId)
      .single()

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        logger.warn('Source pipeline template not found', {
          organizationId,
          sourcePipelineId: id,
        })
        throw new HTTPException(404, { message: 'Pipeline template not found' })
      }
      
      logger.error('Failed to fetch source pipeline', fetchError, {
        organizationId,
        sourcePipelineId: id,
        errorCode: fetchError.code,
      })
      throw new HTTPException(400, { message: 'Failed to fetch source pipeline template' })
    }

    // Create duplicate with (Copy) suffix
    const { data, error } = await supabase
      .from('pipeline_templates')
      .insert({
        name: `${original.name} (Copy)`,
        description: original.description,
        category: original.category,
        is_default: false, // Copies are never default
        steps: original.steps,
        organization_id: organizationId,
        created_by: userId,
      })
      .select('id, name, description, category, is_default, steps, created_at, updated_at')
      .single()

    if (error) {
      if (error.code === '23505') {
        logger.warn('Duplicate name conflict, trying with timestamp', {
          organizationId,
          originalName: original.name,
        })
        
        // Try with timestamp suffix
        const timestamp = new Date().toISOString().slice(0, 16).replace('T', ' ')
        const { data: retryData, error: retryError } = await supabase
          .from('pipeline_templates')
          .insert({
            name: `${original.name} (Copy ${timestamp})`,
            description: original.description,
            category: original.category,
            is_default: false,
            steps: original.steps,
            organization_id: organizationId,
            created_by: userId,
          })
          .select('id, name, description, category, is_default, steps, created_at, updated_at')
          .single()
          
        if (retryError) {
          logger.error('Failed to create duplicate with timestamp', retryError, {
            organizationId,
            errorCode: retryError.code,
          })
          throw new HTTPException(400, { message: 'Failed to create duplicate pipeline template' })
        }
        
        const duration = timer()
        logger.info('Pipeline template duplicated successfully with timestamp', {
          sourcePipelineId: id,
          newPipelineId: retryData.id,
          duration,
        })
        
        return c.json({
          success: true,
          data: retryData,
          metadata: {
            processingTimeMs: duration,
            correlationId: c.get('correlationId'),
            timestamp: new Date().toISOString(),
          }
        }, 201)
      }
      
      logger.error('Failed to create duplicate pipeline', error, {
        organizationId,
        errorCode: error.code,
      })
      throw new HTTPException(400, { message: 'Failed to create duplicate pipeline template' })
    }

    const duration = timer()
    logger.info('Pipeline template duplicated successfully', {
      sourcePipelineId: id,
      newPipelineId: data.id,
      duration,
    })

    return c.json({
      success: true,
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
      errorType: error.constructor.name,
    })
    
    if (error instanceof HTTPException) {
      throw error
    }
    
    throw new HTTPException(500, { message: 'Internal server error' })
  }
})

export default app