import { createRoute, z } from '@hono/zod-openapi'
import type { Context } from 'hono'
import { createOpenAPIApp } from '../../../lib/openapi.js'
import { internalAuth, type InternalAuthContext } from '../../../middleware/internal-auth.js'
import { structuredLogging } from '../../../middleware/structured-logging.js'
import { EmailService } from '../../../services/email.js'
import { LoggerService } from '../../../services/logger.js'
import { createClient } from '@supabase/supabase-js'
import type { Database } from '../../../../../packages/supabase/types/db.js'
import { ConfigService } from '../../../services/config.js'

const cronRoutes = createOpenAPIApp()

cronRoutes.use('*', structuredLogging)
cronRoutes.use('*', internalAuth())

const sendRejectionEmailsRoute = createRoute({
  method: 'post',
  path: '/send-rejection-emails',
  summary: 'Process scheduled rejection emails',
  description: 'Cron job endpoint that processes all pending rejection emails due to be sent',
  security: [{ InternalAuth: [] }],
  request: {
    body: {
      content: {
        'application/json': {
          schema: z.object({
            timestamp: z.string().datetime().optional(),
            job_type: z.string().optional(),
            dry_run: z.boolean().default(false),
          }),
        },
      },
    },
  },
  responses: {
    200: {
      description: 'Successfully processed rejection emails',
      content: {
        'application/json': {
          schema: z.object({
            success: z.boolean(),
            data: z.object({
              processed: z.number(),
              sent: z.number(),
              failed: z.number(),
              batch_count: z.number(),
            }),
            metadata: z.object({
              correlationId: z.string(),
              timestamp: z.string(),
              processingTimeMs: z.number(),
            }),
          }),
        },
      },
    },
    401: {
      description: 'Unauthorized - Invalid internal token',
      content: {
        'application/json': {
          schema: z.object({
            success: z.boolean(),
            error: z.object({
              code: z.string(),
              message: z.string(),
            }),
            correlationId: z.string(),
          }),
        },
      },
    },
    500: {
      description: 'Internal server error',
      content: {
        'application/json': {
          schema: z.object({
            success: z.boolean(),
            error: z.object({
              code: z.string(),
              message: z.string(),
            }),
            correlationId: z.string(),
          }),
        },
      },
    },
  },
})

interface PendingRejectionEmail {
  email_id: string
  application_id: string
  recipient_email: string
  candidate_name: string
  job_title: string
  company_name: string
}

const BATCH_SIZE = 50

cronRoutes.openapi(sendRejectionEmailsRoute, async (c: Context<InternalAuthContext>) => {
  const startTime = Date.now()
  const correlationId = c.get('correlationId')
  const logger = LoggerService.getInstance().createChildLogger({ correlationId })
  const emailService = new EmailService(logger)
  
  const config = ConfigService.getInstance().getConfig()
  const supabase = createClient<Database>(config.supabaseUrl, config.supabaseServiceRoleKey)
  
  const body = await c.req.json()
  const isDryRun = body.dry_run || false

  logger.info('Starting rejection email processing', {
    dry_run: isDryRun,
    triggered_by: 'cron_job',
  })

  try {
    const { data: pendingEmails, error } = await supabase
      .rpc('get_pending_rejection_emails')
      .returns<PendingRejectionEmail[]>()

    if (error) {
      logger.error('Failed to fetch pending rejection emails', error)
      return c.json({
        success: false,
        error: {
          code: 'DATABASE_ERROR',
          message: 'Failed to fetch pending rejection emails',
        },
        correlationId,
      }, 500)
    }

    if (!pendingEmails || pendingEmails.length === 0) {
      logger.info('No pending rejection emails found')
      return c.json({
        success: true,
        data: {
          processed: 0,
          sent: 0,
          failed: 0,
          batch_count: 0,
        },
        metadata: {
          correlationId,
          timestamp: new Date().toISOString(),
          processingTimeMs: Date.now() - startTime,
        },
      })
    }

    logger.info('Processing rejection emails', {
      total_emails: pendingEmails.length,
      batch_size: BATCH_SIZE,
    })

    let totalSent = 0
    let totalFailed = 0
    let batchCount = 0

    for (let i = 0; i < pendingEmails.length; i += BATCH_SIZE) {
      const batch = pendingEmails.slice(i, i + BATCH_SIZE)
      batchCount++

      logger.info('Processing batch', {
        batch_number: batchCount,
        batch_size: batch.length,
        emails_in_batch: batch.map(e => ({ 
          email_id: e.email_id, 
          recipient: e.recipient_email 
        })),
      })

      if (isDryRun) {
        logger.info('Dry run - would send emails', {
          batch_emails: batch.map(e => ({
            email_id: e.email_id,
            recipient: e.recipient_email,
            candidate_name: e.candidate_name,
            job_title: e.job_title,
            company_name: e.company_name,
          })),
        })
        totalSent += batch.length
        continue
      }

      const batchResults = await Promise.allSettled(
        batch.map(async (email) => {
          try {
            const emailId = await emailService.sendTemplatedEmail(
              'candidate-rejection',
              {
                candidateName: email.candidate_name,
                jobTitle: email.job_title,
                companyName: email.company_name,
                applicationId: email.application_id,
              },
              email.recipient_email,
              {
                correlationId,
                candidateId: email.application_id,
                companyId: email.company_name.toLowerCase().replace(/\s+/g, '-'),
              }
            )

            await supabase.rpc('mark_rejection_email_sent', {
              p_email_id: email.email_id,
              p_service_id: emailId,
            })

            logger.info('Rejection email sent successfully', {
              email_id: email.email_id,
              resend_id: emailId,
              recipient: email.recipient_email,
              candidate_name: email.candidate_name,
            })

            return { success: true, email_id: email.email_id }
          } catch (error) {
            logger.error('Failed to send rejection email', error, {
              email_id: email.email_id,
              recipient: email.recipient_email,
              candidate_name: email.candidate_name,
            })

            await supabase.rpc('mark_rejection_email_failed', {
              p_email_id: email.email_id,
              p_error_message: error instanceof Error ? error.message : 'Unknown error',
            })

            return { success: false, email_id: email.email_id, error }
          }
        })
      )

      const batchSent = batchResults.filter(result => 
        result.status === 'fulfilled' && result.value.success
      ).length
      const batchFailed = batchResults.length - batchSent

      totalSent += batchSent
      totalFailed += batchFailed

      logger.info('Batch processing completed', {
        batch_number: batchCount,
        sent: batchSent,
        failed: batchFailed,
      })

      if (batchCount < Math.ceil(pendingEmails.length / BATCH_SIZE)) {
        await new Promise(resolve => setTimeout(resolve, 1000))
      }
    }

    const processingTimeMs = Date.now() - startTime

    logger.info('Rejection email processing completed', {
      total_processed: pendingEmails.length,
      total_sent: totalSent,
      total_failed: totalFailed,
      batch_count: batchCount,
      processing_time_ms: processingTimeMs,
      dry_run: isDryRun,
    })

    return c.json({
      success: true,
      data: {
        processed: pendingEmails.length,
        sent: totalSent,
        failed: totalFailed,
        batch_count: batchCount,
      },
      metadata: {
        correlationId,
        timestamp: new Date().toISOString(),
        processingTimeMs,
      },
    })

  } catch (error) {
    const processingTimeMs = Date.now() - startTime
    logger.error('Unexpected error processing rejection emails', error, {
      processing_time_ms: processingTimeMs,
    })

    return c.json({
      success: false,
      error: {
        code: 'PROCESSING_ERROR',
        message: 'Failed to process rejection emails',
      },
      correlationId,
    }, 500)
  }
})

export { cronRoutes }