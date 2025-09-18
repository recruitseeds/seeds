'use client'

import type { QueryClient } from '@tanstack/react-query'
import { isServer, QueryClientProvider } from '@tanstack/react-query'

import { createTRPCClient, httpBatchLink, loggerLink } from '@trpc/client'
import { createTRPCContext } from '@trpc/tanstack-react-query'
import { useState } from 'react'
import superjson from 'superjson'
import { makeQueryClient } from './query-client'
import type { AppRouter } from './routers/_app'

export const { TRPCProvider, useTRPC } = createTRPCContext<AppRouter>()

let browserQueryClient: QueryClient | undefined

function getQueryClient() {
  if (isServer) {
    return makeQueryClient()
  }
  if (!browserQueryClient) browserQueryClient = makeQueryClient()
  return browserQueryClient
}

export function TRPCReactProvider(
  props: Readonly<{
    children: React.ReactNode
  }>
) {
  const queryClient = getQueryClient()
  const [trpcClient] = useState(() =>
    createTRPCClient<AppRouter>({
      links: [
        loggerLink({
          enabled: (opts) =>
            process.env.NODE_ENV === 'development' || (opts.direction === 'down' && opts.result instanceof Error),
        }),
        httpBatchLink({
          url: `http://localhost:3000/api/trpc`,
          transformer: superjson,
        }),
      ],
    })
  )

  return (
    <QueryClientProvider client={queryClient}>
      <TRPCProvider trpcClient={trpcClient} queryClient={queryClient}>
        {props.children}
      </TRPCProvider>
      {/* <ReactQueryDevtools initialIsOpen={false} /> */}
    </QueryClientProvider>
  )
}
