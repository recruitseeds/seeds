import { z } from 'zod'

export const updateCandidateProfileSchema = z.object({
  firstName: z.string().min(1, { message: 'First name is required.' }),
  lastName: z.string().min(1, { message: 'Last name is required.' }),
  jobTitle: z.string().optional(),
  phone: z.string().optional(),
  location: z
    .string()
    .min(2, { message: 'Location must be at least 2 characters.' }),
  website: z
    .string()
    .url({ message: 'Please enter a valid URL.' })
    .optional()
    .or(z.literal('')),
  linkedin: z
    .string()
    .url({ message: 'Please enter a valid URL.' })
    .optional()
    .or(z.literal('')),
  github: z
    .string()
    .url({ message: 'Please enter a valid URL.' })
    .optional()
    .or(z.literal('')),
  twitter: z
    .string()
    .url({ message: 'Please enter a valid URL.' })
    .optional()
    .or(z.literal('')),
  bio: z
    .string()
    .max(500, { message: 'Bio must not exceed 500 characters.' })
    .optional(),
  revalidatePath: z.string().optional(),
})

export const createCandidateEducationSchema = z.object({
  degree_name: z.string().min(2),
  institution_name: z.string().min(2),
  location: z.string().nullable(),
  start_date: z
    .string()
    .min(10, { message: 'Start date is required.' })
    .regex(/^\d{4}-\d{2}-\d{2}$/, {
      message: 'Start date must be in YYYY-MM-DD format.',
    }),
  end_date: z
    .string()
    .nullable()
    .refine((val) => !val || /^\d{4}-\d{2}-\d{2}$/.test(val), {
      message: 'End date must be in YYYY-MM-DD format.',
    }),
  description: z.any().nullable(),
  achievements: z.array(z.string()).nullable(),
})

export const candidateEducationFormSchema = z.object({
  id: z.string().optional(),
  degree: z
    .string()
    .min(2, { message: 'Degree must be at least 2 characters.' }),
  institution: z
    .string()
    .min(2, { message: 'Institution must be at least 2 characters.' }),
  location: z.string().optional().nullable(),
  startDate: z
    .string()
    .min(1, { message: 'Start date is required.' })
    .refine((val) => /^\d{4}-\d{2}-\d{2}$/.test(val), {
      message: 'Start date must be in YYYY-MM-DD format.',
    }),
  endDate: z
    .string()
    .optional()
    .nullable()
    .refine((val) => !val || /^\d{4}-\d{2}-\d{2}$/.test(val), {
      message: 'End date must be in YYYY-MM-DD format.',
    }),
  description: z.string().optional().nullable(),
  achievements: z.array(z.string()).optional().nullable(),
})

export const updateCandidateEducationSchema = z.object({
  id: z.string().uuid({ message: 'Invalid education record ID.' }),
  degree_name: z
    .string()
    .min(2, 'Degree name must be at least 2 characters.')
    .optional(),
  institution_name: z
    .string()
    .min(2, 'Institution name must be at least 2 characters.')
    .optional(),
  location: z.string().optional().nullable(),
  start_date: z
    .string()
    .optional()
    .refine((val) => !val || /^\d{4}-\d{2}-\d{2}$/.test(val), {
      message: 'Start date must be in YYYY-MM-DD format.',
    }),
  end_date: z
    .string()
    .optional()
    .nullable()
    .refine((val) => !val || /^\d{4}-\d{2}-\d{2}$/.test(val), {
      message: 'End date must be in YYYY-MM-DD format.',
    }),
  description: z.any().optional().nullable(),
  achievements: z.array(z.string()).optional().nullable(),
})

export const resumeSchema = z.object({
  personalInfo: z
    .object({
      fullName: z
        .string()
        .nullable()
        .optional()
        .describe('Full name of the candidate'), // Consider making nullable
      email: z.string().email().nullable().optional().describe('Email address'), // Consider making nullable
      phone: z.string().nullable().optional().describe('Phone number'), // Consider making nullable
      linkedin: z
        .string()
        .nullable()
        .optional()
        .describe('LinkedIn profile URL or username'), // Already good
      location: z
        .string()
        .nullable()
        .optional()
        .describe('City and State, or Country'), // Consider making nullable
    })
    .describe('Personal contact information and details'),
  summary: z
    .string()
    .nullable() // If summary can be null
    .optional()
    .describe('A brief professional summary or objective from the resume'),
  education: z
    .array(
      z.object({
        institution: z.string().describe('Name of the educational institution'),
        degree: z
          .string()
          .describe('Degree obtained (e.g., Bachelor of Science)'),
        fieldOfStudy: z
          .string()
          .nullable()
          .optional()
          .describe('Field of study (e.g., Computer Science)'),
        // UPDATED:
        location: z
          .string()
          .nullable()
          .optional()
          .describe('Institution location'),
        startDate: z
          .string()
          .nullable()
          .optional()
          .describe('Start date of education (e.g., YYYY-MM, Month YYYY)'),
        // UPDATED:
        endDate: z
          .string()
          .nullable()
          .optional()
          .describe(
            'End date or graduation date (e.g., YYYY-MM, Month YYYY, Present)'
          ),
      })
    )
    .optional()
    .describe('Educational background'),
  workExperience: z
    .array(
      z.object({
        title: z.string().describe('Job title or position'),
        company: z.string().describe('Company name'),
        // UPDATED:
        location: z.string().nullable().optional().describe('Company location'),
        startDate: z
          .string()
          .nullable()
          .optional()
          .describe('Start date of employment (e.g., YYYY-MM, Month YYYY)'),
        endDate: z
          .string()
          .nullable()
          .optional()
          .describe(
            'End date of employment (e.g., YYYY-MM, Month YYYY, Present)'
          ),
        description: z
          .string()
          .nullable()
          .optional()
          .describe(
            'Key responsibilities, achievements, or a summary of the role'
          ),
      })
    )
    .optional()
    .describe('Professional work experience'),
  skills: z
    .array(z.string())
    .optional()
    .describe(
      'List of relevant skills (technical, soft, tools, programming languages, etc.)'
    ),
})

export type ResumeData = z.infer<typeof resumeSchema>
