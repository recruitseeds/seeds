import { createRoute, z } from '@hono/zod-openapi'
import type { Context } from 'hono'
import { ErrorResponseSchema, MetadataSchema, createOpenAPIApp } from '../../../lib/openapi.js'
import { publicAuth } from '../../../middleware/public-auth.js'
import { adaptiveRateLimit } from '../../../middleware/rate-limit.js'
import { businessValidation, validate } from '../../../middleware/validation.js'
import { type CandidateApplicationEmailData, EmailService } from '../../../services/email.js'
import { Logger } from '../../../services/logger.js'

const publicNotificationsRoutes = createOpenAPIApp()

publicNotificationsRoutes.use('*', publicAuth())
publicNotificationsRoutes.use('*', adaptiveRateLimit())

const SendApplicationEmailRequestSchema = z.object({
  body: z.object({
    candidateId: z.string().uuid('Must be a valid UUID'),
    candidateName: z.string().min(1, 'Candidate name is required'),
    candidateEmail: z.string().email('Must be a valid email address'),
    jobId: z.string().uuid('Must be a valid UUID'),
    jobTitle: z.string().min(1, 'Job title is required'),
    companyName: z.string().min(1, 'Company name is required'),
    applicationId: z.string().uuid('Must be a valid UUID'),
    portalUrl: z.string().url().optional(),
    companyLogo: z.string().url().optional(),
    contactEmail: z.string().email().optional(),
  }),
})

const SendApplicationEmailResponseSchema = z.object({
  success: z.literal(true),
  data: z.object({
    emailId: z.string(),
    candidateEmail: z.string(),
    status: z.literal('sent'),
  }),
  metadata: MetadataSchema,
})

const sendApplicationEmailRoute = createRoute({
  method: 'post',
  path: '/application-received',
  tags: ['Public - Notifications'],
  summary: 'Send application received confirmation email',
  description: `Send an automated confirmation email to a candidate when their application is received.
    
    **Key Features:**
    - Professional HTML email template with company branding
    - Automatic application tracking ID inclusion
    - Optional candidate portal URL for application status tracking
    - GDPR-compliant with unsubscribe options
    - Comprehensive delivery tracking and logging
    
    **Email Content:**
    - Confirmation of application receipt
    - Next steps in the hiring process
    - Timeline expectations (5-7 business days)
    - Application tracking information
    - Company contact information
    
    **Security & Privacy:**
    - Only companies can send emails for their own candidates
    - No PII exposure in API logs
    - GDPR-compliant email handling
    - Comprehensive audit trail
    
    **Rate Limits:**
    - Free tier: 100 emails/hour
    - Pro tier: 1,000 emails/hour  
    - Enterprise: Custom limits`,
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      content: {
        'application/json': {
          schema: z.object({
            candidateId: z.string().uuid().describe('Unique identifier for the candidate'),
            candidateName: z.string().min(1).describe('Full name of the candidate'),
            candidateEmail: z.string().email().describe('Email address where confirmation will be sent'),
            jobId: z.string().uuid().describe('Job posting ID the candidate applied for'),
            jobTitle: z.string().min(1).describe('Title of the position applied for'),
            companyName: z.string().min(1).describe('Name of the hiring company'),
            applicationId: z.string().uuid().describe('Unique application tracking ID'),
            portalUrl: z.string().url().optional().describe('Optional URL to candidate portal for status tracking'),
            companyLogo: z.string().url().optional().describe('Optional company logo URL for email branding'),
            contactEmail: z.string().email().optional().describe('Optional contact email for candidate questions'),
          }),
        },
      },
    },
  },
  responses: {
    200: {
      content: {
        'application/json': {
          schema: SendApplicationEmailResponseSchema,
        },
      },
      description: 'Email sent successfully',
    },
    400: {
      content: {
        'application/json': {
          schema: ErrorResponseSchema,
        },
      },
      description: 'Invalid request data or validation failed',
    },
    401: {
      content: {
        'application/json': {
          schema: ErrorResponseSchema,
        },
      },
      description: 'Authentication required - invalid or missing API key',
    },
    403: {
      content: {
        'application/json': {
          schema: ErrorResponseSchema,
        },
      },
      description: 'Access denied - insufficient permissions for email sending',
    },
    429: {
      content: {
        'application/json': {
          schema: ErrorResponseSchema,
        },
      },
      description: 'Rate limit exceeded - email sending limits reached',
    },
    503: {
      content: {
        'application/json': {
          schema: ErrorResponseSchema,
        },
      },
      description: 'Email service temporarily unavailable',
    },
  },
})

const validateEmailPermissions = async (c: Context) => {
  const { permissions } = c.get('apiKeyMeta')

  if (!permissions.includes('notifications:send')) {
    throw new Error('Email sending requires notifications:send permission')
  }
}

publicNotificationsRoutes.openapi(
  sendApplicationEmailRoute,
  validate(SendApplicationEmailRequestSchema),
  businessValidation(validateEmailPermissions),
  async (c) => {
    const correlationId = c.get('correlationId')
    const logger = new Logger({ correlationId, requestId: c.get('requestId') })
    const { body } = c.get('validatedData')
    const { companyId } = c.get('apiKeyMeta')

    const getTimer = () => {
      const start = Date.now()
      return () => Date.now() - start
    }
    const timer = getTimer()

    try {
      logger.info('Public API: Sending application confirmation email', {
        candidateId: body.candidateId,
        candidateEmail: body.candidateEmail,
        jobId: body.jobId,
        jobTitle: body.jobTitle,
        companyName: body.companyName,
        applicationId: body.applicationId,
        companyId,
      })

      const emailService = new EmailService(logger)

      const emailData: CandidateApplicationEmailData = {
        candidateName: body.candidateName,
        candidateEmail: body.candidateEmail,
        jobTitle: body.jobTitle,
        companyName: body.companyName,
        applicationId: body.applicationId,
        portalUrl: body.portalUrl,
        companyLogo: body.companyLogo,
        contactEmail: body.contactEmail,
      }

      const emailId = await emailService.sendApplicationReceivedEmail(emailData, { correlationId })

      logger.info('Public API: Application email sent successfully', {
        emailId,
        candidateId: body.candidateId,
        candidateEmail: body.candidateEmail,
        applicationId: body.applicationId,
        processingTimeMs: timer(),
        companyId,
      })

      return c.json({
        success: true,
        data: {
          emailId,
          candidateEmail: body.candidateEmail,
          status: 'sent' as const,
        },
        metadata: {
          processingTimeMs: timer(),
          correlationId,
          timestamp: new Date().toISOString(),
        },
      })
    } catch (error) {
      const processingTime = timer()

      logger.error('Public API: Application email sending failed', error, {
        candidateId: body.candidateId,
        candidateEmail: body.candidateEmail,
        applicationId: body.applicationId,
        processingTimeMs: processingTime,
        companyId,
      })

      if (error instanceof Error && (error.message.includes('Resend') || error.message.includes('Email'))) {
        return c.json(
          {
            success: false,
            error: {
              code: 'EMAIL_SERVICE_UNAVAILABLE',
              message: 'Email service is temporarily unavailable. Please try again in a few moments.',
              retryAfter: '60s',
            },
            correlationId,
          },
          503
        )
      }

      return c.json(
        {
          success: false,
          error: {
            code: 'INTERNAL_ERROR',
            message: 'An error occurred while sending the email',
          },
          correlationId,
        },
        500
      )
    }
  }
)

export { publicNotificationsRoutes }
