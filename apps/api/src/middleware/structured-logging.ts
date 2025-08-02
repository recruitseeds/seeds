import type { Context, Next } from 'hono'
import { Logger } from '../services/logger.js'

export interface LoggingContext {
  Variables: {
    correlationId: string
    requestId: string
    logger: Logger
    startTime: number
  }
}

export const structuredLogging = () => {
  return async (c: Context<LoggingContext>, next: Next) => {
    const correlationId = c.get('correlationId') || crypto.randomUUID()
    const requestId = c.get('requestId') || crypto.randomUUID()
    
    const logger = new Logger({ correlationId, requestId })
    const startTime = Date.now()
    
    c.set('logger', logger)
    c.set('startTime', startTime)

    logger.info('Request started', {
      method: c.req.method,
      path: c.req.path,
      userAgent: c.req.header('user-agent'),
      ip: c.req.header('x-forwarded-for') || c.req.header('x-real-ip') || 'unknown',
    })

    await next()

    const duration = Date.now() - startTime
    const status = c.res.status

    logger.info('Request completed', {
      method: c.req.method,
      path: c.req.path,
      status,
      duration,
      success: status < 400,
    })
  }
}