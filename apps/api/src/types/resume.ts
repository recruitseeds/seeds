import { Schema } from '@effect/schema'

export const Experience = Schema.Struct({
  company: Schema.String,
  position: Schema.String,
  startDate: Schema.String,
  endDate: Schema.optional(Schema.String),
  description: Schema.String,
  skills: Schema.Array(Schema.String),
  location: Schema.optional(Schema.String)
})

export const Education = Schema.Struct({
  institution: Schema.String,
  degree: Schema.String,
  field: Schema.String,
  graduationDate: Schema.optional(Schema.String),
  gpa: Schema.optional(Schema.String)
})

export const Project = Schema.Struct({
  name: Schema.String,
  description: Schema.String,
  technologies: Schema.Array(Schema.String),
  url: Schema.optional(Schema.String),
  githubUrl: Schema.optional(Schema.String)
})

export const Certification = Schema.Struct({
  name: Schema.String,
  issuer: Schema.String,
  issueDate: Schema.optional(Schema.String),
  expirationDate: Schema.optional(Schema.String),
  credentialId: Schema.optional(Schema.String),
  url: Schema.optional(Schema.String)
})

export const ParsedResumeData = Schema.Struct({
  personalInfo: Schema.Struct({
    name: Schema.String,
    email: Schema.optional(Schema.String),
    phone: Schema.optional(Schema.String),
    location: Schema.optional(Schema.String),
    linkedinUrl: Schema.optional(Schema.String),
    githubUrl: Schema.optional(Schema.String),
    portfolioUrl: Schema.optional(Schema.String)
  }),
  summary: Schema.optional(Schema.String),
  experience: Schema.Array(Experience),
  education: Schema.Array(Education),
  skills: Schema.Array(Schema.String),
  projects: Schema.Array(Project),
  certifications: Schema.Array(Certification),
  languages: Schema.Array(Schema.String)
})

export const SkillMatch = Schema.Struct({
  skill: Schema.String,
  found: Schema.Boolean,
  confidence: Schema.Number,
  context: Schema.optional(Schema.String)
})

export const CandidateScore = Schema.Struct({
  candidateId: Schema.String,
  jobId: Schema.String,
  overallScore: Schema.Number,
  requiredSkillsScore: Schema.Number,
  experienceScore: Schema.Number,
  educationScore: Schema.Number,
  skillMatches: Schema.Array(SkillMatch),
  missingRequiredSkills: Schema.Array(Schema.String),
  recommendations: Schema.Array(Schema.String)
})

export const ParseResumeRequest = Schema.Struct({
  candidateId: Schema.String,
  jobId: Schema.String,
  fileContent: Schema.String,
  fileName: Schema.String
})

export const ParseResumeResponse = Schema.Struct({
  success: Schema.Boolean,
  data: Schema.optional(Schema.Struct({
    parsedData: ParsedResumeData,
    score: CandidateScore
  })),
  error: Schema.optional(Schema.String)
})

export type ParsedResumeData = Schema.Schema.Type<typeof ParsedResumeData>
export type SkillMatch = Schema.Schema.Type<typeof SkillMatch>
export type CandidateScore = Schema.Schema.Type<typeof CandidateScore>
export type ParseResumeRequest = Schema.Schema.Type<typeof ParseResumeRequest>
export type ParseResumeResponse = Schema.Schema.Type<typeof ParseResumeResponse>