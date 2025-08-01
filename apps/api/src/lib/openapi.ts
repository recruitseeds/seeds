import { swaggerUI } from '@hono/swagger-ui'
import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi'

export const createOpenAPIApp = () => {
  return new OpenAPIHono<{
    Variables: {
      correlationId: string
      requestId: string
    }
  }>()
}

export const ErrorResponseSchema = z.object({
  success: z.literal(false),
  error: z.object({
    code: z.string(),
    message: z.string(),
    details: z.union([z.string(), z.record(z.unknown())]).optional(),
  }),
  timestamp: z.string(),
  correlationId: z.string().optional(),
})

export const MetadataSchema = z.object({
  processingTimeMs: z.number(),
  correlationId: z.string(),
  timestamp: z.string(),
})

export const HealthResponseSchema = z.object({
  status: z.literal('ok'),
  version: z.string(),
  timestamp: z.string(),
  uptime: z.number(),
  environment: z.string(),
})

export const addSwaggerUI = (
  app: OpenAPIHono<{
    Variables: {
      correlationId: string
      requestId: string
    }
  }>
) => {
  app.doc('/openapi.json', {
    openapi: '3.0.0',
    info: {
      version: '1.0.0',
      title: 'Recruit Seeds API',
      description: 'AI-powered resume parsing and skill matching API for recruitment platforms',
      contact: {
        name: 'API Support',
        url: 'https://github.com/seeds/seeds',
      },
    },
    servers: [
      {
        url: 'http://localhost:3001',
        description: 'Development server',
      },
      {
        url: 'https://api.recruitseeds.com',
        description: 'Production server',
      },
    ],
    tags: [
      {
        name: 'Health',
        description: 'Health check endpoints',
      },
      {
        name: 'Candidates',
        description: 'Candidate management and resume processing',
      },
      {
        name: 'Jobs',
        description: 'Job posting and requirements management',
      },
    ],
  })

  app.get('/docs', swaggerUI({ url: '/openapi.json' }))

  return app
}

export const healthRoute = createRoute({
  method: 'get',
  path: '/health',
  tags: ['Health'],
  summary: 'Health check',
  description: 'Returns the current health status of the API',
  responses: {
    200: {
      content: {
        'application/json': {
          schema: HealthResponseSchema,
        },
      },
      description: 'Health status',
    },
  },
})
