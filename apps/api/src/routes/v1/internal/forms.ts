import { Hono } from 'hono'
import { z } from 'zod'
import { zValidator } from '@hono/zod-validator'
import { createClient } from '@/lib/supabase/server'
import { internalAuth } from '@/middleware/internal-auth'
import { Logger } from '@/services/logger'
import { HTTPException } from 'hono/HTTPException'

// Schema definitions following API design standards
const fieldValidationSchema = z.record(z.any()).describe('Field-specific validation rules')

const fieldSchema = z.object({
  id: z.string().min(1).describe('Unique field identifier'),
  name: z.string().min(1, 'Field name is required').describe('Display name for the field'),
  type: z.enum([
    'text',
    'number', 
    'email',
    'tel',
    'url',
    'file',
    'date',
    'select',
    'checkbox',
    'radio',
    'textarea'
  ]).describe('Field input type'),
  required: z.boolean().describe('Whether field is required'),
  order: z.number().int().positive().describe('Display order (1-based)'),
  placeholder: z.string().optional().describe('Placeholder text'),
  helpText: z.string().max(200).optional().describe('Help text for candidates'),
  validation: fieldValidationSchema.optional(),
  options: z.array(z.string()).optional().describe('Options for select/radio fields'),
})

const createFormSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name too long').describe('Form template name'),
  description: z.string().max(500, 'Description too long').optional().describe('Optional description'),
  category: z.enum([
    'general',
    'engineering',
    'sales', 
    'marketing',
    'design',
    'operations',
    'other'
  ]).optional().describe('Form category for organization'),
  is_default: z.boolean().optional().describe('Whether this is the default form'),
  fields: z.array(fieldSchema)
    .min(1, 'At least one field is required')
    .max(50, 'Too many fields')
    .describe('Form fields in order'),
})

const updateFormSchema = createFormSchema.partial()

const app = new Hono()

// Apply internal authentication to all routes
app.use('*', internalAuth())

// List all form templates
app.get('/', async (c) => {
  const logger = new Logger({
    correlationId: c.get('correlationId'),
    requestId: c.get('requestId'),
    endpoint: '/api/v1/internal/forms',
    method: 'GET',
  })

  const timer = logger.startTimer()

  try {
    const { organizationId } = c.get('user')
    const supabase = createClient(c)

    logger.info('Fetching form templates', {
      organizationId,
    })

    const { data, error } = await supabase
      .from('application_form_templates')
      .select('id, name, description, category, is_default, fields, created_at, updated_at')
      .eq('organization_id', organizationId)
      .order('is_default', { ascending: false })
      .order('created_at', { ascending: false })

    if (error) {
      logger.error('Database query failed', error, {
        organizationId,
        errorCode: error.code,
      })
      throw new HTTPException(400, { message: 'Failed to fetch form templates' })
    }

    const duration = timer()
    logger.info('Form templates fetched successfully', {
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

// Get single form template
app.get('/:id', zValidator('param', z.object({
  id: z.string().uuid('Invalid form template ID')
})), async (c) => {
  const logger = new Logger({
    correlationId: c.get('correlationId'),
    requestId: c.get('requestId'),
    endpoint: `/api/v1/internal/forms/${c.req.param('id')}`,
    method: 'GET',
  })

  const timer = logger.startTimer()

  try {
    const { organizationId } = c.get('user')
    const { id } = c.req.valid('param')
    const supabase = createClient(c)

    logger.info('Fetching single form template', {
      organizationId,
      formId: id,
    })

    const { data, error } = await supabase
      .from('application_form_templates')
      .select('id, name, description, category, is_default, fields, created_at, updated_at')
      .eq('id', id)
      .eq('organization_id', organizationId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        logger.warn('Form template not found', {
          organizationId,
          formId: id,
        })
        throw new HTTPException(404, { message: 'Form template not found' })
      }
      
      logger.error('Database query failed', error, {
        organizationId,
        formId: id,
        errorCode: error.code,
      })
      throw new HTTPException(400, { message: 'Failed to fetch form template' })
    }

    const duration = timer()
    logger.info('Form template fetched successfully', {
      formId: id,
      fieldCount: Array.isArray(data.fields) ? data.fields.length : 0,
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

// Create form template
app.post('/', zValidator('json', createFormSchema), async (c) => {
  const logger = new Logger({
    correlationId: c.get('correlationId'),
    requestId: c.get('requestId'),
    endpoint: '/api/v1/internal/forms',
    method: 'POST',
  })

  const timer = logger.startTimer()

  try {
    const { organizationId, userId } = c.get('user')
    const body = c.req.valid('json')
    const supabase = createClient(c)

    // Validate field order uniqueness
    const orders = body.fields.map(f => f.order)
    const uniqueOrders = new Set(orders)
    if (orders.length !== uniqueOrders.size) {
      logger.warn('Duplicate field orders detected', {
        organizationId,
        orders,
      })
      throw new HTTPException(400, { message: 'Field orders must be unique' })
    }

    // Validate required file field
    const hasFileField = body.fields.some(f => f.type === 'file')
    if (!hasFileField) {
      logger.warn('Form missing required file field', {
        organizationId,
        name: body.name,
      })
      throw new HTTPException(400, { message: 'Form must include at least one file field for resume upload' })
    }

    logger.info('Creating form template', {
      organizationId,
      userId,
      name: body.name,
      category: body.category,
      isDefault: body.is_default,
      fieldCount: body.fields.length,
    })

    // If setting as default, unset other defaults
    if (body.is_default) {
      logger.info('Unsetting other default forms', { organizationId })
      
      const { error: updateError } = await supabase
        .from('application_form_templates')
        .update({ is_default: false })
        .eq('organization_id', organizationId)

      if (updateError) {
        logger.error('Failed to unset default forms', updateError, {
          organizationId,
          errorCode: updateError.code,
        })
        throw new HTTPException(400, { message: 'Failed to update default forms' })
      }
    }

    const { data, error } = await supabase
      .from('application_form_templates')
      .insert({
        ...body,
        organization_id: organizationId,
        created_by: userId,
      })
      .select('id, name, description, category, is_default, fields, created_at, updated_at')
      .single()

    if (error) {
      if (error.code === '23505') { // Unique constraint violation
        logger.warn('Form template name already exists', {
          organizationId,
          name: body.name,
        })
        throw new HTTPException(409, { message: 'Form template with this name already exists' })
      }
      
      logger.error('Failed to create form template', error, {
        organizationId,
        errorCode: error.code,
      })
      throw new HTTPException(400, { message: 'Failed to create form template' })
    }

    const duration = timer()
    logger.info('Form template created successfully', {
      formId: data.id,
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

// Update form template
app.put('/:id',
  zValidator('param', z.object({ id: z.string().uuid() })),
  zValidator('json', updateFormSchema),
  async (c) => {
    const logger = new Logger({
      correlationId: c.get('correlationId'),
      requestId: c.get('requestId'),
      endpoint: `/api/v1/internal/forms/${c.req.param('id')}`,
      method: 'PUT',
    })

    const timer = logger.startTimer()

    try {
      const { organizationId } = c.get('user')
      const { id } = c.req.valid('param')
      const body = c.req.valid('json')
      const supabase = createClient(c)

      // Validate field order uniqueness if fields are being updated
      if (body.fields) {
        const orders = body.fields.map(f => f.order)
        const uniqueOrders = new Set(orders)
        if (orders.length !== uniqueOrders.size) {
          logger.warn('Duplicate field orders detected in update', {
            organizationId,
            formId: id,
            orders,
          })
          throw new HTTPException(400, { message: 'Field orders must be unique' })
        }

        // Validate required file field
        const hasFileField = body.fields.some(f => f.type === 'file')
        if (!hasFileField) {
          logger.warn('Form update missing required file field', {
            organizationId,
            formId: id,
          })
          throw new HTTPException(400, { message: 'Form must include at least one file field for resume upload' })
        }
      }

      logger.info('Updating form template', {
        organizationId,
        formId: id,
        updates: Object.keys(body),
      })

      // If setting as default, unset other defaults
      if (body.is_default) {
        logger.info('Unsetting other default forms', { organizationId })
        
        const { error: updateError } = await supabase
          .from('application_form_templates')
          .update({ is_default: false })
          .eq('organization_id', organizationId)
          .neq('id', id)

        if (updateError) {
          logger.error('Failed to unset default forms', updateError, {
            organizationId,
            errorCode: updateError.code,
          })
          throw new HTTPException(400, { message: 'Failed to update default forms' })
        }
      }

      const { data, error } = await supabase
        .from('application_form_templates')
        .update({
          ...body,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .eq('organization_id', organizationId)
        .select('id, name, description, category, is_default, fields, created_at, updated_at')
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          logger.warn('Form template not found for update', {
            organizationId,
            formId: id,
          })
          throw new HTTPException(404, { message: 'Form template not found' })
        }
        
        if (error.code === '23505') {
          logger.warn('Form template name already exists', {
            organizationId,
            name: body.name,
          })
          throw new HTTPException(409, { message: 'Form template with this name already exists' })
        }
        
        logger.error('Failed to update form template', error, {
          organizationId,
          formId: id,
          errorCode: error.code,
        })
        throw new HTTPException(400, { message: 'Failed to update form template' })
      }

      const duration = timer()
      logger.info('Form template updated successfully', {
        formId: id,
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

// Delete form template
app.delete('/:id', zValidator('param', z.object({
  id: z.string().uuid()
})), async (c) => {
  const logger = new Logger({
    correlationId: c.get('correlationId'),
    requestId: c.get('requestId'),
    endpoint: `/api/v1/internal/forms/${c.req.param('id')}`,
    method: 'DELETE',
  })

  const timer = logger.startTimer()

  try {
    const { organizationId } = c.get('user')
    const { id } = c.req.valid('param')
    const supabase = createClient(c)

    logger.info('Deleting form template', {
      organizationId,
      formId: id,
    })

    // Check if this form is in use by any job postings
    const { count, error: countError } = await supabase
      .from('job_postings')
      .select('id', { count: 'exact', head: true })
      .eq('form_template_id', id)
      .eq('organization_id', organizationId)

    if (countError) {
      logger.error('Failed to check form usage', countError, {
        organizationId,
        formId: id,
      })
      throw new HTTPException(400, { message: 'Failed to check form usage' })
    }

    if (count && count > 0) {
      logger.warn('Cannot delete form in use', {
        organizationId,
        formId: id,
        jobPostingsCount: count,
      })
      throw new HTTPException(409, { 
        message: `Cannot delete form template. It is currently used by ${count} job posting(s).` 
      })
    }

    const { error } = await supabase
      .from('application_form_templates')
      .delete()
      .eq('id', id)
      .eq('organization_id', organizationId)

    if (error) {
      logger.error('Failed to delete form template', error, {
        organizationId,
        formId: id,
        errorCode: error.code,
      })
      throw new HTTPException(400, { message: 'Failed to delete form template' })
    }

    const duration = timer()
    logger.info('Form template deleted successfully', {
      formId: id,
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

// Duplicate form template
app.post('/:id/duplicate', zValidator('param', z.object({
  id: z.string().uuid()
})), async (c) => {
  const logger = new Logger({
    correlationId: c.get('correlationId'),
    requestId: c.get('requestId'),
    endpoint: `/api/v1/internal/forms/${c.req.param('id')}/duplicate`,
    method: 'POST',
  })

  const timer = logger.startTimer()

  try {
    const { organizationId, userId } = c.get('user')
    const { id } = c.req.valid('param')
    const supabase = createClient(c)

    logger.info('Duplicating form template', {
      organizationId,
      userId,
      sourceFormId: id,
    })

    // Get original template
    const { data: original, error: fetchError } = await supabase
      .from('application_form_templates')
      .select('name, description, category, fields')
      .eq('id', id)
      .eq('organization_id', organizationId)
      .single()

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        logger.warn('Source form template not found', {
          organizationId,
          sourceFormId: id,
        })
        throw new HTTPException(404, { message: 'Form template not found' })
      }
      
      logger.error('Failed to fetch source form', fetchError, {
        organizationId,
        sourceFormId: id,
        errorCode: fetchError.code,
      })
      throw new HTTPException(400, { message: 'Failed to fetch source form template' })
    }

    // Create duplicate with (Copy) suffix
    const { data, error } = await supabase
      .from('application_form_templates')
      .insert({
        name: `${original.name} (Copy)`,
        description: original.description,
        category: original.category,
        is_default: false, // Copies are never default
        fields: original.fields,
        organization_id: organizationId,
        created_by: userId,
      })
      .select('id, name, description, category, is_default, fields, created_at, updated_at')
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
          .from('application_form_templates')
          .insert({
            name: `${original.name} (Copy ${timestamp})`,
            description: original.description,
            category: original.category,
            is_default: false,
            fields: original.fields,
            organization_id: organizationId,
            created_by: userId,
          })
          .select('id, name, description, category, is_default, fields, created_at, updated_at')
          .single()
          
        if (retryError) {
          logger.error('Failed to create duplicate with timestamp', retryError, {
            organizationId,
            errorCode: retryError.code,
          })
          throw new HTTPException(400, { message: 'Failed to create duplicate form template' })
        }
        
        const duration = timer()
        logger.info('Form template duplicated successfully with timestamp', {
          sourceFormId: id,
          newFormId: retryData.id,
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
      
      logger.error('Failed to create duplicate form', error, {
        organizationId,
        errorCode: error.code,
      })
      throw new HTTPException(400, { message: 'Failed to create duplicate form template' })
    }

    const duration = timer()
    logger.info('Form template duplicated successfully', {
      sourceFormId: id,
      newFormId: data.id,
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