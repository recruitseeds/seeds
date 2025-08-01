import { Hono } from 'hono'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { correlationMiddleware } from '../../src/middleware/correlation.js'
import { errorHandler } from '../../src/middleware/error-handler.js'
import { candidatesRoutes } from '../../src/routes/v1/candidates.js'
import { TestDataFactory } from '../fixtures/test-data-factory.js'

vi.mock('../../src/services/ai.js', () => ({
  AIService: {
    pipe: vi.fn(),
    Tag: vi.fn(),
  },
  AIServiceLive: {
    pipe: vi.fn(),
  },
}))

vi.mock('effect', async () => {
  const actual = (await vi.importActual('effect')) as Record<string, unknown> & {
    Effect: Record<string, unknown>
  }
  return {
    ...actual,
    Effect: {
      ...actual.Effect,
      runPromise: vi.fn(),
    },
  }
})

describe('Candidates API Integration Tests', () => {
  let app: Hono

  beforeEach(() => {
    app = new Hono()
    app.use('*', errorHandler())
    app.use('*', correlationMiddleware())
    app.route('/candidates', candidatesRoutes)

    vi.clearAllMocks()
  })

  describe('POST /candidates/:id/parse-resume', () => {
    it('should successfully parse a strong resume', async () => {
      const requestData = TestDataFactory.createParseResumeRequest({
        fileContent: TestDataFactory.createResumeContent('strong'),
      })

      const { Effect } = await import('effect')
      vi.mocked(Effect.runPromise).mockResolvedValue({
        success: true,
        data: {
          parsedData: TestDataFactory.createStrongEngineerResume(),
          score: {
            candidateId: requestData.candidateId,
            jobId: requestData.jobId,
            overallScore: 85,
            requiredSkillsScore: 90,
            experienceScore: 80,
            educationScore: 85,
            skillMatches: [],
            missingRequiredSkills: [],
            recommendations: [],
          },
        },
        metadata: {
          processingTimeMs: 1500,
          correlationId: expect.any(String),
          timestamp: expect.any(String),
        },
      })

      const response = await app.request('/candidates/candidate-123/parse-resume', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestData),
      })

      expect(response.status).toBe(200)
      const body = await response.json()

      expect(body.success).toBe(true)
      expect(body.data.parsedData.personalInfo.name).toBe('Sarah Johnson')
      expect(body.data.parsedData.skills).toContain('TypeScript')
      expect(body.data.parsedData.skills).toContain('React')
      expect(body.metadata.correlationId).toBeDefined()
      expect(response.headers.get('x-correlation-id')).toBeDefined()
    })

    it('should handle AI service failures gracefully', async () => {
      const requestData = TestDataFactory.createParseResumeRequest()

      const { Effect } = await import('effect')
      vi.mocked(Effect.runPromise).mockRejectedValue(new Error('AI service unavailable'))

      const response = await app.request('/candidates/candidate-123/parse-resume', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestData),
      })

      expect(response.status).toBe(503)
      const body = await response.json()

      expect(body.success).toBe(false)
      expect(body.error.code).toBe('AI_SERVICE_ERROR')
      expect(body.error.message).toBe('AI service temporarily unavailable')
      expect(body.correlationId).toBeDefined()
    })

    it('should validate request payload', async () => {
      const invalidRequest = {
        candidateId: 'candidate-123',
      }

      const response = await app.request('/candidates/candidate-123/parse-resume', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(invalidRequest),
      })

      expect(response.status).toBe(400)
      const body = await response.json()

      expect(body.success).toBe(false)
      expect(body.error.code).toBe('VALIDATION_ERROR')
    })

    it('should include performance metrics in response', async () => {
      const requestData = TestDataFactory.createParseResumeRequest()

      const { Effect } = await import('effect')
      vi.mocked(Effect.runPromise).mockResolvedValue({
        success: true,
        data: {
          parsedData: TestDataFactory.createStrongEngineerResume(),
          score: expect.any(Object),
        },
        metadata: {
          processingTimeMs: 2500,
          correlationId: 'test-correlation-id',
          timestamp: new Date().toISOString(),
        },
      })

      const response = await app.request('/candidates/candidate-123/parse-resume', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestData),
      })

      expect(response.status).toBe(200)
      const body = await response.json()

      expect(body.metadata.processingTimeMs).toBe(2500)
      expect(body.metadata.correlationId).toBe('test-correlation-id')
      expect(body.metadata.timestamp).toBeDefined()
    })

    it('should handle large resume files', async () => {
      const largeContent = 'x'.repeat(100000)
      const requestData = TestDataFactory.createParseResumeRequest({
        fileContent: largeContent,
        fileName: 'large-resume.txt',
      })

      const { Effect } = await import('effect')
      vi.mocked(Effect.runPromise).mockResolvedValue({
        success: true,
        data: {
          parsedData: TestDataFactory.createStrongEngineerResume(),
          score: expect.any(Object),
        },
        metadata: expect.any(Object),
      })

      const response = await app.request('/candidates/candidate-123/parse-resume', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestData),
      })

      expect(response.status).toBe(200)
      const body = await response.json()

      expect(body.success).toBe(true)
    })
  })

  describe('Error handling middleware', () => {
    it('should return 404 for non-existent endpoints', async () => {
      const response = await app.request('/candidates/non-existent')

      expect(response.status).toBe(404)
      const body = await response.json()

      expect(body.success).toBe(false)
      expect(body.error.code).toBe('NOT_FOUND')
      expect(body.correlationId).toBeDefined()
    })

    it('should include correlation ID in all error responses', async () => {
      const response = await app.request('/candidates/invalid/parse-resume', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ invalid: 'data' }),
      })

      expect(response.headers.get('x-correlation-id')).toBeDefined()
      const body = await response.json()
      expect(body.correlationId).toBeDefined()
    })
  })
})
