import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ApplicationForm } from '../../app/[orgSlug]/[jobId]/application-form'
import * as api from '../../lib/api'

vi.mock('../../lib/api')

const mockSubmitJobApplication = vi.mocked(api.submitJobApplication)
const mockParseResumeAndScore = vi.mocked(api.parseResumeAndScore)
const mockCheckAuthentication = vi.mocked(api.checkAuthentication)

describe('E2E: Application Form Flow', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockCheckAuthentication.mockReturnValue({ 
      isAuthenticated: false,
      redirectUrl: 'https://app.recruitseeds.com/login'
    })
  })

  const createMockFile = (name: string, type: string, size: number = 1024) => {
    const file = new File(['test content'], name, { type })
    Object.defineProperty(file, 'size', { value: size })
    return file
  }

  it('completes full application submission and resume parsing flow', async () => {
    mockSubmitJobApplication.mockResolvedValue({
      success: true,
      data: {
        applicationId: 'app-123',
        candidateId: 'candidate-456',
        status: 'under_review',
        nextSteps: 'We will review your application and get back to you within 7 business days.',
      },
      metadata: {
        processingTimeMs: 1500,
        correlationId: 'corr-123',
        timestamp: new Date().toISOString(),
      },
    })

    mockParseResumeAndScore.mockResolvedValue({
      success: true,
      data: {
        parsedData: {
          personalInfo: {
            name: 'John Doe',
            email: 'john.doe@example.com',
            phone: '+1 (555) 123-4567',
            location: 'San Francisco, CA',
          },
          skills: ['JavaScript', 'React', 'TypeScript', 'Node.js'],
          experience: [
            {
              company: 'TechCorp',
              position: 'Senior Developer',
              startDate: '2021-01-01',
              endDate: null,
              description: 'Developed React applications',
            },
          ],
          education: [
            {
              institution: 'UC Berkeley',
              degree: 'BS Computer Science',
              field: 'Computer Science',
              graduationDate: '2019-05-01',
            },
          ],
          projects: [],
          certifications: [],
          languages: ['English'],
        },
        score: {
          candidateId: 'candidate-456',
          jobId: 'job-123',
          overallScore: 85,
          requiredSkillsScore: 90,
          experienceScore: 80,
          educationScore: 85,
          skillMatches: [
            { skill: 'JavaScript', confidence: 0.95, context: 'Frontend development experience' },
            { skill: 'React', confidence: 0.90, context: 'Component library usage' },
          ],
          missingRequiredSkills: [],
          recommendations: ['🟢 Strong candidate - recommend for interview'],
        },
      },
      metadata: {
        processingTimeMs: 2500,
        correlationId: 'parse-123',
        timestamp: new Date().toISOString(),
      },
    })

    render(<ApplicationForm jobId="job-123" orgSlug="techcorp" />)

    const firstNameInput = screen.getByLabelText(/First Name/)
    const lastNameInput = screen.getByLabelText(/Last Name/)
    const emailInput = screen.getByLabelText(/Email/)
    const phoneInput = screen.getByLabelText(/Phone/)
    const resumeInput = screen.getByLabelText(/Resume/)
    const submitButton = screen.getByRole('button', { name: /Submit Application/ })

    fireEvent.change(firstNameInput, { target: { value: 'John' } })
    fireEvent.change(lastNameInput, { target: { value: 'Doe' } })
    fireEvent.change(emailInput, { target: { value: 'john.doe@example.com' } })
    fireEvent.change(phoneInput, { target: { value: '+1 (555) 123-4567' } })

    const file = createMockFile('resume.pdf', 'application/pdf')
    fireEvent.change(resumeInput, { target: { files: [file] } })

    expect(submitButton).toBeEnabled()

    mockCheckAuthentication.mockReturnValue({ isAuthenticated: true })

    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText('🔍 Analyzing your resume...')).toBeInTheDocument()
    })

    await waitFor(() => {
      expect(screen.getByText('Application Submitted!')).toBeInTheDocument()
    }, { timeout: 5000 })

    expect(screen.getByText('Match Score: 85%')).toBeInTheDocument()
    expect(screen.getByText('🟢 Strong candidate - recommend for interview')).toBeInTheDocument()
    expect(screen.getByText('Skills Match:')).toBeInTheDocument()
    expect(screen.getByText('90%')).toBeInTheDocument()
    expect(screen.getByText('JavaScript')).toBeInTheDocument()
    expect(screen.getByText('React')).toBeInTheDocument()

    expect(mockSubmitJobApplication).toHaveBeenCalledWith('job-123', {
      candidateData: {
        name: 'John Doe',
        email: 'john.doe@example.com',
        phone: '+1 (555) 123-4567',
      },
      resumeFile: {
        fileName: 'resume.pdf',
        content: expect.any(String),
        mimeType: 'application/pdf',
        tags: ['frontend', 'web-development'],
      },
    })

    expect(mockParseResumeAndScore).toHaveBeenCalledWith('candidate-456', 'job-123')
  })

  it('handles auto-rejection scenario with low score', async () => {
    mockSubmitJobApplication.mockResolvedValue({
      success: true,
      data: {
        applicationId: 'app-124',
        candidateId: 'candidate-457',
        status: 'under_review',
        nextSteps: 'We will review your application.',
      },
      metadata: {
        processingTimeMs: 1500,
        correlationId: 'corr-124',
        timestamp: new Date().toISOString(),
      },
    })

    mockParseResumeAndScore.mockResolvedValue({
      success: true,
      data: {
        parsedData: {
          personalInfo: {
            name: 'Jane Smith',
            email: 'jane.smith@example.com',
          },
          skills: ['HTML', 'CSS'],
          experience: [],
          education: [],
          projects: [],
          certifications: [],
          languages: ['English'],
        },
        score: {
          candidateId: 'candidate-457',
          jobId: 'job-123',
          overallScore: 25,
          requiredSkillsScore: 20,
          experienceScore: 30,
          educationScore: 25,
          skillMatches: [
            { skill: 'HTML', confidence: 0.80, context: 'Basic web development' },
          ],
          missingRequiredSkills: ['JavaScript', 'React', 'TypeScript'],
          recommendations: ['🔴 Skills gap identified - may not meet requirements'],
        },
      },
      metadata: {
        processingTimeMs: 2000,
        correlationId: 'parse-124',
        timestamp: new Date().toISOString(),
      },
    })

    mockCheckAuthentication.mockReturnValue({ isAuthenticated: true })

    render(<ApplicationForm jobId="job-123" orgSlug="techcorp" />)

    const firstNameInput = screen.getByLabelText(/First Name/)
    const lastNameInput = screen.getByLabelText(/Last Name/)
    const emailInput = screen.getByLabelText(/Email/)
    const resumeInput = screen.getByLabelText(/Resume/)

    fireEvent.change(firstNameInput, { target: { value: 'Jane' } })
    fireEvent.change(lastNameInput, { target: { value: 'Smith' } })
    fireEvent.change(emailInput, { target: { value: 'jane.smith@example.com' } })

    const file = createMockFile('resume.pdf', 'application/pdf')
    fireEvent.change(resumeInput, { target: { files: [file] } })

    fireEvent.click(screen.getByRole('button', { name: /Submit Application/ }))

    await waitFor(() => {
      expect(screen.getByText('Application Received')).toBeInTheDocument()
    }, { timeout: 5000 })

    expect(screen.getByText('Match Score: 25%')).toBeInTheDocument()
    expect(screen.getByText('Your application did not meet the minimum requirements for this role.')).toBeInTheDocument()
    expect(screen.getByText('🔴 Skills gap identified - may not meet requirements')).toBeInTheDocument()
  })

  it('shows authentication modal when user is not authenticated', async () => {
    mockCheckAuthentication.mockReturnValue({ 
      isAuthenticated: false,
      redirectUrl: 'https://app.recruitseeds.com/login'
    })

    render(<ApplicationForm jobId="job-123" orgSlug="techcorp" />)

    const firstNameInput = screen.getByLabelText(/First Name/)
    const lastNameInput = screen.getByLabelText(/Last Name/)
    const emailInput = screen.getByLabelText(/Email/)
    const resumeInput = screen.getByLabelText(/Resume/)

    fireEvent.change(firstNameInput, { target: { value: 'John' } })
    fireEvent.change(lastNameInput, { target: { value: 'Doe' } })
    fireEvent.change(emailInput, { target: { value: 'john.doe@example.com' } })

    const file = createMockFile('resume.pdf', 'application/pdf')
    fireEvent.change(resumeInput, { target: { files: [file] } })

    fireEvent.click(screen.getByRole('button', { name: /Submit Application/ }))

    await waitFor(() => {
      expect(screen.getByText('Sign in to apply')).toBeInTheDocument()
    })

    expect(screen.getByLabelText('Email')).toBeInTheDocument()
    expect(screen.getByLabelText('Password')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Sign In' })).toBeInTheDocument()

    expect(mockSubmitJobApplication).not.toHaveBeenCalled()
  })

  it('handles file validation errors', async () => {
    render(<ApplicationForm jobId="job-123" orgSlug="techcorp" />)

    const resumeInput = screen.getByLabelText(/Resume/)

    const invalidFile = createMockFile('resume.txt', 'text/javascript')
    fireEvent.change(resumeInput, { target: { files: [invalidFile] } })

    await waitFor(() => {
      expect(screen.getByText('Please upload a PDF, DOC, DOCX, or TXT file')).toBeInTheDocument()
    })

    const largeFile = createMockFile('resume.pdf', 'application/pdf', 6 * 1024 * 1024)
    fireEvent.change(resumeInput, { target: { files: [largeFile] } })

    await waitFor(() => {
      expect(screen.getByText('File size must be less than 5MB')).toBeInTheDocument()
    })
  })

  it('handles resume parsing errors gracefully', async () => {
    mockSubmitJobApplication.mockResolvedValue({
      success: true,
      data: {
        applicationId: 'app-125',
        candidateId: 'candidate-458',
        status: 'under_review',
        nextSteps: 'We will review your application.',
      },
      metadata: {
        processingTimeMs: 1500,
        correlationId: 'corr-125',
        timestamp: new Date().toISOString(),
      },
    })

    mockParseResumeAndScore.mockRejectedValue(new Error('Resume parsing service unavailable'))

    mockCheckAuthentication.mockReturnValue({ isAuthenticated: true })

    render(<ApplicationForm jobId="job-123" orgSlug="techcorp" />)

    const firstNameInput = screen.getByLabelText(/First Name/)
    const lastNameInput = screen.getByLabelText(/Last Name/)
    const emailInput = screen.getByLabelText(/Email/)
    const resumeInput = screen.getByLabelText(/Resume/)

    fireEvent.change(firstNameInput, { target: { value: 'John' } })
    fireEvent.change(lastNameInput, { target: { value: 'Doe' } })
    fireEvent.change(emailInput, { target: { value: 'john.doe@example.com' } })

    const file = createMockFile('resume.pdf', 'application/pdf')
    fireEvent.change(resumeInput, { target: { files: [file] } })

    fireEvent.click(screen.getByRole('button', { name: /Submit Application/ }))

    await waitFor(() => {
      expect(screen.getByText('Application Submitted!')).toBeInTheDocument()
    }, { timeout: 5000 })

    await waitFor(() => {
      expect(screen.getByText('⚠️ Resume Analysis Issue')).toBeInTheDocument()
    })

    expect(screen.getByText(/Resume analysis failed.*Your application was still submitted successfully/)).toBeInTheDocument()
  })

  it('preserves form data during authentication flow', async () => {
    mockCheckAuthentication.mockReturnValue({ 
      isAuthenticated: false,
      redirectUrl: 'https://app.recruitseeds.com/login'
    })

    const localStorageMock = {
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn(),
    }
    Object.defineProperty(window, 'localStorage', { value: localStorageMock })

    render(<ApplicationForm jobId="job-123" orgSlug="techcorp" />)

    const firstNameInput = screen.getByLabelText(/First Name/)
    const lastNameInput = screen.getByLabelText(/Last Name/)
    const emailInput = screen.getByLabelText(/Email/)
    const phoneInput = screen.getByLabelText(/Phone/)
    const resumeInput = screen.getByLabelText(/Resume/)

    fireEvent.change(firstNameInput, { target: { value: 'John' } })
    fireEvent.change(lastNameInput, { target: { value: 'Doe' } })
    fireEvent.change(emailInput, { target: { value: 'john.doe@example.com' } })
    fireEvent.change(phoneInput, { target: { value: '+1 (555) 123-4567' } })

    const file = createMockFile('resume.pdf', 'application/pdf')
    fireEvent.change(resumeInput, { target: { files: [file] } })

    fireEvent.click(screen.getByRole('button', { name: /Submit Application/ }))

    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      'pendingApplication',
      expect.stringContaining('john.doe@example.com')
    )

    const savedData = JSON.parse(localStorageMock.setItem.mock.calls[0][1])
    expect(savedData).toMatchObject({
      jobId: 'job-123',
      orgSlug: 'techcorp',
      formData: {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        phone: '+1 (555) 123-4567',
      },
      resumeFile: {
        name: 'resume.pdf',
        type: 'application/pdf',
        size: 1024,
      },
    })
  })
})