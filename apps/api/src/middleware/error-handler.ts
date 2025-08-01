import { createMiddleware } from 'hono/factory'
import { HTTPException } from 'hono/http-exception'

export interface APIError {
  success: false
  error: {
    code: string
    message: string
    details?: Record<string, unknown>
  }
  timestamp: string
  correlationId?: string
}

export const errorHandler = () => {
  return createMiddleware(async (c, next) => {
    try {
      await next()
    } catch (error) {
      const correlationId = c.get('correlationId')
      const timestamp = new Date().toISOString()

      if (error instanceof HTTPException) {
        const response: APIError = {
          success: false,
          error: {
            code: `HTTP_${error.status}`,
            message: error.message,
          },
          timestamp,
          ...(correlationId && { correlationId }),
        }
        return c.json(response, error.status)
      }

      if (error instanceof Error && error.name === 'ValidationError') {
        const response: APIError = {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Request validation failed',
            details: { message: error.message },
          },
          timestamp,
          ...(correlationId && { correlationId }),
        }
        return c.json(response, 400)
      }

      if (error instanceof Error && error.message.includes('AI service')) {
        const response: APIError = {
          success: false,
          error: {
            code: 'AI_SERVICE_ERROR',
            message: 'AI service temporarily unavailable',
            details: process.env.NODE_ENV === 'development' ? { originalError: error.message } : undefined,
          },
          timestamp,
          ...(correlationId && { correlationId }),
        }
        return c.json(response, 503)
      }

      const response: APIError = {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message:
            process.env.NODE_ENV === 'development'
              ? error instanceof Error
                ? error.message
                : 'Unknown error'
              : 'An internal error occurred',
          ...(process.env.NODE_ENV === 'development' &&
            error instanceof Error && {
              details: { stack: error.stack },
            }),
        },
        timestamp,
        ...(correlationId && { correlationId }),
      }

      return c.json(response, 500)
    }
  })
}
