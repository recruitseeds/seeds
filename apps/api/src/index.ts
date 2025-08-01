import { NodeRuntime } from '@effect/platform-node'
import { serve } from '@hono/node-server'
import 'dotenv/config'
import { Effect, Layer, pipe } from 'effect'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'

import { addSwaggerUI, createOpenAPIApp } from './lib/openapi.js'
import { correlationMiddleware } from './middleware/correlation.js'
import { errorHandler } from './middleware/error-handler.js'
import { v1Routes } from './routes/v1/index.js'
import { ConfigServiceLive } from './services/config.js'
import { LoggerService, LoggerServiceLive } from './services/logger.js'
import { PostHogServiceLive } from './services/posthog.js'
import { SentryServiceLive } from './services/sentry.js'

const app = createOpenAPIApp()

app.use('*', errorHandler())
app.use('*', correlationMiddleware())
app.use('*', cors())
app.use('*', logger())

app.get('/health', (c) =>
  c.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    message: 'Use /api/v1/health for versioned health check',
  })
)

app.route('/api/v1', v1Routes)

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

const port = process.env.PORT ? Number.parseInt(process.env.PORT) : 3001

const program = Effect.gen(function* () {
  const logger = yield* LoggerService
  yield* logger.info('Starting API server', {
    port,
    environment: process.env.NODE_ENV || 'development',
    apiVersion: 'v1',
  })

  serve({
    fetch: app.fetch,
    port,
  })

  yield* logger.info('🚀 API server running', {
    url: `http://localhost:${port}`,
    healthCheckUrl: `http://localhost:${port}/api/v1/health`,
    docsUrl: `http://localhost:${port}/docs`,
    openApiSpecUrl: `http://localhost:${port}/openapi.json`,
  })
})

const MainLayer = Layer.provide(
  LoggerServiceLive,
  Layer.mergeAll(
    ConfigServiceLive,
    Layer.provide(SentryServiceLive, ConfigServiceLive),
    Layer.provide(PostHogServiceLive, ConfigServiceLive)
  )
)

pipe(program, Effect.provide(MainLayer), NodeRuntime.runMain)
