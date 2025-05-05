// src/actions/safe-action.ts
import { createClient } from '@/supabase/client/server' // Corrected path assuming server client
// Removed getCandidateProfile import here - it's not needed for auth middleware
import { logger } from '@/lib/logger' // Adjust path as needed
import {
  DEFAULT_SERVER_ERROR_MESSAGE,
  createSafeActionClient,
} from 'next-safe-action'
import { z } from 'zod'
// import { headers } from "next/headers"; // Uncomment if using ratelimiting with IP
// import { Ratelimit } from "@upstash/ratelimit"; // Optional: Add if using Upstash
// import { client as RedisClient } from "@/lib/redis"; // Optional: Add if using Upstash/Redis

// Optional: Setup ratelimiting if needed
// const ratelimit = new Ratelimit({
//   limiter: Ratelimit.fixedWindow(10, "10s"),
//   redis: RedisClient,
// });

// Basic client without auth, useful for public actions
export const actionClient = createSafeActionClient({
  // Default error handler
  handleServerError(e) {
    if (e instanceof Error) {
      return e.message
    }
    return DEFAULT_SERVER_ERROR_MESSAGE
  },
})

// Client with metadata support (e.g., action name)
export const actionClientWithMeta = createSafeActionClient({
  handleServerError(e) {
    if (e instanceof Error) {
      return e.message
    }
    return DEFAULT_SERVER_ERROR_MESSAGE
  },
  // Define metadata schema - useful for logging/debugging
  defineMetadataSchema() {
    return z.object({
      name: z.string(),
    })
  },
})

// Authenticated action client
export const authActionClient = actionClientWithMeta
  // Middleware for logging input/output in development
  .use(async ({ next, clientInput, metadata }) => {
    const result = await next({ ctx: undefined }) // Pass undefined instead of null

    if (process.env.NODE_ENV === 'development') {
      logger(`Action: ${metadata?.name ?? 'Unknown'}`)
      logger('Input ->', clientInput)
      logger('Result ->', result)
    }

    return result
  })
  // Optional: Middleware for ratelimiting
  // .use(async ({ next, metadata }) => {
  //   if (!metadata?.name) {
  //     // Cannot ratelimit without a name
  //     return next({ ctx: null });
  //   }
  //   const ip = headers().get("x-forwarded-for");
  //   const { success, remaining } = await ratelimit.limit(
  //     `ratelimit_${ip}_${metadata.name}`
  //   );
  //   if (!success) {
  //     throw new Error("Too many requests.");
  //   }
  //   // Pass remaining count down if needed
  //   return next({ ctx: { ratelimitRemaining: remaining } });
  // })
  // Middleware for authentication and adding context
  .use(async ({ next }) => {
    // Create the Supabase server client instance for this request
    const supabase = await createClient() // Await the client creation

    // Get the currently authenticated user from Supabase Auth
    const {
      data: { user }, // Destructure the user object from the data property
      error: userError,
    } = await supabase.auth.getUser() // Correctly call the Supabase Auth method

    // Handle cases where the user is not found or there's an error
    if (userError || !user) {
      console.error('Auth Error in safe-action middleware:', userError)
      throw new Error('Unauthorized: User not authenticated.')
    }

    // Pass the Supabase client and the authenticated user object down to the action context
    return next({
      ctx: {
        supabase,
        user, // Pass the authenticated user object from supabase.auth.getUser()
      },
    })
  })
