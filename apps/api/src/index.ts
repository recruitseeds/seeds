import { serve } from '@hono/node-server'
import 'dotenv/config'
import { cors } from 'hono/cors'
import { logger as honoLogger } from 'hono/logger'

import { addSwaggerUI, createOpenAPIApp } from './lib/openapi.js'
import { correlationMiddleware } from './middleware/correlation.js'
import { errorHandler } from './middleware/error-handler.js'
import { structuredLogging } from './middleware/structured-logging.js'
import { v1Routes } from './routes/v1/index.js'
import { publicRoutes } from './routes/v1/public/index.js'
import { internalRoutes } from './routes/v1/internal/index.js'
import { ConfigService } from './services/config.js'
import { Logger } from './services/logger.js'

const app = createOpenAPIApp()

app.use('*', errorHandler())
app.use('*', correlationMiddleware())
app.use('*', structuredLogging())
app.use('*', cors())

app.get('/health', (c) =>
  c.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    message: 'Use /api/v1/health for versioned health check',
  })
)

app.route('/api/v1', v1Routes)
app.route('/api/v1/public', publicRoutes)
app.route('/api/v1/internal', internalRoutes)

app.route('/test/v1', v1Routes)

addSwaggerUI(app)

app.notFound((c) => {
  return c.json(
    {
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: `Route ${c.req.method} ${c.req.path} not found`,
      },
      timestamp: new Date().toISOString(),
      correlationId: c.get('correlationId') || 'unknown',
    },
    404
  )
})

const config = ConfigService.getInstance().getConfig()
const logger = new Logger()

logger.info('Starting API server', {
  port: config.port,
  environment: config.nodeEnv,
  apiVersion: 'v1',
})

serve({
  fetch: app.fetch,
  port: config.port,
})

logger.info('🚀 API server running', {
  url: `http://localhost:${config.port}`,
  healthCheckUrl: `http://localhost:${config.port}/api/v1/health`,
  docsUrl: `http://localhost:${config.port}/docs`,
  openApiSpecUrl: `http://localhost:${config.port}/openapi.json`,
})