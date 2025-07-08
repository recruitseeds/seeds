import { createClient } from '@/supabase/client/server'
import { TRPCError, initTRPC } from '@trpc/server'
import { cache } from 'react'
import superjson from 'superjson'

interface UserMetadata {
  role?: 'candidate' | 'organization'
  organization_id?: string
}

export const createTRPCContext = cache(async () => {
  const supabase = await createClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()

  let userRole: UserMetadata['role'] | undefined = undefined
  let organizationId: string | undefined = undefined

  if (session?.user?.user_metadata) {
    const metadata = session.user.user_metadata as UserMetadata
    userRole = metadata.role

    if (userRole === 'organization') {
      organizationId = metadata.organization_id

      // Option 2: Query a table linking users to organizations
      // This is generally more robust if a user could potentially be linked
      // to organizations in more complex ways or if you have a dedicated profiles table.
      // if (session.user.id && !organizationId) { // Check if not already found
      //   const { data: profileData } = await supabase
      //     .from('user_profiles') // or 'organization_users', etc.
      //     .select('organization_id')
      //     .eq('user_id', session.user.id)
      //     .single();
      //   if (profileData) {
      //     organizationId = profileData.organization_id;
      //   }
      // }
    }
  }

  return {
    session,
    user: session?.user,
    userRole,
    organizationId,
    supabase,
  }
})

const t = initTRPC.context<Awaited<ReturnType<typeof createTRPCContext>>>().create({
  transformer: superjson,
  errorFormatter({ shape }) {
    return shape
  },
})

export const createTRPCRouter = t.router
export const createCallerFactory = t.createCallerFactory

export const protectedProcedure = t.procedure.use(async (opts) => {
  const { session, user } = opts.ctx

  if (!session || !user) {
    throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Not authenticated' })
  }

  return opts.next({
    ctx: {
      ...opts.ctx,
      session: session,
      user: user,
    },
  })
})

export const candidateProcedure = protectedProcedure.use(async (opts) => {
  const { userRole } = opts.ctx

  if (userRole !== 'candidate') {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'Access restricted to candidates.',
    })
  }
  return opts.next(opts)
})

export const organizationProcedure = protectedProcedure.use(async (opts) => {
  const { userRole, organizationId, user } = opts.ctx

  if (userRole !== 'organization') {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'Access restricted to organization representatives.',
    })
  }

  if (!organizationId) {
    throw new TRPCError({
      code: 'PRECONDITION_FAILED',
      message: 'Organization information is not fully set up for this account.',
    })
  }

  return opts.next({
    ctx: {
      ...opts.ctx,
      organizationId,
    },
  })
})
