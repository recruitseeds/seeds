interface JobPosting {
  id: string
  title: string
  department: string | null
  job_type: string
  experience_level: string | null
  salary_min: number | null
  salary_max: number | null
  salary_type: string | null
  status: string
  published_at: string | null
  created_at: string | null
  organization: {
    id: string
    name: string
    domain: string | null
    logo_url: string | null
  }
}

interface JobPostingDetail extends JobPosting {
  content: any
}

interface JobListingResponse {
  success: true
  data: JobPosting[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
  }
  metadata: {
    processingTimeMs: number
    correlationId: string
    timestamp: string
  }
}

interface JobDetailResponse {
  success: true
  data: JobPostingDetail
  metadata: {
    processingTimeMs: number
    correlationId: string
    timestamp: string
  }
}

interface CompanyJobsResponse {
  success: true
  data: {
    organization: {
      id: string
      name: string
      domain: string | null
      logo_url: string | null
    }
    jobs: JobPosting[]
  }
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
  }
  metadata: {
    processingTimeMs: number
    correlationId: string
    timestamp: string
  }
}

interface ApiErrorResponse {
  success: false
  error: {
    code: string
    message: string
  }
  timestamp: string
  correlationId: string
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
const API_KEY = process.env.NEXT_PUBLIC_API_KEY || ''
const USE_TEST_ENDPOINTS = true
if (process.env.NODE_ENV === 'development') {
  console.log('🔧 API Configuration:', {
    API_BASE_URL,
    USE_TEST_ENDPOINTS,
    NEXT_PUBLIC_USE_TEST_ENDPOINTS: process.env.NEXT_PUBLIC_USE_TEST_ENDPOINTS,
    NODE_ENV: process.env.NODE_ENV,
  })
}

class JobsApiError extends Error {
  constructor(
    public code: string,
    message: string,
    public statusCode: number,
  ) {
    super(message)
    this.name = 'JobsApiError'
  }
}

async function makeApiRequest<T>(
  endpoint: string, 
  options?: {
    method?: string
    body?: string
    headers?: Record<string, string>
  }
): Promise<T> {
  const baseEndpoint = USE_TEST_ENDPOINTS 
    ? `/test/v1/public/jobs${endpoint}`
    : `/api/v1/public/jobs${endpoint}`
  
  const url = `${API_BASE_URL}${baseEndpoint}`
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options?.headers,
  }
  
  // Only add authorization for production endpoints
  if (!USE_TEST_ENDPOINTS && API_KEY) {
    headers['Authorization'] = `Bearer ${API_KEY}`
  }
  
  // Debug logging in development
  if (process.env.NODE_ENV === 'development') {
    console.log('🔧 Making API request:', {
      url,
      endpoint,
      baseEndpoint,
      method: options?.method || 'GET',
      USE_TEST_ENDPOINTS,
      hasAuth: !USE_TEST_ENDPOINTS && !!API_KEY,
    })
  }
  
  try {
    const response = await fetch(url, {
      method: options?.method || 'GET',
      headers,
      body: options?.body,
      cache: 'no-store',
    })

    const data = await response.json()

    if (!response.ok) {
      const errorData = data as ApiErrorResponse
      throw new JobsApiError(
        errorData.error?.code || 'UNKNOWN_ERROR',
        errorData.error?.message || 'An unknown error occurred',
        response.status
      )
    }

    return data as T
  } catch (error) {
    if (error instanceof JobsApiError) {
      throw error
    }

    if (error instanceof Error && error.name === 'TypeError') {
      throw new JobsApiError(
        'NETWORK_ERROR',
        'Failed to connect to the API. Please check your internet connection.',
        0
      )
    }

    throw new JobsApiError(
      'FETCH_ERROR',
      'An error occurred while fetching data from the API.',
      500
    )
  }
}

export async function getAllJobs(
  page = 1, 
  limit = 20, 
  filters: Record<string, any> = {}
): Promise<JobListingResponse> {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
  })
  
  // Add filters to query params
  if (filters.query) params.set('q', filters.query)
  if (filters.location) params.set('location', filters.location)
  if (filters.jobType) params.set('job_type', filters.jobType)
  if (filters.remote) params.set('remote', filters.remote)
  if (filters.salary) params.set('salary', filters.salary)
  if (filters.experience) params.set('experience', filters.experience)
  if (filters.department) params.set('department', filters.department)
  
  return makeApiRequest<JobListingResponse>(`?${params.toString()}`)
}

export async function getJobById(jobId: string): Promise<JobDetailResponse> {
  return makeApiRequest<JobDetailResponse>(`/${jobId}`)
}

export async function getCompanyJobs(
  orgSlug: string,
  page = 1,
  limit = 20
): Promise<CompanyJobsResponse> {
  return makeApiRequest<CompanyJobsResponse>(`/company/${orgSlug}?page=${page}&limit=${limit}`)
}

// Application check types
interface ApplicationCheckResponse {
  success: true
  data: {
    hasApplied: boolean
    applicationId?: string
    appliedAt?: string
  }
  metadata: {
    processingTimeMs: number
    correlationId: string
    timestamp: string
  }
}

// Job application types
interface ApplicationRequest {
  candidateData: {
    name: string
    email: string
    phone?: string
  }
  resumeFile: {
    fileName: string
    content: string
    mimeType: string
    tags?: string[]
  }
}

interface ApplicationResponse {
  success: true
  data: {
    applicationId: string
    candidateId: string
    status: 'under_review' | 'auto_rejected'
    nextSteps: string
    score?: number
  }
  metadata: {
    processingTimeMs: number
    correlationId: string
    timestamp: string
  }
}

// Check if user has already applied to a job
export async function checkExistingApplication(
  jobId: string,
  email: string
): Promise<ApplicationCheckResponse> {
  const params = new URLSearchParams({ email })
  return makeApiRequest<ApplicationCheckResponse>(`/${jobId}/check-application?${params.toString()}`)
}

// Submit job application
export async function submitJobApplication(
  jobId: string,
  applicationData: ApplicationRequest
): Promise<ApplicationResponse> {
  return makeApiRequest<ApplicationResponse>(`/${jobId}/apply`, {
    method: 'POST',
    body: JSON.stringify(applicationData),
  })
}

// Saved jobs types and functions
interface SavedJobResponse {
  success: true
  data: {
    id: string
    jobId: string
    candidateId: string
    savedAt: string
  }
  metadata: {
    processingTimeMs: number
    correlationId: string
    timestamp: string
  }
}

// Save a job (requires authentication)
export async function saveJob(jobId: string): Promise<SavedJobResponse> {
  return makeApiRequest<SavedJobResponse>(`/saved-jobs`, {
    method: 'POST',
    body: JSON.stringify({ jobId }),
  })
}

// Unsave a job
export async function unsaveJob(jobId: string): Promise<{ success: true }> {
  return makeApiRequest<{ success: true }>(`/saved-jobs/${jobId}`, {
    method: 'DELETE',
  })
}

// Check if job is saved
export async function checkSavedJob(jobId: string): Promise<{ success: true; data: { isSaved: boolean } }> {
  return makeApiRequest<{ success: true; data: { isSaved: boolean } }>(`/saved-jobs/${jobId}/check`)
}

// Export types for use in other files
export type {
  JobPosting,
  JobPostingDetail,
  JobListingResponse,
  JobDetailResponse,
  CompanyJobsResponse,
  ApplicationCheckResponse,
  ApplicationRequest,
  ApplicationResponse,
  SavedJobResponse,
}

// Export additional types that were in the duplicate export
export type {
  JobsApiError,
  ResumeParseResponse,
  ParsedResumeData,
  CandidateScore,
}

export function formatSalary(
  salaryMin: number | null,
  salaryMax: number | null,
  salaryType: string | null = 'yearly'
): string {
  if (!salaryMin && !salaryMax) return 'Salary not specified'
  
  const formatAmount = (amount: number): string => {
    if (salaryType === 'hourly') {
      return `$${amount}/hr`
    }
    
    if (amount >= 1000) {
      return `$${(amount / 1000).toFixed(0)}k`
    }
    
    return `$${amount.toLocaleString()}`
  }

  if (salaryMin && salaryMax) {
    return `${formatAmount(salaryMin)} - ${formatAmount(salaryMax)}`
  }
  
  if (salaryMin) {
    return `From ${formatAmount(salaryMin)}`
  }
  
  if (salaryMax) {
    return `Up to ${formatAmount(salaryMax)}`
  }
  
  return 'Salary not specified'
}

export function getTimeAgo(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffInMilliseconds = now.getTime() - date.getTime()
  const diffInDays = Math.floor(diffInMilliseconds / (1000 * 60 * 60 * 24))
  
  if (diffInDays === 0) {
    const diffInHours = Math.floor(diffInMilliseconds / (1000 * 60 * 60))
    if (diffInHours === 0) {
      const diffInMinutes = Math.floor(diffInMilliseconds / (1000 * 60))
      return `${diffInMinutes} minute${diffInMinutes === 1 ? '' : 's'} ago`
    }
    return `${diffInHours} hour${diffInHours === 1 ? '' : 's'} ago`
  }
  
  if (diffInDays === 1) return '1 day ago'
  if (diffInDays < 7) return `${diffInDays} days ago`
  if (diffInDays < 30) {
    const weeks = Math.floor(diffInDays / 7)
    return `${weeks} week${weeks === 1 ? '' : 's'} ago`
  }
  
  const months = Math.floor(diffInDays / 30)
  return `${months} month${months === 1 ? '' : 's'} ago`
}

// Job Application Types
interface ApplicationRequest {
  candidateData: {
    name: string
    email: string
    phone?: string
  }
  resumeFile: {
    fileName: string
    content: string // base64 encoded
    mimeType: 'application/pdf' | 'application/msword' | 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' | 'text/plain'
    tags?: string[]
  }
}

interface ApplicationResponse {
  success: true
  data: {
    applicationId: string
    candidateId: string
    status: 'under_review' | 'auto_rejected'
    score?: number
    nextSteps: string
  }
  metadata: {
    processingTimeMs: number
    correlationId: string
    timestamp: string
  }
}

// Authentication check function
export function checkAuthentication(): { isAuthenticated: boolean; redirectUrl?: string } {
  // For now, return false since no authentication is implemented in the jobs app
  // In a real implementation, this would check for session/token
  return {
    isAuthenticated: false,
    redirectUrl: `${process.env.NEXT_PUBLIC_MAIN_APP_URL || 'https://app.recruitseeds.com'}/login`
  }
}

// File conversion utility
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      if (reader.result) {
        // Remove the data URL prefix (e.g., "data:application/pdf;base64,")
        const base64String = reader.result.toString().split(',')[1]
        resolve(base64String)
      } else {
        reject(new Error('Failed to read file'))
      }
    }
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })
}

// Resume Parsing Types
interface ResumeParseRequest {
  jobId: string
}

interface ParsedResumeData {
  personalInfo: {
    name: string
    email?: string
    phone?: string
    location?: string
    linkedinUrl?: string
    githubUrl?: string
    portfolioUrl?: string
  }
  skills: string[]
  experience: Array<{
    company: string
    position: string
    startDate: string
    endDate: string | null
    description: string
  }>
  education: Array<{
    institution: string
    degree: string
    field?: string
    graduationDate?: string
    gpa?: string
  }>
  projects: Array<{
    name: string
    description: string
    technologies: string[]
    githubUrl?: string
  }>
  certifications: Array<{
    name: string
    issuer: string
    issueDate?: string
  }>
  languages: string[]
}

interface CandidateScore {
  candidateId: string
  jobId: string
  overallScore: number
  requiredSkillsScore: number
  experienceScore: number
  educationScore: number
  skillMatches: Array<{
    skill: string
    confidence: number
    context: string
  }>
  missingRequiredSkills: string[]
  recommendations: string[]
}

interface ResumeParseResponse {
  success: true
  data: {
    parsedData: ParsedResumeData
    score: CandidateScore
  }
  metadata: {
    processingTimeMs: number
    correlationId: string
    timestamp: string
  }
}


export async function parseResumeAndScore(
  candidateId: string,
  jobId: string
): Promise<ResumeParseResponse> {
  if (USE_TEST_ENDPOINTS) {
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000))
    
    const baseScore = 60 + Math.random() * 35
    const skillsScore = Math.max(0, Math.min(100, baseScore + (Math.random() - 0.5) * 20))
    const experienceScore = Math.max(0, Math.min(100, baseScore + (Math.random() - 0.5) * 15))
    const educationScore = Math.max(0, Math.min(100, baseScore + (Math.random() - 0.5) * 10))
    const overallScore = Math.round(skillsScore * 0.5 + experienceScore * 0.3 + educationScore * 0.2)
    
    return {
      success: true,
      data: {
        parsedData: {
          personalInfo: {
            name: "John Doe",
            email: "john.doe@example.com",
            phone: "+1 (555) 123-4567",
            location: "San Francisco, CA",
            linkedinUrl: "https://linkedin.com/in/johndoe",
            githubUrl: "https://github.com/johndoe",
            portfolioUrl: "https://johndoe.dev",
          },
          skills: [
            "JavaScript", "TypeScript", "React", "Node.js", "Python", 
            "PostgreSQL", "Docker", "AWS", "Git", "Agile"
          ],
          experience: [
            {
              company: "Tech Startup Inc",
              position: "Senior Frontend Developer",
              startDate: "2022-01-01",
              endDate: null,
              description: "Led development of React-based web applications with TypeScript",
            },
            {
              company: "Digital Agency Co",
              position: "Full Stack Developer",
              startDate: "2020-06-01",
              endDate: "2021-12-31",
              description: "Built full-stack web applications using Node.js and React",
            },
          ],
          education: [
            {
              institution: "University of California, Berkeley",
              degree: "Bachelor of Science",
              field: "Computer Science",
              graduationDate: "2020-05-01",
              gpa: "3.7",
            },
          ],
          projects: [
            {
              name: "E-commerce Platform",
              description: "Built a full-stack e-commerce platform with React and Node.js",
              technologies: ["React", "Node.js", "PostgreSQL", "Stripe"],
              githubUrl: "https://github.com/johndoe/ecommerce-platform",
            },
          ],
          certifications: [
            {
              name: "AWS Solutions Architect Associate",
              issuer: "Amazon Web Services",
              issueDate: "2023-03-15",
            },
          ],
          languages: ["English", "Spanish"],
        },
        score: {
          candidateId,
          jobId,
          overallScore,
          requiredSkillsScore: Math.round(skillsScore),
          experienceScore: Math.round(experienceScore),
          educationScore: Math.round(educationScore),
          skillMatches: [
            { skill: "JavaScript", confidence: 0.95, context: "5+ years experience in frontend development" },
            { skill: "React", confidence: 0.90, context: "Led React-based application development" },
            { skill: "TypeScript", confidence: 0.85, context: "Used TypeScript in multiple projects" },
            { skill: "Node.js", confidence: 0.80, context: "Backend development experience" },
            { skill: "PostgreSQL", confidence: 0.75, context: "Database design and optimization" },
          ],
          missingRequiredSkills: overallScore < 70 ? ["Vue.js", "GraphQL"] : [],
          recommendations: [
            overallScore >= 85 ? "🟢 Strong candidate - recommend for interview" :
            overallScore >= 70 ? "🟡 Good candidate - consider for interview" :
            "🔴 Skills gap identified - may not meet requirements"
          ],
        }
      },
      metadata: {
        processingTimeMs: 1500,
        correlationId: `mock-${Date.now()}`,
        timestamp: new Date().toISOString(),
      }
    }
  }
  const baseEndpoint = `/api/v1/public/candidates/${candidateId}/parse-resume`
  const url = `${API_BASE_URL}${baseEndpoint}`
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${API_KEY}`
  }
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify({ jobId }),
    })

    const data = await response.json()

    if (!response.ok) {
      const errorData = data as ApiErrorResponse
      throw new JobsApiError(
        errorData.error?.code || 'PARSING_ERROR',
        errorData.error?.message || 'Failed to parse resume and calculate score',
        response.status
      )
    }

    return data as ResumeParseResponse
  } catch (error) {
    if (error instanceof JobsApiError) {
      throw error
    }

    if (error instanceof Error && error.name === 'TypeError') {
      throw new JobsApiError(
        'NETWORK_ERROR',
        'Failed to connect to the API. Please check your internet connection.',
        0
      )
    }

    throw new JobsApiError(
      'PARSING_ERROR',
      'An error occurred while parsing your resume. Please try again.',
      500
    )
  }
}

