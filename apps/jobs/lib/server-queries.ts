import { dehydrate, QueryClient } from '@tanstack/react-query'
import { getServerQueryClient } from './query-client'
import { prefetchJobs, prefetchJob } from './queries'
import { queryKeys } from './query-keys'
import { getAllJobs, getJobById } from './api'

/**
 * Server-Side Query Utilities
 * 
 * These functions are designed to be used in Server Components,
 * getServerSideProps, or other server-side contexts to prefetch
 * data and prepare it for hydration on the client.
 */

/**
 * Creates a server query client and prefetches jobs data
 * Returns dehydrated state for client-side hydration
 */
export async function getJobsServerSide(
  page: number = 1,
  limit: number = 20,
  filters: Record<string, any> = {}
) {
  const queryClient = getServerQueryClient()
  
  try {
    // Prefetch the jobs data
    await prefetchJobs(queryClient, page, limit, filters)
    
    // Return both the raw data and dehydrated state for hydration
    const dehydratedState = dehydrate(queryClient)
    
    // Also get the data directly for immediate server-side rendering
    const jobsData = await getAllJobs(page, limit, filters)
    
    return {
      dehydratedState,
      data: jobsData,
    }
  } catch (error) {
    console.error('Failed to prefetch jobs:', error)
    
    // Return fallback data structure
    return {
      dehydratedState: dehydrate(queryClient),
      data: {
        success: false as const,
        data: [],
        pagination: {
          page,
          limit,
          total: 0,
          totalPages: 0,
          hasNext: false,
          hasPrev: false,
        },
        error: error instanceof Error ? error.message : 'Failed to load jobs',
      },
    }
  }
}

/**
 * Creates a server query client and prefetches job detail data
 */
export async function getJobServerSide(jobId: string) {
  const queryClient = getServerQueryClient()
  
  try {
    // Prefetch the job detail data
    await prefetchJob(queryClient, jobId)
    
    // Return both the raw data and dehydrated state for hydration
    const dehydratedState = dehydrate(queryClient)
    
    // Also get the data directly for immediate server-side rendering
    const jobData = await getJobById(jobId)
    
    return {
      dehydratedState,
      data: jobData,
    }
  } catch (error) {
    console.error(`Failed to prefetch job ${jobId}:`, error)
    throw error // Let the calling component handle the error (404, etc.)
  }
}

/**
 * Prefetch multiple pieces of data for a complex page
 * Example: Job detail page that also shows related jobs
 */
export async function getJobWithRelatedDataServerSide(
  jobId: string,
  options: {
    prefetchRelatedJobs?: boolean
    relatedJobsLimit?: number
  } = {}
) {
  const queryClient = getServerQueryClient()
  const { prefetchRelatedJobs = false, relatedJobsLimit = 5 } = options
  
  try {
    // Prefetch main job data
    await prefetchJob(queryClient, jobId)
    
    if (prefetchRelatedJobs) {
      // Prefetch related jobs (you could implement logic to find related jobs)
      await prefetchJobs(queryClient, 1, relatedJobsLimit, { exclude: jobId })
    }
    
    const dehydratedState = dehydrate(queryClient)
    const jobData = await getJobById(jobId)
    
    return {
      dehydratedState,
      data: jobData,
    }
  } catch (error) {
    console.error(`Failed to prefetch job with related data ${jobId}:`, error)
    throw error
  }
}

/**
 * Search page server-side data fetching
 */
export async function getSearchResultsServerSide(
  query: string,
  location?: string,
  filters: Record<string, any> = {},
  page: number = 1,
  limit: number = 20
) {
  const queryClient = getServerQueryClient()
  
  try {
    const searchFilters = {
      ...filters,
      query: query || undefined,
      location: location || undefined,
    }
    
    // Prefetch search results
    await queryClient.prefetchQuery({
      queryKey: queryKeys.search.jobs(query, { location, ...filters, page, limit }),
      queryFn: () => getAllJobs(page, limit, searchFilters),
      staleTime: 2 * 60 * 1000, // 2 minutes for search results
    })
    
    const dehydratedState = dehydrate(queryClient)
    const searchData = await getAllJobs(page, limit, searchFilters)
    
    return {
      dehydratedState,
      data: searchData,
      searchParams: { query, location, filters, page, limit },
    }
  } catch (error) {
    console.error('Failed to prefetch search results:', error)
    
    return {
      dehydratedState: dehydrate(queryClient),
      data: {
        success: false as const,
        data: [],
        pagination: {
          page,
          limit,
          total: 0,
          totalPages: 0,
          hasNext: false,
          hasPrev: false,
        },
        error: error instanceof Error ? error.message : 'Failed to load search results',
      },
      searchParams: { query, location, filters, page, limit },
    }
  }
}

/**
 * Utility to create a fresh server query client for isolated operations
 */
export function createServerQueryClient() {
  return getServerQueryClient()
}

/**
 * Helper to invalidate specific cache entries on the server
 * Useful for revalidation scenarios
 */
export async function invalidateServerQueries(queryClient: QueryClient, keys: string[][]) {
  for (const key of keys) {
    await queryClient.invalidateQueries({ queryKey: key })
  }
}

/**
 * Batch prefetch utility for complex pages that need multiple data sources
 */
export async function batchPrefetch(
  operations: Array<{
    queryKey: any[]
    queryFn: () => Promise<any>
    staleTime?: number
  }>
) {
  const queryClient = getServerQueryClient()
  
  await Promise.allSettled(
    operations.map(({ queryKey, queryFn, staleTime = 5 * 60 * 1000 }) =>
      queryClient.prefetchQuery({
        queryKey,
        queryFn,
        staleTime,
      })
    )
  )
  
  return dehydrate(queryClient)
}