import { candidatesRoutes } from './candidates.js'
import { createOpenAPIApp, healthRoute } from '../../lib/openapi.js'

const v1Routes = createOpenAPIApp()

v1Routes.use('*', async (c, next) => {
  await next()
  c.header('API-Version', 'v1')
  c.header('Supported-Versions', 'v1')
})

// Health check route with OpenAPI spec
v1Routes.openapi(healthRoute, (c) => {
  return c.json({
    status: 'ok' as const,
    version: 'v1',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
  })
})

v1Routes.route('/candidates', candidatesRoutes)

export { v1Routes }
