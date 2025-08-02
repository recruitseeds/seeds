import type { Context, Next } from 'hono'

export interface AuthContext {
  Variables: {
    correlationId: string
    requestId: string
    apiKeyOwner?: string
    apiKeyMeta?: Record<string, unknown>
  }
}

export const apiKeyAuth = () => {
  return async (c: Context<AuthContext>, next: Next) => {
    if (c.req.path === '/health' || c.req.path.startsWith('/internal') || c.req.path.startsWith('/test')) {
      return next()
    }

    const authHeader = c.req.header('Authorization')
    const apiKey = authHeader?.replace('Bearer ', '')

    if (!apiKey) {
      return c.json(
        {
          success: false,
          error: {
            code: 'MISSING_API_KEY',
            message: "API key required. Include 'Authorization: Bearer <your-api-key>' header",
          },
          correlationId: c.get('correlationId'),
        },
        401
      )
    }

    try {
      const unkeyApiKey = process.env.UNKEY_API_KEY
      const unkeyAppId = process.env.UNKEY_APP_ID

      if (!unkeyApiKey || !unkeyAppId) {
        return c.json(
          {
            success: false,
            error: {
              code: 'AUTH_NOT_CONFIGURED',
              message: 'Authentication service not configured',
            },
            correlationId: c.get('correlationId'),
          },
          500
        )
      }

      const response = await fetch('https://api.unkey.dev/v1/keys.verifyKey', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${unkeyApiKey}`,
        },
        body: JSON.stringify({
          apiId: unkeyAppId,
          key: apiKey,
        }),
      })

      if (!response.ok) {
        return c.json(
          {
            success: false,
            error: {
              code: 'AUTH_SERVICE_ERROR',
              message: 'Authentication service unavailable',
            },
            correlationId: c.get('correlationId'),
          },
          500
        )
      }

      const result = await response.json() as {
        valid: boolean
        code?: string
        message?: string
        ownerId?: string
        meta?: Record<string, unknown>
      }

      if (!result.valid) {
        return c.json(
          {
            success: false,
            error: {
              code: result.code || 'INVALID_API_KEY',
              message: result.message || 'Invalid API key',
            },
            correlationId: c.get('correlationId'),
          },
          401
        )
      }

      c.set('apiKeyOwner', result.ownerId || 'unknown')
      c.set('apiKeyMeta', result.meta || { tier: 'free' })
      return next()
    } catch (error) {
      return c.json(
        {
          success: false,
          error: {
            code: 'AUTH_ERROR',
            message: 'Authentication service error',
          },
          correlationId: c.get('correlationId'),
        },
        500
      )
    }
  }
}
