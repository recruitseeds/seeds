import { Hono } from 'hono'
import { z } from 'zod'
import { zValidator } from '@hono/zod-validator'
import { createClient } from '@/lib/supabase/server'
import { internalAuth } from '@/middleware/internal-auth'
import { Logger } from '@/services/logger'
import { HTTPException } from 'hono/HTTPException'

const brandingSchema = z.object({
  primary_color: z
    .string()
    .regex(/^#[0-9A-F]{6}$/i, 'Must be valid hex color')
    .optional()
    .describe('Primary brand color'),
  secondary_color: z
    .string()
    .regex(/^#[0-9A-F]{6}$/i, 'Must be valid hex color')
    .optional()
    .describe('Secondary brand color'),
  accent_color: z
    .string()
    .regex(/^#[0-9A-F]{6}$/i, 'Must be valid hex color')
    .optional()
    .describe('Accent color for highlights'),
  font_family: z
    .string()
    .min(1)
    .max(50)
    .optional()
    .describe('Font family name'),
  custom_css: z
    .string()
    .max(10000, 'CSS too long')
    .optional()
    .describe('Custom CSS for advanced styling'),
  logo_url: z
    .string()
    .url('Must be valid URL')
    .optional()
    .describe('Company logo URL'),
  favicon_url: z
    .string()
    .url('Must be valid URL')
    .optional()
    .describe('Company favicon URL'),
})

const emailSettingsSchema = z.object({
  reply_to: z
    .string()
    .email('Must be valid email')
    .optional()
    .nullable()
    .describe('Reply-to email address'),
  signature_name: z
    .string()
    .min(1)
    .max(100)
    .optional()
    .describe('Email signature name'),
  send_confirmations: z
    .boolean()
    .optional()
    .describe('Send application confirmation emails'),
  send_status_updates: z
    .boolean()
    .optional()
    .describe('Send pipeline status update emails'),
})

const complianceSettingsSchema = z.object({
  data_retention_days: z
    .number()
    .int()
    .positive()
    .min(30, 'Minimum 30 days retention')
    .max(2555, 'Maximum 7 years retention')
    .optional()
    .describe('Data retention period in days'),
  collect_eeoc: z
    .boolean()
    .optional()
    .describe('Collect EEOC demographic data'),
  gdpr_notice: z
    .boolean()
    .optional()
    .describe('Show GDPR privacy notice'),
})

const scoringWeightsSchema = z.object({
  skills: z.number().min(0).max(100).describe('Skills weight percentage'),
  experience: z.number().min(0).max(100).describe('Experience weight percentage'),
  education: z.number().min(0).max(100).describe('Education weight percentage'),
}).refine(
  (data) => data.skills + data.experience + data.education === 100,
  'Weights must sum to 100'
)

const aiSettingsSchema = z.object({
  auto_parse: z
    .boolean()
    .optional()
    .describe('Automatically parse uploaded resumes'),
  auto_score: z
    .boolean()
    .optional()
    .describe('Automatically calculate job fit scores'),
  extract_links: z
    .boolean()
    .optional()
    .describe('Extract URLs from resumes'),
  scoring_weights: scoringWeightsSchema
    .optional()
    .describe('Weights for scoring algorithm'),
  auto_reject: z
    .boolean()
    .optional()
    .describe('Enable automatic rejection'),
  rejection_threshold: z
    .number()
    .min(0, 'Threshold must be positive')
    .max(100, 'Threshold cannot exceed 100')
    .optional()
    .describe('Score threshold for auto-rejection'),
  rejection_delay_hours: z
    .number()
    .int()
    .positive()
    .min(1, 'Minimum 1 hour delay')
    .max(336, 'Maximum 2 weeks delay')
    .optional()
    .describe('Hours to delay rejection emails'),
})

const applicationSettingsSchema = z.object({
  require_resume: z
    .boolean()
    .optional()
    .describe('Require resume upload'),
  require_cover_letter: z
    .boolean()
    .optional()
    .describe('Require cover letter'),
  require_linkedin: z
    .boolean()
    .optional()
    .describe('Require LinkedIn URL'),
  require_portfolio: z
    .boolean()
    .optional()
    .describe('Require portfolio URL'),
  max_applications: z
    .number()
    .int()
    .positive()
    .optional()
    .nullable()
    .describe('Maximum applications per job'),
  auto_close_on_limit: z
    .boolean()
    .optional()
    .describe('Auto-close job when max applications reached'),
})

const app = new Hono()

app.use('*', internalAuth())

app.get('/', async (c) => {
  const logger = new Logger({
    correlationId: c.get('correlationId'),
    requestId: c.get('requestId'),
    endpoint: '/api/v1/internal/org-settings',
    method: 'GET',
  })

  const timer = logger.startTimer()

  try {
    const { organizationId } = c.get('user')
    const supabase = createClient(c)

    logger.info('Fetching organization settings', {
      organizationId,
    })

    const { data, error } = await supabase
      .from('organization_settings')
      .select('*')
      .eq('organization_id', organizationId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        logger.info('Creating default organization settings', {
          organizationId,
        })
        
        const { data: newSettings, error: createError } = await supabase
          .from('organization_settings')
          .insert({ organization_id: organizationId })
          .select('*')
          .single()

        if (createError) {
          logger.error('Failed to create default settings', createError, {
            organizationId,
            errorCode: createError.code,
          })
          throw new HTTPException(400, { message: 'Failed to create organization settings' })
        }

        const duration = timer()
        logger.info('Default organization settings created', {
          organizationId,
          duration,
        })

        return c.json({
          success: true,
          data: newSettings,
          metadata: {
            processingTimeMs: duration,
            correlationId: c.get('correlationId'),
            timestamp: new Date().toISOString(),
          }
        })
      }
      
      logger.error('Database query failed', error, {
        organizationId,
        errorCode: error.code,
      })
      throw new HTTPException(400, { message: 'Failed to fetch organization settings' })
    }

    const duration = timer()
    logger.info('Organization settings fetched successfully', {
      organizationId,
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

app.put('/branding', zValidator('json', brandingSchema), async (c) => {
  const logger = new Logger({
    correlationId: c.get('correlationId'),
    requestId: c.get('requestId'),
    endpoint: '/api/v1/internal/org-settings/branding',
    method: 'PUT',
  })

  const timer = logger.startTimer()

  try {
    const { organizationId } = c.get('user')
    const body = c.req.valid('json')
    const supabase = createClient(c)

    logger.info('Updating branding settings', {
      organizationId,
      updates: Object.keys(body),
    })

    const { data, error } = await supabase
      .from('organization_settings')
      .update({
        branding: body,
        updated_at: new Date().toISOString(),
      })
      .eq('organization_id', organizationId)
      .select('*')
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        logger.warn('Organization settings not found, creating defaults', {
          organizationId,
        })
        
        const { data: newData, error: createError } = await supabase
          .from('organization_settings')
          .insert({
            organization_id: organizationId,
            branding: body,
          })
          .select('*')
          .single()

        if (createError) {
          logger.error('Failed to create settings with branding', createError, {
            organizationId,
            errorCode: createError.code,
          })
          throw new HTTPException(400, { message: 'Failed to create organization settings' })
        }

        const duration = timer()
        logger.info('Branding settings created successfully', {
          organizationId,
          duration,
        })

        return c.json({
          success: true,
          data: newData,
          metadata: {
            processingTimeMs: duration,
            correlationId: c.get('correlationId'),
            timestamp: new Date().toISOString(),
          }
        })
      }
      
      logger.error('Failed to update branding settings', error, {
        organizationId,
        errorCode: error.code,
      })
      throw new HTTPException(400, { message: 'Failed to update branding settings' })
    }

    const duration = timer()
    logger.info('Branding settings updated successfully', {
      organizationId,
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

app.put('/email', zValidator('json', emailSettingsSchema), async (c) => {
  const logger = new Logger({
    correlationId: c.get('correlationId'),
    requestId: c.get('requestId'),
    endpoint: '/api/v1/internal/org-settings/email',
    method: 'PUT',
  })

  const timer = logger.startTimer()

  try {
    const { organizationId } = c.get('user')
    const body = c.req.valid('json')
    const supabase = createClient(c)

    logger.info('Updating email settings', {
      organizationId,
      updates: Object.keys(body),
    })

    const { data, error } = await supabase
      .from('organization_settings')
      .update({
        email_settings: body,
        updated_at: new Date().toISOString(),
      })
      .eq('organization_id', organizationId)
      .select('*')
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        const { data: newData, error: createError } = await supabase
          .from('organization_settings')
          .insert({
            organization_id: organizationId,
            email_settings: body,
          })
          .select('*')
          .single()

        if (createError) {
          logger.error('Failed to create settings with email config', createError, {
            organizationId,
            errorCode: createError.code,
          })
          throw new HTTPException(400, { message: 'Failed to create organization settings' })
        }

        const duration = timer()
        return c.json({
          success: true,
          data: newData,
          metadata: {
            processingTimeMs: duration,
            correlationId: c.get('correlationId'),
            timestamp: new Date().toISOString(),
          }
        })
      }
      
      logger.error('Failed to update email settings', error, {
        organizationId,
        errorCode: error.code,
      })
      throw new HTTPException(400, { message: 'Failed to update email settings' })
    }

    const duration = timer()
    logger.info('Email settings updated successfully', {
      organizationId,
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

app.put('/compliance', zValidator('json', complianceSettingsSchema), async (c) => {
  const logger = new Logger({
    correlationId: c.get('correlationId'),
    requestId: c.get('requestId'),
    endpoint: '/api/v1/internal/org-settings/compliance',
    method: 'PUT',
  })

  const timer = logger.startTimer()

  try {
    const { organizationId } = c.get('user')
    const body = c.req.valid('json')
    const supabase = createClient(c)

    logger.info('Updating compliance settings', {
      organizationId,
      updates: Object.keys(body),
    })

    const { data, error } = await supabase
      .from('organization_settings')
      .update({
        compliance_settings: body,
        updated_at: new Date().toISOString(),
      })
      .eq('organization_id', organizationId)
      .select('*')
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        const { data: newData, error: createError } = await supabase
          .from('organization_settings')
          .insert({
            organization_id: organizationId,
            compliance_settings: body,
          })
          .select('*')
          .single()

        if (createError) {
          logger.error('Failed to create settings with compliance config', createError, {
            organizationId,
            errorCode: createError.code,
          })
          throw new HTTPException(400, { message: 'Failed to create organization settings' })
        }

        const duration = timer()
        return c.json({
          success: true,
          data: newData,
          metadata: {
            processingTimeMs: duration,
            correlationId: c.get('correlationId'),
            timestamp: new Date().toISOString(),
          }
        })
      }
      
      logger.error('Failed to update compliance settings', error, {
        organizationId,
        errorCode: error.code,
      })
      throw new HTTPException(400, { message: 'Failed to update compliance settings' })
    }

    const duration = timer()
    logger.info('Compliance settings updated successfully', {
      organizationId,
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

app.put('/ai', zValidator('json', aiSettingsSchema), async (c) => {
  const logger = new Logger({
    correlationId: c.get('correlationId'),
    requestId: c.get('requestId'),
    endpoint: '/api/v1/internal/org-settings/ai',
    method: 'PUT',
  })

  const timer = logger.startTimer()

  try {
    const { organizationId } = c.get('user')
    const body = c.req.valid('json')
    const supabase = createClient(c)

    if (body.auto_reject && !body.rejection_threshold) {
      logger.warn('Auto-reject enabled without threshold', {
        organizationId,
      })
      throw new HTTPException(400, { 
        message: 'Rejection threshold is required when auto-reject is enabled' 
      })
    }

    logger.info('Updating AI settings', {
      organizationId,
      updates: Object.keys(body),
      autoReject: body.auto_reject,
      threshold: body.rejection_threshold,
    })

    const { data, error } = await supabase
      .from('organization_settings')
      .update({
        ai_settings: body,
        updated_at: new Date().toISOString(),
      })
      .eq('organization_id', organizationId)
      .select('*')
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        const { data: newData, error: createError } = await supabase
          .from('organization_settings')
          .insert({
            organization_id: organizationId,
            ai_settings: body,
          })
          .select('*')
          .single()

        if (createError) {
          logger.error('Failed to create settings with AI config', createError, {
            organizationId,
            errorCode: createError.code,
          })
          throw new HTTPException(400, { message: 'Failed to create organization settings' })
        }

        const duration = timer()
        return c.json({
          success: true,
          data: newData,
          metadata: {
            processingTimeMs: duration,
            correlationId: c.get('correlationId'),
            timestamp: new Date().toISOString(),
          }
        })
      }
      
      logger.error('Failed to update AI settings', error, {
        organizationId,
        errorCode: error.code,
      })
      throw new HTTPException(400, { message: 'Failed to update AI settings' })
    }

    const duration = timer()
    logger.info('AI settings updated successfully', {
      organizationId,
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

app.put('/application', zValidator('json', applicationSettingsSchema), async (c) => {
  const logger = new Logger({
    correlationId: c.get('correlationId'),
    requestId: c.get('requestId'),
    endpoint: '/api/v1/internal/org-settings/application',
    method: 'PUT',
  })

  const timer = logger.startTimer()

  try {
    const { organizationId } = c.get('user')
    const body = c.req.valid('json')
    const supabase = createClient(c)

    logger.info('Updating application settings', {
      organizationId,
      updates: Object.keys(body),
    })

    const { data, error } = await supabase
      .from('organization_settings')
      .update({
        application_settings: body,
        updated_at: new Date().toISOString(),
      })
      .eq('organization_id', organizationId)
      .select('*')
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        const { data: newData, error: createError } = await supabase
          .from('organization_settings')
          .insert({
            organization_id: organizationId,
            application_settings: body,
          })
          .select('*')
          .single()

        if (createError) {
          logger.error('Failed to create settings with application config', createError, {
            organizationId,
            errorCode: createError.code,
          })
          throw new HTTPException(400, { message: 'Failed to create organization settings' })
        }

        const duration = timer()
        return c.json({
          success: true,
          data: newData,
          metadata: {
            processingTimeMs: duration,
            correlationId: c.get('correlationId'),
            timestamp: new Date().toISOString(),
          }
        })
      }
      
      logger.error('Failed to update application settings', error, {
        organizationId,
        errorCode: error.code,
      })
      throw new HTTPException(400, { message: 'Failed to update application settings' })
    }

    const duration = timer()
    logger.info('Application settings updated successfully', {
      organizationId,
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

export default app