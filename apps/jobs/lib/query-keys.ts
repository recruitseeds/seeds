/**
 * Query Key Factory
 * 
 * Centralized query key management following TanStack Query best practices.
 * This ensures consistent cache invalidation and prevents key conflicts.
 */

export const queryKeys = {
  // Jobs
  jobs: {
    all: ['jobs'] as const,
    lists: () => [...queryKeys.jobs.all, 'list'] as const,
    list: (filters: Record<string, any>) => [...queryKeys.jobs.lists(), filters] as const,
    details: () => [...queryKeys.jobs.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.jobs.details(), id] as const,
  },
  
  // Companies
  companies: {
    all: ['companies'] as const,
    lists: () => [...queryKeys.companies.all, 'list'] as const,
    list: (filters: Record<string, any>) => [...queryKeys.companies.lists(), filters] as const,
    details: () => [...queryKeys.companies.all, 'detail'] as const,
    detail: (slug: string) => [...queryKeys.companies.details(), slug] as const,
    jobs: (slug: string) => [...queryKeys.companies.detail(slug), 'jobs'] as const,
    profile: (slug: string) => [...queryKeys.companies.detail(slug), 'profile'] as const,
  },
  
  // Applications
  applications: {
    all: ['applications'] as const,
    details: () => [...queryKeys.applications.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.applications.details(), id] as const,
    check: (jobId: string, email: string) => [...queryKeys.applications.all, 'check', jobId, email] as const,
  },
  
  // Categories
  categories: {
    all: ['categories'] as const,
    list: () => [...queryKeys.categories.all, 'list'] as const,
  },
  
  // Search
  search: {
    all: ['search'] as const,
    jobs: (query: string, filters: Record<string, any>) => [...queryKeys.search.all, 'jobs', query, filters] as const,
  },
  
  // Saved Jobs
  savedJobs: {
    all: ['savedJobs'] as const,
    lists: () => [...queryKeys.savedJobs.all, 'list'] as const,
    list: () => [...queryKeys.savedJobs.lists()] as const,
    check: (jobId: string) => [...queryKeys.savedJobs.all, 'check', jobId] as const,
  },
} as const

/**
 * Utility functions for invalidating related queries
 */
export const queryInvalidation = {
  // Invalidate all job-related queries
  allJobs: () => queryKeys.jobs.all,
  
  // Invalidate specific job and its related data
  jobDetail: (jobId: string) => [
    queryKeys.jobs.detail(jobId),
    queryKeys.applications.check(jobId, '*'), // Wildcard for email
  ],
  
  // Invalidate company-related queries
  companyData: (slug: string) => [
    queryKeys.companies.detail(slug),
    queryKeys.companies.jobs(slug),
    queryKeys.companies.profile(slug),
  ],
  
  // Invalidate application-related queries
  applications: () => queryKeys.applications.all,
}