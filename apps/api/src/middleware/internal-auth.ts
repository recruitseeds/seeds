import type { Context, Next } from 'hono'

export interface InternalAuthContext {
  Variables: {
    correlationId: string
    requestId: string
    userId: string
    permissions: string[]
    role: 'admin' | 'developer' | 'analyst' | 'viewer'
  }
}

export const internalAuth = () => {
  return async (c: Context<InternalAuthContext>, next: Next) => {
    const authHeader = c.req.header('Authorization')
    const token = authHeader?.replace('Bearer ', '') || authHeader?.replace('Internal ', '')

    if (!token) {
      return c.json(
        {
          success: false,
          error: {
            code: 'MISSING_INTERNAL_TOKEN',
            message: "Internal token required. Include 'Authorization: Internal <token>' header",
          },
          correlationId: c.get('correlationId'),
        },
        401
      )
    }

    try {
      const internalSecret = process.env.INTERNAL_API_SECRET
      
      if (!internalSecret) {
        return c.json(
          {
            success: false,
            error: {
              code: 'INTERNAL_AUTH_NOT_CONFIGURED',
              message: 'Internal authentication not configured',
            },
            correlationId: c.get('correlationId'),
          },
          500
        )
      }

      if (token === internalSecret) {
        c.set('userId', 'system')
        c.set('permissions', ['*'])
        c.set('role', 'admin')
        return next()
      }

      if (token.startsWith('jwt.')) {
        const jwtToken = token.replace('jwt.', '')
        const decoded = await verifyJWT(jwtToken)
        
        c.set('userId', decoded.sub)
        c.set('permissions', decoded.permissions || [])
        c.set('role', decoded.role || 'viewer')
        return next()
      }

      return c.json(
        {
          success: false,
          error: {
            code: 'INVALID_INTERNAL_TOKEN',
            message: 'Invalid internal authentication token',
          },
          correlationId: c.get('correlationId'),
        },
        401
      )
    } catch (error) {
      return c.json(
        {
          success: false,
          error: {
            code: 'INTERNAL_AUTH_ERROR',
            message: 'Internal authentication failed',
          },
          correlationId: c.get('correlationId'),
        },
        500
      )
    }
  }
}

async function verifyJWT(token: string): Promise<{
  sub: string
  permissions: string[]
  role: 'admin' | 'developer' | 'analyst' | 'viewer'
}> {
  const jwtSecret = process.env.JWT_SECRET
  if (!jwtSecret) {
    throw new Error('JWT_SECRET not configured')
  }

  try {
    const parts = token.split('.')
    if (parts.length !== 3) {
      throw new Error('Invalid JWT format')
    }

    const payload = JSON.parse(atob(parts[1]))
    
    if (payload.exp && payload.exp < Date.now() / 1000) {
      throw new Error('Token expired')
    }

    return {
      sub: payload.sub || 'unknown',
      permissions: payload.permissions || [],
      role: payload.role || 'viewer',
    }
  } catch (error) {
    throw new Error('Invalid JWT token')
  }
}