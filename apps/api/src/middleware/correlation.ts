import { createMiddleware } from 'hono/factory'
import { randomUUID } from 'node:crypto'

export interface CorrelationContext {
  correlationId: string
  requestId: string
}

export const correlationMiddleware = () => {
  return createMiddleware(async (c, next) => {
    const correlationId = c.req.header('x-correlation-id') || randomUUID()
    const requestId = randomUUID()

    c.header('x-correlation-id', correlationId)
    c.header('x-request-id', requestId)

    c.set('correlationId', correlationId)
    c.set('requestId', requestId)

    await next()
  })
}
