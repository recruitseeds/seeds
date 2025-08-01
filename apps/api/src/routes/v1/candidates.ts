import { createRoute, z } from '@hono/zod-openapi'
import { Effect, Layer, pipe } from 'effect'

import { ErrorResponseSchema, MetadataSchema, createOpenAPIApp } from '../../lib/openapi.js'
import { AIService, AIServiceLive } from '../../services/ai.js'
import { ConfigServiceLive } from '../../services/config.js'
import { FileParserServiceLive } from '../../services/file-parser.js'
import { JobRequirementsService, JobRequirementsServiceLive } from '../../services/job-requirements.js'
import { LoggerService, LoggerServiceBasic } from '../../services/logger.js'
import { ResumeParsingEvents } from '../../services/posthog.js'
import { SkillMatcherService, SkillMatcherServiceLive } from '../../services/skill-matcher.js'

const candidatesRoutes = createOpenAPIApp()

const PersonalInfoSchema = z.object({
  name: z.string(),
  email: z.string().optional(),
  phone: z.string().optional(),
  location: z.string().optional(),
  linkedinUrl: z.string().optional(),
  githubUrl: z.string().optional(),
  portfolioUrl: z.string().optional(),
})

const ExperienceSchema = z.object({
  company: z.string(),
  position: z.string(),
  startDate: z.string(),
  endDate: z.string().optional(),
  description: z.string(),
  skills: z.array(z.string()),
  location: z.string().optional(),
})

const EducationSchema = z.object({
  institution: z.string(),
  degree: z.string(),
  field: z.string(),
  graduationDate: z.string().optional(),
  gpa: z.string().optional(),
})

const ProjectSchema = z.object({
  name: z.string(),
  description: z.string(),
  technologies: z.array(z.string()),
  url: z.string().optional(),
  githubUrl: z.string().optional(),
})

const CertificationSchema = z.object({
  name: z.string(),
  issuer: z.string(),
  issueDate: z.string().optional(),
  expirationDate: z.string().optional(),
  credentialId: z.string().optional(),
  url: z.string().optional(),
})

const ParsedResumeDataSchema = z.object({
  personalInfo: PersonalInfoSchema,
  summary: z.string().optional(),
  experience: z.array(ExperienceSchema),
  education: z.array(EducationSchema),
  skills: z.array(z.string()),
  projects: z.array(ProjectSchema),
  certifications: z.array(CertificationSchema),
  languages: z.array(z.string()),
})

const SkillMatchSchema = z.object({
  skill: z.string(),
  found: z.boolean(),
  confidence: z.number().min(0).max(1),
  context: z.string().optional(),
})

const CandidateScoreSchema = z.object({
  candidateId: z.string(),
  jobId: z.string(),
  overallScore: z.number().min(0).max(100),
  requiredSkillsScore: z.number().min(0).max(100),
  experienceScore: z.number().min(0).max(100),
  educationScore: z.number().min(0).max(100),
  skillMatches: z.array(SkillMatchSchema),
  missingRequiredSkills: z.array(z.string()),
  recommendations: z.array(z.string()),
})

const ParseResumeRequestSchema = z.object({
  candidateId: z.string().describe('Unique identifier for the candidate'),
  jobId: z.string().describe('Job posting ID to match against'),
  fileContent: z.string().describe('Base64 encoded resume content or plain text'),
  fileName: z.string().describe('Original filename of the resume'),
})

const ParseResumeResponseSchema = z.object({
  success: z.literal(true),
  data: z.object({
    parsedData: ParsedResumeDataSchema,
    score: CandidateScoreSchema,
  }),
  metadata: MetadataSchema,
})

const parseResumeRoute = createRoute({
  method: 'post',
  path: '/{id}/parse-resume',
  tags: ['Candidates'],
  summary: 'Parse resume and calculate skill match score',
  description: `
    Parse a candidate's resume using AI and calculate their skill match score against a job posting.
    
    This endpoint:
    - Extracts structured data from resume text using OpenAI GPT-4
    - Identifies skills, experience, education, projects, and certifications
    - Finds hidden links like GitHub profiles in resume text
    - Compares candidate skills against job requirements
    - Calculates weighted scores for overall fit
    - Generates hiring recommendations
    - Tracks performance metrics and business events
  `,
  request: {
    params: z.object({
      id: z.string().describe('Candidate ID'),
    }),
    body: {
      content: {
        'application/json': {
          schema: ParseResumeRequestSchema,
        },
      },
    },
  },
  responses: {
    200: {
      content: {
        'application/json': {
          schema: ParseResumeResponseSchema,
        },
      },
      description: 'Resume parsed successfully with skill matching results',
    },
    400: {
      content: {
        'application/json': {
          schema: ErrorResponseSchema,
        },
      },
      description: 'Invalid request data',
    },
    503: {
      content: {
        'application/json': {
          schema: ErrorResponseSchema,
        },
      },
      description: 'AI service temporarily unavailable',
    },
    500: {
      content: {
        'application/json': {
          schema: ErrorResponseSchema,
        },
      },
      description: 'Internal server error',
    },
  },
})

candidatesRoutes.openapi(parseResumeRoute, async (c) => {
  const candidateId = c.req.param('id')
  const body = c.req.valid('json')
  const correlationId = c.get('correlationId') || 'unknown'
  const requestId = c.get('requestId') || 'unknown'

  const program = Effect.gen(function* () {
    const baseLogger = yield* LoggerService
    const logger = baseLogger.withCorrelationId(correlationId).withRequestId(requestId)

    const aiService = yield* AIService
    const jobRequirementsService = yield* JobRequirementsService
    const skillMatcher = yield* SkillMatcherService

    const getTimer = yield* logger.startTimer()

    yield* logger.info('Starting resume parse request', {
      candidateId,
      jobId: body.jobId,
      fileName: body.fileName,
      fileSizeBytes: body.fileContent.length,
    })

    // Capture business event
    yield* logger.captureEvent(ResumeParsingEvents.RESUME_PARSE_STARTED, {
      candidateId,
      jobId: body.jobId,
      fileName: body.fileName,
      fileSizeBytes: body.fileContent.length,
    })

    try {
      const parsedData = yield* pipe(aiService.parseResume(body.fileContent, body.fileName), Effect.timeout(30000))

      const parseTime = getTimer()

      yield* logger.info('AI parsing completed successfully', {
        candidateId,
        fileName: body.fileName,
        skillsExtracted: parsedData.skills.length,
        experienceEntries: parsedData.experience.length,
        educationEntries: parsedData.education.length,
        projectsFound: parsedData.projects.length,
        certificationsFound: parsedData.certifications.length,
        processingTimeMs: parseTime,
      })

      const jobRequirements = yield* jobRequirementsService.getJobRequirements(body.jobId)

      yield* logger.info('Job requirements retrieved', {
        jobId: body.jobId,
        jobTitle: jobRequirements.title,
        requiredSkillsCount: jobRequirements.required_skills.length,
        niceToHaveSkillsCount: jobRequirements.nice_to_have_skills.length,
      })

      let score = yield* skillMatcher.calculateCandidateScore(parsedData, jobRequirements)

      score = { ...score, candidateId }

      const recommendations = yield* skillMatcher.generateRecommendations(parsedData, score, jobRequirements)

      score = { ...score, recommendations }

      const shouldAutoReject = yield* skillMatcher.shouldAutoReject(score, jobRequirements)

      if (shouldAutoReject) {
        yield* logger.captureEvent(ResumeParsingEvents.CANDIDATE_AUTO_REJECTED, {
          candidateId,
          jobId: body.jobId,
          overallScore: score.overallScore,
          requiredSkillsScore: score.requiredSkillsScore,
          missingRequiredSkills: score.missingRequiredSkills,
        })
      }

      const totalTime = getTimer()

      yield* logger.info('Resume parsing workflow completed', {
        candidateId,
        jobId: body.jobId,
        totalProcessingTimeMs: totalTime,
        overallScore: score.overallScore,
        shouldAutoReject,
        success: true,
      })

      yield* logger.captureEvent(ResumeParsingEvents.RESUME_PARSE_COMPLETED, {
        candidateId,
        jobId: body.jobId,
        skillsExtracted: parsedData.skills.length,
        experienceEntries: parsedData.experience.length,
        totalProcessingTimeMs: totalTime,
        overallScore: score.overallScore,
        requiredSkillsScore: score.requiredSkillsScore,
        shouldAutoReject,
      })

      yield* logger.captureEvent(ResumeParsingEvents.SKILL_MATCHING_COMPLETED, {
        candidateId,
        jobId: body.jobId,
        overallScore: score.overallScore,
        requiredSkillsScore: score.requiredSkillsScore,
        missingRequiredSkillsCount: score.missingRequiredSkills.length,
        recommendationsCount: score.recommendations.length,
      })

      return {
        success: true as const,
        data: {
          parsedData: {
            ...parsedData,
            skills: [...parsedData.skills],
            experience: parsedData.experience.map((exp) => ({
              ...exp,
              skills: [...exp.skills],
            })),
            education: [...parsedData.education],
            projects: parsedData.projects.map((proj) => ({
              ...proj,
              technologies: [...proj.technologies],
            })),
            certifications: [...parsedData.certifications],
            languages: [...parsedData.languages],
          },
          score: {
            ...score,
            skillMatches: [...score.skillMatches],
            missingRequiredSkills: [...score.missingRequiredSkills],
            recommendations: [...score.recommendations],
          },
        },
        metadata: {
          processingTimeMs: totalTime,
          correlationId,
          timestamp: new Date().toISOString(),
        },
      }
    } catch (parseError) {
      const processingTime = getTimer()

      yield* logger.error('Resume parsing failed', parseError, {
        candidateId,
        fileName: body.fileName,
        processingTimeMs: processingTime,
        errorType: parseError instanceof Error ? parseError.constructor.name : 'Unknown',
      })

      // Capture failure event
      yield* logger.captureEvent(ResumeParsingEvents.RESUME_PARSE_FAILED, {
        candidateId,
        jobId: body.jobId,
        fileName: body.fileName,
        processingTimeMs: processingTime,
        errorType: parseError instanceof Error ? parseError.constructor.name : 'Unknown',
        errorMessage: parseError instanceof Error ? parseError.message : String(parseError),
      })

      return yield* Effect.fail(parseError)
    }
  })

  // Use simplified layer setup for this endpoint
  const MainLayer = Layer.mergeAll(
    ConfigServiceLive,
    LoggerServiceBasic,
    FileParserServiceLive,
    JobRequirementsServiceLive,
    SkillMatcherServiceLive,
    AIServiceLive
  )

  try {
    const result = await Effect.runPromise(
      // @ts-expect-error Effect type inference issue with complex service dependencies
      pipe(program, Effect.provide(MainLayer))
    )
    return c.json(result as typeof result, 200)
  } catch (error) {
    console.error('Candidate parsing error:', error)
    return c.json(
      {
        success: false as const,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An internal error occurred during resume parsing',
          details: error instanceof Error ? error.message : String(error),
        },
        timestamp: new Date().toISOString(),
        correlationId,
      },
      500
    )
  }
})

export { candidatesRoutes }
