import { describe, it, expect, vi, beforeEach } from 'vitest'
import { parseResumeAndScore, submitJobApplication, JobsApiError } from '../../lib/api'

global.fetch = vi.fn()

describe('API Functions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('parseResumeAndScore', () => {
    it('returns mock data when USE_TEST_ENDPOINTS is true', async () => {
      const result = await parseResumeAndScore('candidate-123', 'job-456')

      expect(result).toMatchObject({
        success: true,
        data: {
          parsedData: {
            personalInfo: {
              name: 'John Doe',
              email: 'john.doe@example.com',
            },
            skills: expect.arrayContaining(['JavaScript', 'TypeScript', 'React']),
          },
          score: {
            candidateId: 'candidate-123',
            jobId: 'job-456',
            overallScore: expect.any(Number),
            requiredSkillsScore: expect.any(Number),
            experienceScore: expect.any(Number),
            educationScore: expect.any(Number),
          },
        },
        metadata: {
          processingTimeMs: 1500,
          correlationId: expect.stringMatching(/^mock-/),
          timestamp: expect.any(String),
        },
      })

      expect(result.data.score.overallScore).toBeGreaterThanOrEqual(60)
      expect(result.data.score.overallScore).toBeLessThanOrEqual(95)
    })

    it('includes comprehensive parsed resume data', async () => {
      const result = await parseResumeAndScore('candidate-123', 'job-456')

      expect(result.data.parsedData).toHaveProperty('personalInfo')
      expect(result.data.parsedData).toHaveProperty('skills')
      expect(result.data.parsedData).toHaveProperty('experience')
      expect(result.data.parsedData).toHaveProperty('education')
      expect(result.data.parsedData).toHaveProperty('projects')
      expect(result.data.parsedData).toHaveProperty('certifications')
      expect(result.data.parsedData).toHaveProperty('languages')

      expect(Array.isArray(result.data.parsedData.skills)).toBe(true)
      expect(Array.isArray(result.data.parsedData.experience)).toBe(true)
      expect(Array.isArray(result.data.parsedData.education)).toBe(true)
    })

    it('includes detailed skill matching results', async () => {
      const result = await parseResumeAndScore('candidate-123', 'job-456')

      expect(result.data.score).toHaveProperty('skillMatches')
      expect(result.data.score).toHaveProperty('missingRequiredSkills')
      expect(result.data.score).toHaveProperty('recommendations')

      expect(Array.isArray(result.data.score.skillMatches)).toBe(true)
      expect(Array.isArray(result.data.score.missingRequiredSkills)).toBe(true)
      expect(Array.isArray(result.data.score.recommendations)).toBe(true)

      if (result.data.score.skillMatches.length > 0) {
        const skillMatch = result.data.score.skillMatches[0]
        expect(skillMatch).toHaveProperty('skill')
        expect(skillMatch).toHaveProperty('confidence')
        expect(skillMatch).toHaveProperty('context')
      }
    })

    it('provides realistic score variability', async () => {
      const results = await Promise.all([
        parseResumeAndScore('candidate-1', 'job-456'),
        parseResumeAndScore('candidate-2', 'job-456'),
        parseResumeAndScore('candidate-3', 'job-456'),
      ])

      const scores = results.map(r => r.data.score.overallScore)
      
      expect(Math.max(...scores) - Math.min(...scores)).toBeGreaterThan(0)
    })

    it('generates variable missing skills based on score', async () => {
      const lowScoreResult = await parseResumeAndScore('candidate-123', 'job-456')
      
      if (lowScoreResult.data.score.overallScore < 70) {
        expect(lowScoreResult.data.score.missingRequiredSkills.length).toBeGreaterThan(0)
      }
    })

    it('provides appropriate recommendations based on score', async () => {
      const result = await parseResumeAndScore('candidate-123', 'job-456')
      const recommendation = result.data.score.recommendations[0]
      
      expect(typeof recommendation).toBe('string')
      expect(recommendation).toMatch(/Strong candidate|Good candidate|Skills gap/)
    })

    it('simulates realistic processing delay', async () => {
      const startTime = Date.now()
      await parseResumeAndScore('candidate-123', 'job-456')
      const endTime = Date.now()
      
      expect(endTime - startTime).toBeGreaterThanOrEqual(1000)
      expect(endTime - startTime).toBeLessThan(4000)
    })
  })

  describe('submitJobApplication', () => {
    const mockApplicationData = {
      candidateData: {
        name: 'John Doe',
        email: 'john@example.com',
        phone: '+1234567890',
      },
      resumeFile: {
        fileName: 'resume.pdf',
        content: 'base64content',
        mimeType: 'application/pdf' as const,
        tags: ['frontend', 'web-development'],
      },
    }

    it('calls the correct test endpoint', async () => {
      const mockResponse = {
        success: true,
        data: {
          applicationId: 'app-123',
          candidateId: 'candidate-456',
          status: 'under_review',
          nextSteps: 'We will review your application',
        },
        metadata: {
          processingTimeMs: 1000,
          correlationId: 'corr-123',
          timestamp: new Date().toISOString(),
        },
      }

      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      })

      const result = await submitJobApplication('job-123', mockApplicationData)

      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:3001/test/v1/public/jobs/job-123/apply',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(mockApplicationData),
        }
      )

      expect(result).toEqual(mockResponse)
    })

    it('throws JobsApiError on API error response', async () => {
      const mockErrorResponse = {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid email format',
        },
        timestamp: new Date().toISOString(),
        correlationId: 'corr-123',
      }

      ;(global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: () => Promise.resolve(mockErrorResponse),
      })

      await expect(
        submitJobApplication('job-123', mockApplicationData)
      ).rejects.toThrow(JobsApiError)

      await expect(
        submitJobApplication('job-123', mockApplicationData)
      ).rejects.toThrow('Invalid email format')
    })

    it('throws network error on fetch failure', async () => {
      ;(global.fetch as any).mockRejectedValueOnce(new TypeError('Network error'))

      await expect(
        submitJobApplication('job-123', mockApplicationData)
      ).rejects.toThrow(JobsApiError)

      await expect(
        submitJobApplication('job-123', mockApplicationData)
      ).rejects.toThrow('Failed to connect to the API')
    })

    it('handles unknown errors gracefully', async () => {
      ;(global.fetch as any).mockRejectedValueOnce('Unknown error')

      await expect(
        submitJobApplication('job-123', mockApplicationData)
      ).rejects.toThrow(JobsApiError)

      await expect(
        submitJobApplication('job-123', mockApplicationData)
      ).rejects.toThrow('An error occurred while submitting')
    })
  })

  describe('JobsApiError', () => {
    it('creates error with correct properties', () => {
      const error = new JobsApiError('TEST_ERROR', 'Test message', 400)

      expect(error.code).toBe('TEST_ERROR')
      expect(error.message).toBe('Test message')
      expect(error.statusCode).toBe(400)
      expect(error.name).toBe('JobsApiError')
    })

    it('is instance of Error', () => {
      const error = new JobsApiError('TEST_ERROR', 'Test message', 400)

      expect(error instanceof Error).toBe(true)
      expect(error instanceof JobsApiError).toBe(true)
    })
  })
})