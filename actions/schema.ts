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
