import { z } from 'zod'

// --- Profile Schema ---
export const updateCandidateProfileSchema = z.object({
  firstName: z.string().optional(), // Was required
  lastName: z.string().optional(), // Was required
  jobTitle: z.string().optional(),
  phone: z.string().optional(),
  location: z // Was min(2)
    .string()
    .optional()
    .refine((val) => !val || val.length >= 2, {
      message: 'Location must be at least 2 characters if provided.',
    }),
  website: z
    .string()
    .url({ message: 'Please enter a valid URL if provided.' })
    .optional()
    .or(z.literal('')) // Allows empty string for form input
    .nullable(), // Allow null for backend
  linkedin: z
    .string()
    .url({ message: 'Please enter a valid URL if provided.' })
    .optional()
    .or(z.literal(''))
    .nullable(),
  github: z
    .string()
    .url({ message: 'Please enter a valid URL if provided.' })
    .optional()
    .or(z.literal(''))
    .nullable(),
  twitter: z
    .string()
    .url({ message: 'Please enter a valid URL if provided.' })
    .optional()
    .or(z.literal(''))
    .nullable(),
  bio: z
    .string()
    .optional()
    .nullable()
    .refine((val) => !val || val.length <= 500, {
      message: 'Bio must not exceed 500 characters if provided.',
    }),
  revalidatePath: z.string().optional(),
})

// --- Education Schemas ---
export const createCandidateEducationSchema = z.object({
  degree_name: z
    .string()
    .optional()
    .nullable()
    .refine((val) => !val || val.length >= 2, {
      message: 'Degree name must be at least 2 characters if provided.',
    }),
  institution_name: z
    .string()
    .optional()
    .nullable()
    .refine((val) => !val || val.length >= 2, {
      message: 'Institution name must be at least 2 characters if provided.',
    }),
  location: z.string().optional().nullable(),
  start_date: z
    .string()
    .optional()
    .nullable()
    .refine((val) => !val || /^\d{4}-\d{2}-\d{2}$/.test(val), {
      message: 'Start date must be in YYYY-MM-DD format if provided.',
    }),
  end_date: z
    .string()
    .optional()
    .nullable()
    .refine((val) => !val || /^\d{4}-\d{2}-\d{2}$/.test(val), {
      message: 'End date must be in YYYY-MM-DD format if provided.',
    }),
  description: z.any().optional().nullable(),
  achievements: z.array(z.string()).optional().nullable(),
})

export const candidateEducationFormSchema = z.object({
  id: z.string().optional(),
  degree: z
    .string()
    .optional() // No .min directly, use refine if needed for non-empty
    .refine((val) => !val || val.length >= 2, {
      message: 'Degree must be at least 2 characters if provided.',
    }),
  institution: z
    .string()
    .optional()
    .refine((val) => !val || val.length >= 2, {
      message: 'Institution must be at least 2 characters if provided.',
    }),
  location: z.string().optional().nullable(),
  startDate: z
    .string()
    .optional() // Was min(1)
    .refine((val) => !val || /^\d{4}-\d{2}-\d{2}$/.test(val), {
      message: 'Start date must be in YYYY-MM-DD format if provided.',
    }),
  endDate: z
    .string()
    .optional()
    .nullable()
    .refine((val) => !val || /^\d{4}-\d{2}-\d{2}$/.test(val), {
      message: 'End date must be in YYYY-MM-DD format if provided.',
    }),
  description: z.string().optional().nullable(),
  achievements: z.array(z.string()).optional().nullable(),
})

export const updateCandidateEducationSchema = z.object({
  id: z.string().uuid({ message: 'Invalid education record ID.' }),
  degree_name: z
    .string()
    .optional()
    .nullable()
    .refine((val) => !val || val.length >= 2, {
      message: 'Degree name must be at least 2 characters if provided.',
    }),
  institution_name: z
    .string()
    .optional()
    .nullable()
    .refine((val) => !val || val.length >= 2, {
      message: 'Institution name must be at least 2 characters if provided.',
    }),
  location: z.string().optional().nullable(),
  start_date: z
    .string()
    .optional()
    .nullable()
    .refine((val) => !val || /^\d{4}-\d{2}-\d{2}$/.test(val), {
      message: 'Start date must be in YYYY-MM-DD format if provided.',
    }),
  end_date: z
    .string()
    .optional()
    .nullable()
    .refine((val) => !val || /^\d{4}-\d{2}-\d{2}$/.test(val), {
      message: 'End date must be in YYYY-MM-DD format if provided.',
    }),
  description: z.any().optional().nullable(),
  achievements: z.array(z.string()).optional().nullable(),
})

// --- Resume Schema (Primarily for parsing, less about input requirements) ---
// This schema already uses .nullable().optional() extensively, which is good for parsed data.
// Making minimal changes here unless a field is truly fundamental to its object.
export const resumeSchema = z.object({
  personalInfo: z
    .object({
      fullName: z.string().nullable().optional(),
      email: z.string().email().nullable().optional(),
      phone: z.string().nullable().optional(),
      linkedin: z.string().nullable().optional(),
      location: z.string().nullable().optional(),
    })
    .optional() // The whole personalInfo object can be optional
    .describe('Personal contact information and details'),
  summary: z
    .string()
    .nullable()
    .optional()
    .describe('A brief professional summary or objective from the resume'),
  education: z
    .array(
      z.object({
        institution: z.string().nullable().optional(), // If an education entry might lack this
        degree: z.string().nullable().optional(), // If an education entry might lack this
        fieldOfStudy: z.string().nullable().optional(),
        location: z.string().nullable().optional(),
        startDate: z.string().nullable().optional(),
        endDate: z.string().nullable().optional(),
      })
    )
    .optional()
    .describe('Educational background'),
  workExperience: z
    .array(
      z.object({
        title: z.string().nullable().optional(), // If a work entry might lack this
        company: z.string().nullable().optional(), // If a work entry might lack this
        location: z.string().nullable().optional(),
        startDate: z.string().nullable().optional(),
        endDate: z.string().nullable().optional(),
        description: z.string().nullable().optional(),
      })
    )
    .optional()
    .describe('Professional work experience'),
  skills: z.array(z.string()).optional().describe('List of relevant skills'),
})

export type ResumeData = z.infer<typeof resumeSchema>

// --- Work Experience Schemas ---
export const createCandidateWorkExperienceSchema = z.object({
  job_title: z
    .string()
    .optional()
    .nullable()
    .refine((val) => !val || val.length >= 2, {
      message: 'Job title must be at least 2 characters if provided.',
    }),
  company_name: z
    .string()
    .optional()
    .nullable()
    .refine((val) => !val || val.length >= 2, {
      message: 'Company name must be at least 2 characters if provided.',
    }),
  location: z.string().optional().nullable(),
  start_date: z
    .string()
    .optional()
    .nullable()
    .refine((val) => !val || /^\d{4}-\d{2}-\d{2}$/.test(val), {
      message: 'Start date must be in YYYY-MM-DD format if provided.',
    }),
  end_date: z
    .string()
    .optional()
    .nullable()
    .refine(
      (val) =>
        !val ||
        val.toUpperCase() === 'PRESENT' ||
        /^\d{4}-\d{2}-\d{2}$/.test(val),
      {
        message:
          'End date must be in YYYY-MM-DD format or "Present" if provided.',
      }
    ),
  is_current: z.boolean().optional(),
  description: z.any().optional().nullable(),
})

export const updateCandidateWorkExperienceSchema = z.object({
  id: z.string().uuid({ message: 'Invalid work experience record ID.' }),
  job_title: z
    .string()
    .optional()
    .nullable()
    .refine((val) => !val || val.length >= 2, {
      message: 'Job title must be at least 2 characters if provided.',
    }),
  company_name: z
    .string()
    .optional()
    .nullable()
    .refine((val) => !val || val.length >= 2, {
      message: 'Company name must be at least 2 characters if provided.',
    }),
  location: z.string().optional().nullable(),
  start_date: z
    .string()
    .optional()
    .nullable()
    .refine((val) => !val || /^\d{4}-\d{2}-\d{2}$/.test(val), {
      message: 'Start date must be in YYYY-MM-DD format if provided.',
    }),
  end_date: z
    .string()
    .optional()
    .nullable()
    .refine(
      (val) =>
        !val ||
        val.toUpperCase() === 'PRESENT' ||
        /^\d{4}-\d{2}-\d{2}$/.test(val),
      {
        message:
          'End date must be in YYYY-MM-DD format or "Present" if provided.',
      }
    ),
  is_current: z.boolean().optional(),
  description: z.any().optional().nullable(),
})

export const candidateWorkExperienceFormSchema = z
  .object({
    id: z.string().optional(),
    jobTitle: z
      .string()
      .optional()
      .refine((val) => !val || val.length >= 2, {
        message: 'Job title must be at least 2 characters if provided.',
      }),
    companyName: z
      .string()
      .optional()
      .refine((val) => !val || val.length >= 2, {
        message: 'Company name must be at least 2 characters if provided.',
      }),
    location: z.string().optional().nullable(),
    startDate: z
      .string()
      .optional()
      .refine((val) => !val || /^\d{4}-\d{2}-\d{2}$/.test(val), {
        message: 'Start date must be in YYYY-MM-DD format if provided.',
      }),
    endDate: z
      .string()
      .optional()
      .nullable()
      .refine(
        (val) =>
          !val ||
          val.toUpperCase() === 'PRESENT' ||
          /^\d{4}-\d{2}-\d{2}$/.test(val),
        {
          message:
            'End date must be in YYYY-MM-DD format or "Present" if provided.',
        }
      ),
    isCurrent: z.boolean().optional(),
    description: z.string().optional().nullable(),
  })
  .refine(
    // This refine should only run if both dates are provided
    (data) => {
      if (
        data.startDate &&
        data.endDate &&
        data.endDate.toUpperCase() !== 'PRESENT'
      ) {
        // Ensure dates are valid before comparing
        const startDateValid = /^\d{4}-\d{2}-\d{2}$/.test(data.startDate)
        const endDateValid = /^\d{4}-\d{2}-\d{2}$/.test(data.endDate)
        if (startDateValid && endDateValid) {
          try {
            return new Date(data.endDate) >= new Date(data.startDate)
          } catch {
            return true // Or false, depending on how you want to handle parse errors here
          }
        }
      }
      return true
    },
    {
      message: 'End date cannot be earlier than start date.',
      path: ['endDate'],
    }
  )
  .refine(
    // This refine should only run if isCurrent or endDate is provided
    (data) => {
      if (typeof data.isCurrent === 'boolean' || data.endDate) {
        // Check if relevant fields have values
        if (
          data.isCurrent &&
          data.endDate &&
          data.endDate.toUpperCase() !== 'PRESENT'
        ) {
          return false
        }
        if (
          data.endDate?.toUpperCase() === 'PRESENT' &&
          data.isCurrent === false
        ) {
          // Explicitly check if isCurrent is false
          return false
        }
        if (
          data.endDate?.toUpperCase() !== 'PRESENT' &&
          data.isCurrent === true &&
          data.endDate !== undefined &&
          data.endDate !== null
        ) {
          // If isCurrent is true, endDate must be 'PRESENT' or not set
          return false
        }
      }
      return true
    },
    {
      message: 'Current status and end date are inconsistent.',
      path: ['isCurrent'], // Or ['endDate'] or both, depending on the primary field for this error
    }
  )

export const deleteCandidateWorkExperienceSchema = z.object({
  id: z.string().uuid({ message: 'Invalid work experience ID.' }),
})
