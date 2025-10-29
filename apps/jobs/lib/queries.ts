import { useQuery, useMutation, useQueryClient, type UseQueryOptions, type UseMutationOptions } from '@tanstack/react-query'
import { getAllJobs, getJobById, checkExistingApplication, saveJob, unsaveJob, checkSavedJob, submitJobApplication, type JobPosting, type JobDetailResponse, type JobListResponse, type ApplicationCheckResponse, type ApplicationRequest, type ApplicationResponse, type SavedJobResponse } from './api'
import { queryKeys, queryInvalidation } from './query-keys'

/**
 * Query Options Type Helpers
 * Makes it easier to create properly typed query options
 */
type JobListQueryOptions = UseQueryOptions<JobListResponse, Error, JobListResponse, ReturnType<typeof queryKeys.jobs.list>>
type JobDetailQueryOptions = UseQueryOptions<JobDetailResponse, Error, JobDetailResponse, ReturnType<typeof queryKeys.jobs.detail>>
type ApplicationCheckQueryOptions = UseQueryOptions<ApplicationCheckResponse, Error, ApplicationCheckResponse, ReturnType<typeof queryKeys.applications.check>>

/**
 * ================================
 * JOB QUERIES
 * ================================
 */

/**
 * Fetch paginated list of jobs with optional filters
 */
export function useJobs(
  page: number = 1,
  limit: number = 20,
  filters: Record<string, any> = {},
  userEmail?: string,
  options?: Partial<JobListQueryOptions>
) {
  return useQuery({
    queryKey: queryKeys.jobs.list({ page, limit, ...filters, userEmail }),
    queryFn: () => getAllJobs(page, limit, filters, userEmail),
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
    ...options,
  })
}

/**
 * Fetch detailed information for a specific job
 */
export function useJob(jobId: string, options?: Partial<JobDetailQueryOptions>) {
  return useQuery({
    queryKey: queryKeys.jobs.detail(jobId),
    queryFn: () => getJobById(jobId),
    staleTime: 5 * 60 * 1000, // 5 minutes - job details don't change often
    gcTime: 10 * 60 * 1000, // 10 minutes
    enabled: !!jobId, // Only run if jobId is provided
    ...options,
  })
}

/**
 * Search jobs with filters - alias for useJobs with search-specific defaults
 */
export function useJobSearch(
  page: number = 1,
  limit: number = 20,
  filters: Record<string, any> = {},
  userEmail?: string,
  options?: Partial<JobListQueryOptions>
) {
  // Use jobs.list instead of search.jobs for better cache reuse
  const queryKey = queryKeys.jobs.list({ ...filters, page, limit, userEmail })

  return useQuery({
    queryKey,
    queryFn: () => getAllJobs(page, limit, filters, userEmail),
    staleTime: 5 * 60 * 1000, // 5 minutes - longer stale time to prevent unnecessary refetches
    gcTime: 10 * 60 * 1000, // 10 minutes - keep data longer in cache
    refetchOnMount: false, // Don't refetch on mount if we have cached data
    refetchOnWindowFocus: false, // Don't refetch on window focus
    refetchOnReconnect: false, // Don't refetch on network reconnect
    ...options,
  })
}

/**
 * Check if a user has already applied to a job
 */
export function useApplicationCheck(
  jobId: string,
  email: string,
  options?: Partial<ApplicationCheckQueryOptions>
) {
  return useQuery({
    queryKey: queryKeys.applications.check(jobId, email),
    queryFn: () => checkExistingApplication(jobId, email),
    enabled: !!(jobId && email), // Only run if both are provided
    staleTime: 30 * 1000, // 30 seconds - application status changes quickly
    gcTime: 2 * 60 * 1000, // 2 minutes
    ...options,
  })
}

/**
 * ================================
 * JOB MUTATIONS
 * ================================
 */

/**
 * Submit a job application
 */
export function useSubmitApplication(
  options?: UseMutationOptions<ApplicationResponse, Error, { jobId: string; data: ApplicationRequest }>
) {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ jobId, data }: { jobId: string; data: ApplicationRequest }) => {
      return submitJobApplication(jobId, data)
    },
    
    // Optimistic updates and cache invalidation
    onMutate: async ({ jobId, data }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.applications.check(jobId, data.candidateData.email) })
      
      // Optimistically update the application check
      queryClient.setQueryData(
        queryKeys.applications.check(jobId, data.candidateData.email),
        {
          success: true,
          data: {
            hasApplied: true,
            applicationId: 'pending',
            appliedAt: new Date().toISOString(),
          }
        }
      )
      
      // Return context for potential rollback
      return { jobId, email: data.candidateData.email }
    },
    
    onError: (error, variables, context) => {
      // Rollback optimistic update on error
      if (context) {
        queryClient.invalidateQueries({ 
          queryKey: queryKeys.applications.check(context.jobId, context.email) 
        })
      }
    },
    
    onSuccess: (data, { jobId, data: applicationData }) => {
      // Invalidate and refetch application check
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.applications.check(jobId, applicationData.candidateData.email) 
      })
      
      // Optionally invalidate job details to update application count
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.jobs.detail(jobId) 
      })
    },
    
    ...options,
  })
}

/**
 * ================================
 * SAVED JOBS QUERIES & MUTATIONS
 * ================================
 */

/**
 * Check if a job is saved by the current user
 */
export function useSavedJobCheck(
  jobId: string,
  userEmail?: string,
  options?: Partial<UseQueryOptions<{ success: true; data: { isSaved: boolean } }, Error>>
) {
  const email = userEmail || 'test@example.com' // Fallback for testing

  return useQuery({
    queryKey: queryKeys.savedJobs.check(jobId, email),
    queryFn: () => checkSavedJob(jobId, email),
    enabled: !!jobId && !!email,
    staleTime: 0, // No cache - always fresh
    gcTime: 0, // Don't keep in memory
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    ...options,
  })
}

/**
 * Save a job - simple implementation with flash
 */
export function useSaveJob(
  userEmail?: string,
  options?: UseMutationOptions<SavedJobResponse, Error, string>
) {
  const email = userEmail || 'test@example.com'

  return useMutation({
    mutationFn: (jobId: string) => saveJob(jobId, email),
    ...options,
  })
}

/**
 * Unsave a job - simple implementation with flash
 */
export function useUnsaveJob(
  userEmail?: string,
  options?: UseMutationOptions<{ success: true }, Error, string>
) {
  const email = userEmail || 'test@example.com'

  return useMutation({
    mutationFn: (jobId: string) => unsaveJob(jobId, email),
    ...options,
  })
}

/**
 * Toggle save/unsave job based on current state
 */
export function useToggleSaveJob(userEmail?: string) {
  const saveJob = useSaveJob(userEmail)
  const unsaveJob = useUnsaveJob(userEmail)

  return useMutation({
    mutationFn: async ({ jobId, currentSavedState }: { jobId: string; currentSavedState: boolean }) => {
      if (currentSavedState) {
        return unsaveJob.mutateAsync(jobId)
      } else {
        return saveJob.mutateAsync(jobId)
      }
    }
  })
}

/**
 * ================================
 * SERVER-SIDE QUERY HELPERS
 * ================================
 */

/**
 * Prefetch jobs data for SSR/SSG
 * Use this in getServerSideProps or in Server Components
 */
export async function prefetchJobs(
  queryClient: any,
  page: number = 1,
  limit: number = 20,
  filters: Record<string, any> = {},
  userEmail?: string
) {
  await queryClient.prefetchQuery({
    queryKey: queryKeys.jobs.list({ page, limit, ...filters, userEmail }),
    queryFn: () => getAllJobs(page, limit, filters, userEmail),
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

/**
 * Prefetch job details for SSR/SSG
 */
export async function prefetchJob(queryClient: any, jobId: string) {
  await queryClient.prefetchQuery({
    queryKey: queryKeys.jobs.detail(jobId),
    queryFn: () => getJobById(jobId),
    staleTime: 10 * 60 * 1000, // 10 minutes
  })
}

/**
 * ================================
 * UTILITY HOOKS
 * ================================
 */

/**
 * Hook to get the current query client instance
 * Useful for manual cache operations
 */
export function useQueryClientHelper() {
  const queryClient = useQueryClient()
  
  return {
    queryClient,
    // Helper methods for common operations
    invalidateJobs: () => queryClient.invalidateQueries({ queryKey: queryKeys.jobs.all }),
    invalidateJob: (jobId: string) => queryClient.invalidateQueries({ queryKey: queryKeys.jobs.detail(jobId) }),
    invalidateApplications: () => queryClient.invalidateQueries({ queryKey: queryKeys.applications.all }),
    invalidateSavedJobs: () => queryClient.invalidateQueries({ queryKey: queryKeys.savedJobs.all }),
    invalidateSavedJob: (jobId: string, email: string) => queryClient.invalidateQueries({ queryKey: queryKeys.savedJobs.check(jobId, email) }),
    
    // Prefetch helpers for client-side prefetching
    prefetchJob: (jobId: string) => queryClient.prefetchQuery({
      queryKey: queryKeys.jobs.detail(jobId),
      queryFn: () => getJobById(jobId),
    }),
  }
}