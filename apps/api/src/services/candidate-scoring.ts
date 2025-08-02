import { createClient, SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '../../../../packages/supabase/types/db.js'
import { ConfigService } from './config.js'
import { Logger } from './logger.js'

export interface CandidateScore {
  candidateId: string
  jobId: string
  overallScore: number
  requiredSkillsScore: number
  experienceScore: number
  educationScore: number
  skillMatches: Array<{
    skill: string
    found: boolean
    confidence: number
    context?: string
  }>
  missingRequiredSkills: string[]
  recommendations: string[]
  id?: string
  createdAt?: string
}

export interface CandidateScoreMetadata {
  fileId?: string
  processingTimeMs: number
  correlationId: string
  aiModelVersion?: string
  autoRejected?: boolean
  autoRejectionReason?: string
}

export class CandidateScoringService {
  private supabase: SupabaseClient<Database>
  private logger: Logger

  constructor(logger: Logger) {
    const config = ConfigService.getInstance().getConfig()
    this.supabase = createClient<Database>(config.supabaseUrl, config.supabaseServiceRoleKey)
    this.logger = logger
  }

  async saveScore(score: CandidateScore, metadata: CandidateScoreMetadata): Promise<string> {
    this.logger.debug('Saving candidate score to database', {
      candidateId: score.candidateId,
      jobId: score.jobId,
      overallScore: score.overallScore,
      correlationId: metadata.correlationId,
    })

    try {
      const { data, error } = await this.supabase
        .from('candidate_skill_scores')
        .upsert({
          candidate_id: score.candidateId,
          job_posting_id: score.jobId,
          file_id: metadata.fileId || null,
          overall_score: score.overallScore,
          required_skills_score: score.requiredSkillsScore,
          experience_score: score.experienceScore,
          education_score: score.educationScore,
          skill_matches: score.skillMatches,
          missing_required_skills: score.missingRequiredSkills,
          recommendations: score.recommendations,
          processing_time_ms: metadata.processingTimeMs,
          ai_model_version: metadata.aiModelVersion || 'gpt-4o',
          correlation_id: metadata.correlationId,
          auto_rejected: metadata.autoRejected || false,
          auto_rejection_reason: metadata.autoRejectionReason || null,
        })
        .select('id')
        .single()

      if (error) {
        this.logger.error('Failed to save candidate score', error, {
          candidateId: score.candidateId,
          jobId: score.jobId,
          correlationId: metadata.correlationId,
        })
        throw new Error(`Failed to save candidate score: ${error.message}`)
      }

      this.logger.info('Candidate score saved successfully', {
        scoreId: data.id,
        candidateId: score.candidateId,
        jobId: score.jobId,
        overallScore: score.overallScore,
        correlationId: metadata.correlationId,
      })

      return data.id
    } catch (error) {
      this.logger.error('Unexpected error saving candidate score', error, {
        candidateId: score.candidateId,
        jobId: score.jobId,
        correlationId: metadata.correlationId,
      })
      throw error
    }
  }

  async getScore(candidateId: string, jobPostingId: string): Promise<CandidateScore | null> {
    try {
      const { data, error } = await this.supabase
        .from('candidate_skill_scores')
        .select('*')
        .eq('candidate_id', candidateId)
        .eq('job_posting_id', jobPostingId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (error) {
        throw new Error(`Failed to get candidate score: ${error.message}`)
      }

      if (!data) {
        return null
      }

      return {
        candidateId: data.candidate_id,
        jobId: data.job_posting_id,
        overallScore: data.overall_score,
        requiredSkillsScore: data.required_skills_score,
        experienceScore: data.experience_score,
        educationScore: data.education_score,
        skillMatches: data.skill_matches as CandidateScore['skillMatches'],
        missingRequiredSkills: data.missing_required_skills as string[],
        recommendations: data.recommendations as string[],
        id: data.id,
        createdAt: data.created_at || undefined,
      }
    } catch (error) {
      this.logger.error('Failed to retrieve candidate score', error)
      throw error
    }
  }

  async getCandidateScores(candidateId: string): Promise<CandidateScore[]> {
    try {
      const { data, error } = await this.supabase
        .from('candidate_skill_scores')
        .select('*')
        .eq('candidate_id', candidateId)
        .order('created_at', { ascending: false })

      if (error) {
        throw new Error(`Failed to get candidate scores: ${error.message}`)
      }

      return data.map((row) => ({
        candidateId: row.candidate_id,
        jobId: row.job_posting_id,
        overallScore: row.overall_score,
        requiredSkillsScore: row.required_skills_score,
        experienceScore: row.experience_score,
        educationScore: row.education_score,
        skillMatches: row.skill_matches as CandidateScore['skillMatches'],
        missingRequiredSkills: row.missing_required_skills as string[],
        recommendations: row.recommendations as string[],
      }))
    } catch (error) {
      this.logger.error('Failed to retrieve candidate scores', error)
      throw error
    }
  }

  async getJobScores(
    jobPostingId: string,
    options?: {
      minScore?: number
      autoRejectedOnly?: boolean
      limit?: number
    }
  ): Promise<CandidateScore[]> {
    try {
      let query = this.supabase
        .from('candidate_skill_scores')
        .select('*')
        .eq('job_posting_id', jobPostingId)

      if (options?.minScore !== undefined) {
        query = query.gte('overall_score', options.minScore)
      }

      if (options?.autoRejectedOnly) {
        query = query.eq('auto_rejected', true)
      }

      if (options?.limit) {
        query = query.limit(options.limit)
      }

      query = query.order('overall_score', { ascending: false })

      const { data, error } = await query

      if (error) {
        throw new Error(`Failed to get job scores: ${error.message}`)
      }

      return data.map((row) => ({
        candidateId: row.candidate_id,
        jobId: row.job_posting_id,
        overallScore: row.overall_score,
        requiredSkillsScore: row.required_skills_score,
        experienceScore: row.experience_score,
        educationScore: row.education_score,
        skillMatches: row.skill_matches as CandidateScore['skillMatches'],
        missingRequiredSkills: row.missing_required_skills as string[],
        recommendations: row.recommendations as string[],
      }))
    } catch (error) {
      this.logger.error('Failed to retrieve job scores', error)
      throw error
    }
  }
}