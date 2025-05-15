// @/trpc/server.tsx
import 'server-only'

import { HydrationBoundary, dehydrate } from '@tanstack/react-query'
import {
  createTRPCOptionsProxy,
  type TRPCQueryOptions,
} from '@trpc/tanstack-react-query'
import { cache } from 'react'

import { createCallerFactory, createTRPCContext as createContext } from './init'
import { makeQueryClient } from './query-client'
import { appRouter, type AppRouter } from './routers/_app'

export const getQueryClient = cache(makeQueryClient)

export const trpc = createTRPCOptionsProxy<AppRouter>({
  ctx: createContext,
  router: appRouter,
  queryClient: getQueryClient,
})

const callerFactory = createCallerFactory(appRouter)

export async function getServerTRPCCaller() {
  const context = await createContext()
  return callerFactory(context)
}

export function HydrateClient(props: { children: React.ReactNode }) {
  const queryClient = getQueryClient()
  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      {props.children}
    </HydrationBoundary>
  )
}

export async function prefetch<T extends ReturnType<TRPCQueryOptions<any>>>(
  queryOptions: T
) {
  const queryClient = getQueryClient()
  if (queryOptions.queryKey[1]?.type === 'infinite') {
    void queryClient.prefetchInfiniteQuery(queryOptions as any)
  } else {
    void queryClient.prefetchQuery(queryOptions)
  }
}

export async function batchPrefetch<
  T extends ReturnType<TRPCQueryOptions<any>>
>(optionsArray: T[]) {
  const queryClient = getQueryClient()
  for (const queryOptions of optionsArray) {
    if (queryOptions.queryKey[1]?.type === 'infinite') {
      void queryClient.prefetchInfiniteQuery(queryOptions as any)
    } else {
      void queryClient.prefetchQuery(queryOptions)
    }
  }
}
