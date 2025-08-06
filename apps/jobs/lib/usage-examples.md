# React Query Usage Examples

This document shows how to use the React Query setup in the jobs app.

## Client-Side Usage

### Basic Job Queries

```typescript
'use client'

import { useJobs, useJob } from '../lib/queries'

function JobsList() {
  // Fetch paginated jobs with caching and error handling
  const { data, isLoading, error, refetch } = useJobs(1, 20)
  
  if (isLoading) return <div>Loading jobs...</div>
  if (error) return <div>Error: {error.message}</div>
  
  return (
    <div>
      {data?.data.map(job => (
        <div key={job.id}>{job.title}</div>
      ))}
    </div>
  )
}

function JobDetail({ jobId }: { jobId: string }) {
  // Fetch single job with automatic caching
  const { data: job, isLoading } = useJob(jobId)
  
  if (isLoading) return <div>Loading...</div>
  
  return <h1>{job?.data.title}</h1>
}
```

### Search with Filters

```typescript
function SearchPage() {
  const [filters, setFilters] = useState({ jobType: 'full_time' })
  
  const { data, isLoading } = useJobs(1, 20, filters)
  
  // Data is automatically refetched when filters change
  return (
    <div>
      <button onClick={() => setFilters({ ...filters, remote: 'remote' })}>
        Add Remote Filter
      </button>
      {/* Job list */}
    </div>
  )
}
```

### Mutations (Job Applications)

```typescript
function ApplicationForm({ jobId }: { jobId: string }) {
  const submitApplication = useSubmitApplication({
    onSuccess: () => {
      toast.success('Application submitted!')
    },
    onError: (error) => {
      toast.error(`Failed: ${error.message}`)
    }
  })
  
  const handleSubmit = (formData: ApplicationRequest) => {
    submitApplication.mutate({ jobId, data: formData })
  }
  
  return (
    <form onSubmit={handleSubmit}>
      {/* Form fields */}
      <button 
        type="submit" 
        disabled={submitApplication.isPending}
      >
        {submitApplication.isPending ? 'Submitting...' : 'Apply'}
      </button>
    </form>
  )
}
```

## Server-Side Usage

### Server Components with Prefetched Data

```typescript
// app/jobs/page.tsx
import { getJobsServerSide } from '../lib/server-queries'
import { HydrationBoundary } from '@tanstack/react-query'
import { JobsList } from '../components/jobs-list'

export default async function JobsPage() {
  // Prefetch data on the server
  const { dehydratedState, data } = await getJobsServerSide(1, 20)
  
  return (
    <div>
      <h1>Jobs</h1>
      {/* Hydrate the client with server data */}
      <HydrationBoundary state={dehydratedState}>
        <JobsList initialData={data} />
      </HydrationBoundary>
    </div>
  )
}
```

### Dynamic Pages with Search Params

```typescript
// app/jobs/search/page.tsx
interface SearchPageProps {
  searchParams: { q?: string; location?: string }
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const { q: query = '', location = '' } = searchParams
  
  // Prefetch search results
  const { dehydratedState, data } = await getSearchResultsServerSide(
    query, 
    location, 
    {}, // additional filters
    1,  // page
    20  // limit
  )
  
  return (
    <div>
      <h1>Search Results for "{query}"</h1>
      <HydrationBoundary state={dehydratedState}>
        <SearchResults 
          initialData={data}
          query={query}
          location={location}
        />
      </HydrationBoundary>
    </div>
  )
}
```

### Job Detail Pages

```typescript
// app/jobs/[id]/page.tsx
import { getJobServerSide } from '../../../lib/server-queries'
import { HydrationBoundary } from '@tanstack/react-query'
import { JobDetail } from '../../../components/job-detail'

interface JobPageProps {
  params: { id: string }
}

export default async function JobPage({ params }: JobPageProps) {
  try {
    const { dehydratedState, data } = await getJobServerSide(params.id)
    
    return (
      <HydrationBoundary state={dehydratedState}>
        <JobDetail jobId={params.id} initialData={data} />
      </HydrationBoundary>
    )
  } catch (error) {
    // Handle 404 or other errors
    notFound()
  }
}
```

## Advanced Usage

### Manual Cache Management

```typescript
function JobManager() {
  const { 
    queryClient,
    invalidateJobs,
    prefetchJob
  } = useQueryClientHelper()
  
  const handleJobUpdate = async (jobId: string) => {
    // Invalidate specific job
    await queryClient.invalidateQueries({ 
      queryKey: queryKeys.jobs.detail(jobId) 
    })
    
    // Or use helper
    invalidateJob(jobId)
    
    // Prefetch related data
    await prefetchJob('related-job-id')
  }
  
  return <button onClick={() => handleJobUpdate('123')}>Update Job</button>
}
```

### Optimistic Updates

```typescript
function QuickApply({ jobId }: { jobId: string }) {
  const submitApplication = useSubmitApplication({
    // Optimistic update happens automatically in the mutation
    onMutate: ({ jobId, data }) => {
      // Show immediate feedback
      toast.info('Submitting application...')
    },
    
    onSuccess: () => {
      toast.success('Application submitted successfully!')
    },
    
    onError: (error, variables, context) => {
      // Error handling with potential rollback
      toast.error(`Failed to submit: ${error.message}`)
    }
  })
  
  // The mutation handles optimistic updates automatically
  return (
    <button onClick={() => submitApplication.mutate({ jobId, data })}>
      Quick Apply
    </button>
  )
}
```

## Error Handling

### Global Error Boundary

```typescript
// components/query-error-boundary.tsx
import { useQueryErrorResetBoundary } from '@tanstack/react-query'
import { ErrorBoundary } from 'react-error-boundary'

function QueryErrorBoundary({ children }: { children: React.ReactNode }) {
  const { reset } = useQueryErrorResetBoundary()
  
  return (
    <ErrorBoundary
      onReset={reset}
      fallbackRender={({ resetErrorBoundary }) => (
        <div>
          <p>Something went wrong with loading data.</p>
          <button onClick={resetErrorBoundary}>Try again</button>
        </div>
      )}
    >
      {children}
    </ErrorBoundary>
  )
}
```

## Performance Tips

1. **Use selective queries**: Only fetch what you need
2. **Implement proper staleTime**: Balance freshness vs performance
3. **Use prefetching**: Prefetch data user is likely to need
4. **Implement pagination**: Don't fetch all data at once
5. **Use optimistic updates**: For better user experience
6. **Cache invalidation**: Be strategic about when to invalidate

## Development Tools

The React Query DevTools are automatically included in development mode. Access them via the floating button in the bottom-left corner of your screen.