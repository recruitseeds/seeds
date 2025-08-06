import { QueryClient, defaultShouldDehydrateQuery } from '@tanstack/react-query'
import superjson from 'superjson'

export function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // SSR: Data is considered fresh for 30 seconds
        staleTime: 30 * 1000,
        // Cache data for 5 minutes
        gcTime: 5 * 60 * 1000,
        // Retry failed requests twice
        retry: 2,
        // Refetch on window focus in development only
        refetchOnWindowFocus: process.env.NODE_ENV === 'development',
        // Don't refetch on reconnect by default
        refetchOnReconnect: false,
      },
      mutations: {
        // Retry mutations once on failure
        retry: 1,
      },
      dehydrate: {
        // Use superjson for serialization (handles dates, etc.)
        serializeData: superjson.serialize,
        // Dehydrate pending queries for SSR
        shouldDehydrateQuery: (query) =>
          defaultShouldDehydrateQuery(query) ||
          query.state.status === 'pending',
      },
      hydrate: {
        // Use superjson for deserialization
        deserializeData: superjson.deserialize,
      },
    },
  })
}

// Global query client instance for server-side operations
let serverQueryClient: QueryClient | undefined

export function getServerQueryClient() {
  if (!serverQueryClient) {
    serverQueryClient = makeQueryClient()
  }
  return serverQueryClient
}

// Browser query client instance (singleton)
let browserQueryClient: QueryClient | undefined

export function getBrowserQueryClient() {
  if (typeof window === 'undefined') {
    // Always create a new query client on the server
    return makeQueryClient()
  }
  
  // Create the query client once in the browser
  if (!browserQueryClient) {
    browserQueryClient = makeQueryClient()
  }
  
  return browserQueryClient
}