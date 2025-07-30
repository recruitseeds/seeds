import 'server-only'

import { HydrationBoundary, dehydrate } from '@tanstack/react-query'
import { createTRPCClient, httpBatchLink, loggerLink } from '@trpc/client'
import { createTRPCOptionsProxy } from '@trpc/tanstack-react-query'
import { cache } from 'react'
import superjson from 'superjson'
import { createCallerFactory, createTRPCContext as createContext } from './init'
import { makeQueryClient } from './query-client'
import { type AppRouter, appRouter } from './routers/_app'

export const getQueryClient = cache(makeQueryClient)

export const trpc = createTRPCOptionsProxy<AppRouter>({
  queryClient: getQueryClient,
  client: createTRPCClient<AppRouter>({
    links: [
      httpBatchLink({
        url: 'http://localhost:3000/api/trpc',
        transformer: superjson,
        async headers() {
          // Add any headers you need
          return {}
        },
      }),
      loggerLink({
        enabled: (opts) =>
          process.env.NODE_ENV === 'development' || (opts.direction === 'down' && opts.result instanceof Error),
      }),
    ],
  }),
})

const callerFactory = createCallerFactory(appRouter)

export async function getServerTRPCCaller() {
  const context = await createContext()
  return callerFactory(context)
}

export function HydrateClient(props: { children: React.ReactNode }) {
  const queryClient = getQueryClient()
  return <HydrationBoundary state={dehydrate(queryClient)}>{props.children}</HydrationBoundary>
}

export function prefetch(queryOptions: unknown) {
  const queryClient = getQueryClient()

  if ((queryOptions as { queryKey: [string, { type?: string }] }).queryKey[1]?.type === 'infinite') {
    void queryClient.prefetchInfiniteQuery(queryOptions as Parameters<typeof queryClient.prefetchInfiniteQuery>[0])
  } else {
    void queryClient.prefetchQuery(queryOptions as Parameters<typeof queryClient.prefetchQuery>[0])
  }
}

export function batchPrefetch(queryOptionsArray: unknown[]) {
  const queryClient = getQueryClient()

  for (const queryOptions of queryOptionsArray) {
    if ((queryOptions as { queryKey: [string, { type?: string }] }).queryKey[1]?.type === 'infinite') {
      void queryClient.prefetchInfiniteQuery(queryOptions as Parameters<typeof queryClient.prefetchInfiniteQuery>[0])
    } else {
      void queryClient.prefetchQuery(queryOptions as Parameters<typeof queryClient.prefetchQuery>[0])
    }
  }
}
