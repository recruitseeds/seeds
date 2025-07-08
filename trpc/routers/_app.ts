import type { inferRouterInputs, inferRouterOutputs } from '@trpc/server'
import { createTRPCRouter } from '../init'
import { candidateRouter } from './candidate'
import { organizationRouter } from './organization'

export const appRouter = createTRPCRouter({
  candidate: candidateRouter,
  organization: organizationRouter,
})

export type AppRouter = typeof appRouter
export type RouterOutputs = inferRouterOutputs<AppRouter>
export type RouterInputs = inferRouterInputs<AppRouter>
