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
  options?: Partial<JobListQueryOptions>
) {
  return useQuery({
    queryKey: queryKeys.jobs.list({ page, limit, ...filters }),
    queryFn: () => getAllJobs(page, limit, filters),
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
  options?: Partial<JobListQueryOptions>
) {
  return useQuery({
    queryKey: queryKeys.search.jobs(filters.query || '', { ...filters, page, limit }),
    queryFn: () => getAllJobs(page, limit, filters),
    staleTime: 1 * 60 * 1000, // 1 minute for search results (shorter than regular job lists)
    gcTime: 3 * 60 * 1000, // 3 minutes
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
  options?: Partial<UseQueryOptions<{ success: true; data: { isSaved: boolean } }, Error>>
) {
  return useQuery({
    queryKey: queryKeys.savedJobs.check(jobId),
    queryFn: () => checkSavedJob(jobId),
    enabled: !!jobId,
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 5 * 60 * 1000, // 5 minutes
    ...options,
  })
}

/**
 * Save a job with optimistic updates
 */
export function useSaveJob(
  options?: UseMutationOptions<SavedJobResponse, Error, string>
) {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: saveJob,
    
    // Optimistic update
    onMutate: async (jobId) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.savedJobs.check(jobId) })
      
      // Get current saved state
      const previousSavedState = queryClient.getQueryData(queryKeys.savedJobs.check(jobId))
      
      // Optimistically update to saved
      queryClient.setQueryData(queryKeys.savedJobs.check(jobId), {
        success: true,
        data: { isSaved: true }
      })
      
      return { jobId, previousSavedState }
    },
    
    // Rollback on error
    onError: (error, jobId, context) => {
      if (context?.previousSavedState) {
        queryClient.setQueryData(queryKeys.savedJobs.check(jobId), context.previousSavedState)
      } else {
        queryClient.invalidateQueries({ queryKey: queryKeys.savedJobs.check(jobId) })
      }
    },
    
    // Confirm update on success
    onSuccess: (data, jobId) => {
      queryClient.setQueryData(queryKeys.savedJobs.check(jobId), {
        success: true,
        data: { isSaved: true }
      })
      // Invalidate saved jobs list if it exists
      queryClient.invalidateQueries({ queryKey: queryKeys.savedJobs.lists() })
    },
    
    ...options,
  })
}

/**
 * Unsave a job with optimistic updates
 */
export function useUnsaveJob(
  options?: UseMutationOptions<{ success: true }, Error, string>
) {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: unsaveJob,
    
    // Optimistic update
    onMutate: async (jobId) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.savedJobs.check(jobId) })
      
      // Get current saved state
      const previousSavedState = queryClient.getQueryData(queryKeys.savedJobs.check(jobId))
      
      // Optimistically update to unsaved
      queryClient.setQueryData(queryKeys.savedJobs.check(jobId), {
        success: true,
        data: { isSaved: false }
      })
      
      return { jobId, previousSavedState }
    },
    
    // Rollback on error
    onError: (error, jobId, context) => {
      if (context?.previousSavedState) {
        queryClient.setQueryData(queryKeys.savedJobs.check(jobId), context.previousSavedState)
      } else {
        queryClient.invalidateQueries({ queryKey: queryKeys.savedJobs.check(jobId) })
      }
    },
    
    // Confirm update on success
    onSuccess: (data, jobId) => {
      queryClient.setQueryData(queryKeys.savedJobs.check(jobId), {
        success: true,
        data: { isSaved: false }
      })
      // Invalidate saved jobs list if it exists
      queryClient.invalidateQueries({ queryKey: queryKeys.savedJobs.lists() })
    },
    
    ...options,
  })
}

/**
 * Toggle save/unsave job based on current state
 */
export function useToggleSaveJob() {
  const saveJob = useSaveJob()
  const unsaveJob = useUnsaveJob()
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (jobId: string) => {
      // Get current saved state
      const currentState = queryClient.getQueryData(queryKeys.savedJobs.check(jobId)) as { data: { isSaved: boolean } } | undefined
      const isSaved = currentState?.data?.isSaved ?? false
      
      if (isSaved) {
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
  filters: Record<string, any> = {}
) {
  await queryClient.prefetchQuery({
    queryKey: queryKeys.jobs.list({ page, limit, ...filters }),
    queryFn: () => getAllJobs(page, limit, filters),
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
    
    // Prefetch helpers for client-side prefetching
    prefetchJob: (jobId: string) => queryClient.prefetchQuery({
      queryKey: queryKeys.jobs.detail(jobId),
      queryFn: () => getJobById(jobId),
    }),
  }
}