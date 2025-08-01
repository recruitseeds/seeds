import { createOpenAI } from '@ai-sdk/openai'
import { generateObject } from 'ai'
import { Context, Effect, Layer } from 'effect'
import { z } from 'zod'
import type { ParsedResumeData } from '../types/resume.js'
import { ConfigService } from './config.js'
import { FileParserService } from './file-parser.js'
import { LoggerService } from './logger.js'

export interface AIService {
  readonly parseResume: (content: string, fileName: string) => Effect.Effect<ParsedResumeData, Error>
}

export const AIService = Context.GenericTag<AIService>('AIService')

const resumeParsingPrompt = `
You are an expert resume parser. Extract structured information from the provided resume text.

Focus on:
1. Personal information (name, contact details, social profiles)
2. Professional experience with skills mentioned
3. Education background
4. Technical skills (be comprehensive)
5. Projects with technologies used
6. Certifications
7. Languages spoken

For URLs/links:
- Look for hidden links in text (e.g., "GitHub" might be a link to their profile)
- Extract actual URLs when available
- Infer likely URLs from context (e.g., GitHub username)

For skills:
- Extract both explicitly mentioned skills and inferred skills from experience
- Include programming languages, frameworks, tools, methodologies
- Normalize skill names (e.g., "React.js" -> "React")

Be thorough but accurate. If information is unclear or missing, omit rather than guess.
`

const resumeSchema = z.object({
  personalInfo: z.object({
    name: z.string(),
    email: z.string().optional(),
    phone: z.string().optional(),
    location: z.string().optional(),
    linkedinUrl: z.string().optional(),
    githubUrl: z.string().optional(),
    portfolioUrl: z.string().optional(),
  }),
  summary: z.string().optional(),
  experience: z.array(
    z.object({
      company: z.string(),
      position: z.string(),
      startDate: z.string(),
      endDate: z.string().optional(),
      description: z.string(),
      skills: z.array(z.string()),
      location: z.string().optional(),
    })
  ),
  education: z.array(
    z.object({
      institution: z.string(),
      degree: z.string(),
      field: z.string(),
      graduationDate: z.string().optional(),
      gpa: z.string().optional(),
    })
  ),
  skills: z.array(z.string()),
  projects: z.array(
    z.object({
      name: z.string(),
      description: z.string(),
      technologies: z.array(z.string()),
      url: z.string().optional(),
      githubUrl: z.string().optional(),
    })
  ),
  certifications: z.array(
    z.object({
      name: z.string(),
      issuer: z.string(),
      issueDate: z.string().optional(),
      expirationDate: z.string().optional(),
      credentialId: z.string().optional(),
      url: z.string().optional(),
    })
  ),
  languages: z.array(z.string()),
})

const make = Effect.gen(function* () {
  const config = yield* ConfigService
  const logger = yield* LoggerService
  const fileParser = yield* FileParserService

  const client = createOpenAI({
    apiKey: config.openaiApiKey,
  })

  return {
    parseResume: (content: string, fileName: string) =>
      Effect.gen(function* () {
        yield* logger.info('Starting resume parsing', { fileName })

        const fileBuffer = Buffer.from(content, 'base64')
        const textContent = yield* fileParser.parseFile(fileBuffer, fileName)

        const result = yield* Effect.tryPromise({
          try: () =>
            generateObject({
              model: client('gpt-4o'),
              prompt: `${resumeParsingPrompt}\n\nResume content:\n${textContent}`,
              schema: resumeSchema,
            }),
          catch: (error) => new Error(`Failed to parse resume: ${error}`),
        })

        yield* logger.info('Resume parsing completed', {
          fileName,
          skillsFound: result.object.skills.length,
          experienceCount: result.object.experience.length,
        })

        return result.object as ParsedResumeData
      }),
  } satisfies AIService
})

export const AIServiceLive = Layer.effect(AIService, make)
