// Server-side API functions for Next.js App Router
import { JobListingResponse, JobDetailResponse } from './api'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

// Server-side API call without browser fetch limitations
async function makeServerApiRequest<T>(endpoint: string): Promise<T> {
  const url = `${API_BASE_URL}/test/v1/public/jobs${endpoint}`
  
  try {
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
      },
      // Use Next.js caching for better performance
      next: { revalidate: 60 }, // Revalidate every 60 seconds
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Server API Error:', {
        url,
        status: response.status,
        statusText: response.statusText,
        body: errorText
      })
      throw new Error(`API request failed: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    return data as T
  } catch (error) {
    console.error('Server API Request Error:', {
      url,
      error: error instanceof Error ? error.message : 'Unknown error'
    })
    throw error
  }
}

export async function getJobsServerSide(page = 1, limit = 20): Promise<JobListingResponse> {
  return makeServerApiRequest<JobListingResponse>(`?page=${page}&limit=${limit}`)
}

export async function getJobByIdServerSide(jobId: string): Promise<JobDetailResponse> {
  return makeServerApiRequest<JobDetailResponse>(`/${jobId}`)
}

// Helper function to handle server-side errors gracefully
export function createFallbackJobsResponse(error: Error): JobListingResponse {
  console.error('Creating fallback response due to error:', error.message)
  
  return {
    success: true,
    data: [],
    pagination: {
      page: 1,
      limit: 20,
      total: 0,
      totalPages: 0,
      hasNext: false,
      hasPrev: false,
    },
    metadata: {
      processingTimeMs: 0,
      correlationId: 'fallback',
      timestamp: new Date().toISOString(),
    }
  }
}