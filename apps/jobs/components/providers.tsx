'use client'

import { QueryClient, QueryClientProvider, HydrationBoundary } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { useState, type ReactNode } from 'react'
import { getBrowserQueryClient } from '../lib/query-client'

interface ProvidersProps {
  children: ReactNode
  dehydratedState?: unknown
}

/**
 * React Query Provider Component
 * 
 * This component provides React Query functionality to the entire app.
 * It handles:
 * - Query client creation and management
 * - SSR hydration from server-prefetched data
 * - Development tools in development mode
 * - Proper server/client query client separation
 */
export function Providers({ children, dehydratedState }: ProvidersProps) {
  // Create a stable query client instance for the browser
  // This ensures the same client is used across re-renders
  const [queryClient] = useState(() => getBrowserQueryClient())

  return (
    <QueryClientProvider client={queryClient}>
      {/* 
        HydrationBoundary handles SSR data hydration
        When dehydratedState is provided, it will hydrate the cache
        with server-prefetched data
      */}
      <HydrationBoundary state={dehydratedState}>
        {children}
      </HydrationBoundary>
      
      {/* Development tools - only in development mode */}
      {process.env.NODE_ENV === 'development' && (
        <ReactQueryDevtools 
          initialIsOpen={false}
          buttonPosition="bottom-left"
          position="left"
        />
      )}
    </QueryClientProvider>
  )
}

/**
 * Server-Side Rendering Provider
 * 
 * This is a simpler provider for server-side rendering contexts
 * where we don't need devtools or complex hydration logic
 */
interface ServerProvidersProps {
  children: ReactNode
  queryClient: QueryClient
}

export function ServerProviders({ children, queryClient }: ServerProvidersProps) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )
}

/**
 * Provider Hook for accessing the current environment
 * 
 * This can be useful for components that need to behave differently
 * based on whether they're in a server or client context
 */
export function useProviderContext() {
  const isServer = typeof window === 'undefined'
  const isDevelopment = process.env.NODE_ENV === 'development'
  const isProduction = process.env.NODE_ENV === 'production'
  
  return {
    isServer,
    isClient: !isServer,
    isDevelopment,
    isProduction,
  }
}

/**
 * Error Boundary for Query Errors
 * 
 * This component can be used to catch and handle React Query errors
 * at a higher level in the component tree
 */
interface QueryErrorBoundaryProps {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: any) => void
}

export function QueryErrorBoundary({ 
  children, 
  fallback = <div>Something went wrong with data loading.</div>,
  onError 
}: QueryErrorBoundaryProps) {
  // In a real implementation, you'd use React Error Boundary
  // For now, this is a placeholder structure
  return <>{children}</>
}