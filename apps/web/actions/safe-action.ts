import { logger } from '@/lib/logger'
import { createClient } from '@seeds/supabase/client/server'
import type { Database } from '@seeds/supabase/types/db'
import type { SupabaseClient, User } from '@supabase/supabase-js'
import {
  DEFAULT_SERVER_ERROR_MESSAGE,
  createSafeActionClient,
} from 'next-safe-action'
import { z } from 'zod'

export interface ActionContext {
  user: User
  supabase: SupabaseClient<Database>
  originalClientInput?: unknown
}

export const actionClient = createSafeActionClient({
  handleServerError(e) {
    if (e instanceof Error) {
      return e.message
    }
    return DEFAULT_SERVER_ERROR_MESSAGE
  },
})

export const actionClientWithMeta = createSafeActionClient({
  handleServerError(e) {
    if (e instanceof Error) {
      return e.message
    }
    return DEFAULT_SERVER_ERROR_MESSAGE
  },
  defineMetadataSchema() {
    return z.object({
      name: z.string(),
    })
  },
})

export const authActionClient = actionClientWithMeta
  .use(async ({ next, clientInput, metadata }) => {
    const result = await next({
      ctx: { originalClientInput: clientInput } as Partial<ActionContext>,
    })

    if (process.env.NODE_ENV === 'development') {
      logger(`Action: ${metadata?.name ?? 'Unknown'}`)
      logger('Input ->', clientInput)
      logger('Result ->', result)
    }
    return result
  })
  .use(async ({ next, ctx: prevCtx }) => {
    const supabase = await createClient()
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      console.error('Auth Error in safe-action middleware:', userError)
      throw new Error('Unauthorized: User not authenticated.')
    }

    return next({
      ctx: {
        ...(prevCtx as object),
        supabase,
        user,
      } as ActionContext,
    })
  })
