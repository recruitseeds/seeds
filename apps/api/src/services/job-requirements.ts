import { Context, Effect, Layer } from 'effect'
import { LoggerService } from './logger.js'
import type { JobRequirements } from './skill-matcher.js'

export interface JobRequirementsService {
  readonly getJobRequirements: (jobId: string) => Effect.Effect<JobRequirements, Error>
  readonly createJobRequirements: (requirements: Omit<JobRequirements, 'id'>) => Effect.Effect<JobRequirements, Error>
  readonly updateJobRequirements: (
    jobId: string,
    requirements: Partial<JobRequirements>
  ) => Effect.Effect<JobRequirements, Error>
}

export const JobRequirementsService = Context.GenericTag<JobRequirementsService>('JobRequirementsService')

const MOCK_JOB_REQUIREMENTS: Record<string, JobRequirements> = {
  'job-123': {
    id: 'job-123',
    title: 'Senior Full Stack Engineer',
    required_skills: ['TypeScript', 'React', 'Node.js', 'PostgreSQL', 'Git'],
    nice_to_have_skills: ['AWS', 'Docker', 'GraphQL', 'Kubernetes', 'Next.js'],
    minimum_experience_years: 5,
    preferred_education_level: ['bachelor', 'master'],
    industry: 'Technology',
    seniority_level: 'senior',
  },
  'job-456': {
    id: 'job-456',
    title: 'Junior Frontend Developer',
    required_skills: ['JavaScript', 'React', 'HTML', 'CSS'],
    nice_to_have_skills: ['TypeScript', 'Vue', 'SASS', 'Webpack'],
    minimum_experience_years: 1,
    preferred_education_level: ['associate', 'bachelor'],
    industry: 'Technology',
    seniority_level: 'junior',
  },
  'job-789': {
    id: 'job-789',
    title: 'DevOps Engineer',
    required_skills: ['AWS', 'Docker', 'Kubernetes', 'Terraform', 'Linux'],
    nice_to_have_skills: ['Python', 'Ansible', 'Jenkins', 'Monitoring', 'Security'],
    minimum_experience_years: 3,
    preferred_education_level: ['bachelor'],
    industry: 'Technology',
    seniority_level: 'mid',
  },
  'job-default': {
    id: 'job-default',
    title: 'Software Engineer',
    required_skills: ['Programming', 'Problem Solving', 'Git'],
    nice_to_have_skills: ['JavaScript', 'Python', 'SQL', 'Agile'],
    minimum_experience_years: 2,
    preferred_education_level: ['bachelor'],
    industry: 'Technology',
    seniority_level: 'mid',
  },
}

const make = Effect.gen(function* () {
  const logger = yield* LoggerService

  return {
    getJobRequirements: (jobId: string) =>
      Effect.gen(function* () {
        yield* logger.debug('Fetching job requirements', { jobId })

        const requirements = MOCK_JOB_REQUIREMENTS[jobId] || MOCK_JOB_REQUIREMENTS['job-default']

        yield* logger.info('Job requirements retrieved', {
          jobId: requirements.id,
          title: requirements.title,
          requiredSkillsCount: requirements.required_skills.length,
          niceToHaveSkillsCount: requirements.nice_to_have_skills.length,
          minimumExperience: requirements.minimum_experience_years,
          seniorityLevel: requirements.seniority_level,
        })

        return requirements
      }),

    createJobRequirements: (requirements: Omit<JobRequirements, 'id'>) =>
      Effect.gen(function* () {
        const id = `job-${Date.now()}`
        const newRequirements: JobRequirements = {
          id,
          ...requirements,
        }

        yield* logger.info('Creating job requirements', {
          jobId: id,
          title: requirements.title,
          requiredSkillsCount: requirements.required_skills.length,
        })

        MOCK_JOB_REQUIREMENTS[id] = newRequirements

        return newRequirements
      }),

    updateJobRequirements: (jobId: string, updates: Partial<JobRequirements>) =>
      Effect.gen(function* () {
        const existing = MOCK_JOB_REQUIREMENTS[jobId]

        if (!existing) {
          return yield* Effect.fail(new Error(`Job requirements not found for job ID: ${jobId}`))
        }

        const updated: JobRequirements = {
          ...existing,
          ...updates,
          id: jobId,
        }

        yield* logger.info('Updating job requirements', {
          jobId,
          updatedFields: Object.keys(updates),
        })

        MOCK_JOB_REQUIREMENTS[jobId] = updated

        return updated
      }),
  } satisfies JobRequirementsService
})

export const JobRequirementsServiceLive = Layer.effect(JobRequirementsService, make)
