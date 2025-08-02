import { Hono } from 'hono'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { correlationMiddleware } from '../../src/middleware/correlation.js'
import { errorHandler } from '../../src/middleware/error-handler.js'
import { candidatesRoutes } from '../../src/routes/v1/candidates.js'
import { TestDataFactory } from '../fixtures/test-data-factory.js'

vi.mock('../../src/services/ai.js', () => ({
  AIService: vi.fn().mockImplementation(() => ({
    parseResume: vi.fn().mockResolvedValue({
      personalInfo: { name: 'John Doe', email: 'john@example.com' },
      skills: ['JavaScript', 'React', 'Node.js'],
      experience: [],
      education: [],
      projects: [],
      certifications: [],
      languages: [],
    })
  }))
}))

vi.mock('../../src/services/candidate-scoring.js', () => ({
  CandidateScoringService: vi.fn().mockImplementation(() => ({
    saveScore: vi.fn().mockResolvedValue('test-score-id')
  }))
}))

vi.mock('../../src/services/job-requirements.js', () => ({
  JobRequirementsService: vi.fn().mockImplementation(() => ({
    getJobRequirements: vi.fn().mockResolvedValue({
      title: 'Software Engineer',
      required_skills: ['JavaScript', 'React'],
      nice_to_have_skills: ['TypeScript'],
      minimum_experience_years: 3,
      auto_rejection_criteria: { minimum_overall_score: 70 }
    })
  }))
}))

vi.mock('../../src/services/skill-matcher.js', () => ({
  SkillMatcherService: vi.fn().mockImplementation(() => ({
    calculateCandidateScore: vi.fn().mockReturnValue({
      jobId: 'job-456',
      overallScore: 85,
      requiredSkillsScore: 90,
      experienceScore: 80,
      educationScore: 85,
      skillMatches: [],
      missingRequiredSkills: [],
    }),
    generateRecommendations: vi.fn().mockReturnValue(['Good candidate']),
    shouldAutoReject: vi.fn().mockReturnValue(false)
  }))
}))

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

      const response = await app.request('/candidates/candidate-123/parse-resume', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      })

      expect(response.status).toBe(200)
      const body = await response.json()

      expect(body.success).toBe(true)
      expect(body.data.parsedData).toBeDefined()
      expect(body.data.score).toBeDefined()
      expect(body.metadata.processingTimeMs).toBeGreaterThan(0)
      expect(body.metadata.correlationId).toBeDefined()
    })

    it('should handle AI service failures gracefully', async () => {
      const requestData = TestDataFactory.createParseResumeRequest()

      const response = await app.request('/candidates/candidate-123/parse-resume', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      })

      expect(response.status).toBe(503)
      const body = await response.json()

      expect(body.success).toBe(false)
      expect(body.error.code).toBe('AI_SERVICE_UNAVAILABLE')
    })

    it('should validate request payload', async () => {
      const response = await app.request('/candidates/candidate-123/parse-resume', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          invalidField: 'test',
        }),
      })

      expect(response.status).toBe(400)
      const body = await response.json()

      expect(body.success).toBe(false)
      expect(body.error.code).toBe('VALIDATION_ERROR')
    })

    it('should include performance metrics in response', async () => {
      const requestData = TestDataFactory.createParseResumeRequest({
        fileContent: TestDataFactory.createResumeContent('average'),
      })

      const response = await app.request('/candidates/candidate-123/parse-resume', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      })

      expect(response.status).toBe(200)
      const body = await response.json()

      expect(body.metadata).toHaveProperty('processingTimeMs')
      expect(body.metadata).toHaveProperty('correlationId')
      expect(body.metadata).toHaveProperty('timestamp')
      expect(body.metadata.processingTimeMs).toBeGreaterThan(0)
    })

    it('should handle large resume files', async () => {
      const largeContent = 'A'.repeat(100000)
      const requestData = TestDataFactory.createParseResumeRequest({
        fileContent: largeContent,
        fileName: 'large-resume.txt',
      })

      const response = await app.request('/candidates/candidate-123/parse-resume', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      })

      expect(response.status).toBe(200)
      const body = await response.json()

      expect(body.success).toBe(true)
      expect(body.metadata.processingTimeMs).toBeGreaterThan(0)
    })
  })

  describe('Error handling middleware', () => {
    it('should return 404 for non-existent endpoints', async () => {
      const response = await app.request('/candidates/nonexistent', {
        method: 'POST',
      })

      expect(response.status).toBe(404)
      const body = await response.json()

      expect(body.success).toBe(false)
      expect(body.error.code).toBe('NOT_FOUND')
    })

    it('should include correlation ID in all error responses', async () => {
      const response = await app.request('/candidates/candidate-123/parse-resume', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      })

      expect(response.headers.get('x-correlation-id')).toBeDefined()
      const body = await response.json()
      expect(body.correlationId).toBeDefined()
    })
  })
})