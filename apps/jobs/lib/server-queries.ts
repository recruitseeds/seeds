import { dehydrate, QueryClient } from '@tanstack/react-query'
import { getServerQueryClient } from './query-client'
import { prefetchJobs, prefetchJob } from './queries'
import { queryKeys } from './query-keys'
import { getAllJobs, getJobById, checkSavedJob } from './api'
import { createClient } from './supabase/server'

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
  filters: Record<string, any> = {},
  userEmail?: string
) {
  const queryClient = getServerQueryClient()

  try {
    // Get user email for server-side data fetching if not provided
    let email = userEmail
    if (!email) {
      try {
        const supabase = await createClient()
        const { data: { session } } = await supabase.auth.getSession()
        email = session?.user?.email
      } catch (error) {
        console.warn('Failed to get user session for jobs prefetch:', error)
      }
    }

    // Prefetch the jobs data with user email
    await prefetchJobs(queryClient, page, limit, filters, email)

    // Also get the data directly for immediate server-side rendering
    const jobsData = await getAllJobs(page, limit, filters, email)

    // Note: Saved job statuses are now included in the job data itself, no need for separate prefetch

    // Return both the raw data and dehydrated state for hydration
    const dehydratedState = dehydrate(queryClient)

    return {
      dehydratedState,
      data: jobsData,
      userEmail: email, // Return the email so client knows what was used
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
      userEmail: email,
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
  limit: number = 20,
  userEmail?: string
) {
  const queryClient = getServerQueryClient()

  try {
    const searchFilters = {
      ...filters,
      query: query || undefined,
      location: location || undefined,
    }

    // Get user email for search results if not provided
    let email = userEmail
    if (!email) {
      try {
        const supabase = await createClient()
        const { data: { session } } = await supabase.auth.getSession()
        email = session?.user?.email
      } catch (error) {
        console.warn('Failed to get user session for search results:', error)
      }
    }

    // Prefetch search results with user email
    await queryClient.prefetchQuery({
      queryKey: queryKeys.search.jobs(query, { location, ...filters, page, limit, userEmail: email }),
      queryFn: () => getAllJobs(page, limit, searchFilters, email),
      staleTime: 2 * 60 * 1000, // 2 minutes for search results
    })

    const searchData = await getAllJobs(page, limit, searchFilters, email)

    // Note: Saved job statuses are now included in the job data itself, no need for separate prefetch

    const dehydratedState = dehydrate(queryClient)

    return {
      dehydratedState,
      data: searchData,
      searchParams: { query, location, filters, page, limit },
      userEmail: email, // Return the email so client knows what was used
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
      userEmail: email,
    }
  }
}

/**
 * Prefetch saved job statuses for authenticated users
 */
async function prefetchSavedJobStatuses(
  queryClient: QueryClient,
  jobIds: string[],
  userEmail: string
) {
  try {
    // Prefetch saved job status for each job
    await Promise.all(
      jobIds.map(jobId =>
        queryClient.prefetchQuery({
          queryKey: queryKeys.savedJobs.check(jobId, userEmail),
          queryFn: () => checkSavedJob(jobId, userEmail),
          staleTime: 30 * 1000, // 30 seconds
        })
      )
    )
  } catch (error) {
    console.warn('Failed to prefetch saved job statuses:', error)
    // Don't throw - this is optional enhancement
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