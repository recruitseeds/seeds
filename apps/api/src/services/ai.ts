import type { ParsedResumeData } from '../types/resume.js'
import { ConfigService } from './config.js'
import type { Logger } from './logger.js'
import { UrlExtractorService } from './url-extractor.js'

export class AIService {
  private config: ReturnType<typeof ConfigService.prototype.getConfig>
  private logger: Logger
  private urlExtractor: UrlExtractorService

  constructor(logger: Logger) {
    this.config = ConfigService.getInstance().getConfig()
    this.logger = logger
    this.urlExtractor = new UrlExtractorService(logger)
  }

  async parseResume(fileContent: string, fileName: string, annotationLinks: string[] = []): Promise<ParsedResumeData> {
    const startTime = Date.now()

    this.logger.info('Starting resume parsing with AI', {
      fileName,
      contentLength: fileContent.length,
      annotationLinksCount: annotationLinks.length,
    })

    const systemPrompt = `You are an expert resume parser. Extract structured data from the resume text provided.

Return a JSON object with the following structure:
{
  "personalInfo": {
    "name": "Full name",
    "email": "email@example.com",
    "phone": "+1-555-0123",
    "location": "City, State",
    "linkedinUrl": "https:
    "githubUrl": "https:
    "portfolioUrl": "https:
  },
  "summary": "Professional summary",
  "experience": [
    {
      "company": "Company Name",
      "position": "Job Title",
      "startDate": "2021-03",
      "endDate": "2024-01",
      "description": "Job description",
      "skills": ["React", "TypeScript"],
      "location": "City, State"
    }
  ],
  "education": [
    {
      "institution": "University Name",
      "degree": "Bachelor of Science",
      "field": "Computer Science",
      "graduationDate": "2019-05",
      "gpa": "3.8"
    }
  ],
  "skills": ["React", "TypeScript", "Node.js"],
  "projects": [
    {
      "name": "Project Name",
      "description": "Project description",
      "technologies": ["React", "Node.js"],
      "url": "https:
      "githubUrl": "https:
    }
  ],
  "certifications": [
    {
      "name": "AWS Solutions Architect",
      "issuer": "Amazon Web Services",
      "issueDate": "2023-05",
      "expirationDate": "2026-05",
      "credentialId": "AWS-ASA-123456"
    }
  ],
  "languages": ["English", "Spanish"]
}

Extract only information that is explicitly mentioned in the resume. If information is not available, omit the field or use null.`

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.config.openaiApiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: `Parse this resume:\n\n${fileContent}` },
          ],
          temperature: 0.1,
          max_tokens: 2000,
        }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`OpenAI API error: ${response.status} ${errorText}`)
      }

      const result = (await response.json()) as {
        choices: Array<{ message: { content: string } }>
        usage?: { total_tokens: number }
      }
      const content = result.choices[0]?.message?.content

      if (!content) {
        throw new Error('No content received from OpenAI')
      }

      const cleanContent = content
        .replace(/```json\n?/, '')
        .replace(/\n?```$/, '')
        .trim()
      const parsedData = JSON.parse(cleanContent) as ParsedResumeData

      const extractedUrls = this.urlExtractor.extractUrls(fileContent, annotationLinks)
      if (parsedData.personalInfo) {
        if (extractedUrls.linkedinUrl) {
          parsedData.personalInfo.linkedinUrl = extractedUrls.linkedinUrl
        }
        if (extractedUrls.githubUrl) {
          parsedData.personalInfo.githubUrl = extractedUrls.githubUrl
        }
        if (extractedUrls.portfolioUrl) {
          parsedData.personalInfo.portfolioUrl = extractedUrls.portfolioUrl
        }
      }

      if (extractedUrls.otherLinks.length > 0 && parsedData.projects) {
        for (const project of parsedData.projects) {
          const matchingUrls = extractedUrls.otherLinks.filter(
            (url) => project.name && url.toLowerCase().includes(project.name.toLowerCase().replace(/\s/g, ''))
          )
          if (matchingUrls.length > 0 && !project.url) {
            project.url = matchingUrls[0]
          }
        }
      }

      const processingTime = Date.now() - startTime

      this.logger.info('Resume parsing completed successfully', {
        fileName,
        processingTimeMs: processingTime,
        skillsCount: parsedData.skills?.length || 0,
        experienceCount: parsedData.experience?.length || 0,
        educationCount: parsedData.education?.length || 0,
        projectsCount: parsedData.projects?.length || 0,
        certificationsCount: parsedData.certifications?.length || 0,
        tokensUsed: result.usage?.total_tokens || 0,
        extractedUrlsCount: {
          linkedin: !!extractedUrls.linkedinUrl,
          github: !!extractedUrls.githubUrl,
          portfolio: !!extractedUrls.portfolioUrl,
          other: extractedUrls.otherLinks.length,
        },
      })

      return parsedData
    } catch (error) {
      const processingTime = Date.now() - startTime

      this.logger.error('Resume parsing failed', error, {
        fileName,
        processingTimeMs: processingTime,
        errorType: error instanceof Error ? error.constructor.name : 'Unknown',
      })

      throw error
    }
  }
}
