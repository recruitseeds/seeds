'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { Alert, AlertDescription, AlertTitle } from '@seeds/ui/alert'
import { Button } from '@seeds/ui/button'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@seeds/ui/form'
import { Input } from '@seeds/ui/input'
import { Textarea } from '@seeds/ui/textarea'
import { AlertTriangle, Check, Upload } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { useApplicationState } from '../../../components/application-state-provider'
import { AuthModal } from '../../../components/auth-modal'
import { useAuth } from '../../../components/auth-provider'
import {
  type ApplicationRequest,
  fileToBase64,
  parseResumeAndScore,
  type ResumeParseResponse,
  submitJobApplication,
} from '../../../lib/api'

// Form validation schema
const applicationFormSchema = z.object({
  firstName: z
    .string()
    .min(1, 'First name is required')
    .min(2, 'First name must be at least 2 characters')
    .max(50, 'First name must be less than 50 characters'),
  lastName: z
    .string()
    .min(1, 'Last name is required')
    .min(2, 'Last name must be at least 2 characters')
    .max(50, 'Last name must be less than 50 characters'),
  email: z.string().min(1, 'Email is required').email('Please enter a valid email address'),
  phone: z.string().optional(),
  linkedin: z
    .string()
    .optional()
    .refine((val) => {
      if (!val) return true
      try {
        const url = new URL(val)
        return url.hostname === 'linkedin.com' || url.hostname === 'www.linkedin.com'
      } catch {
        return false
      }
    }, 'Please enter a valid LinkedIn URL'),
  portfolio: z
    .string()
    .optional()
    .refine((val) => {
      if (!val) return true
      try {
        new URL(val)
        return true
      } catch {
        return false
      }
    }, 'Please enter a valid URL'),
  coverLetter: z.string().optional(),
  additionalInfo: z.string().optional(),
  resume: z
    .instanceof(File, { message: 'Resume is required' })
    .refine((file) => {
      const allowedTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'text/plain',
      ]
      return allowedTypes.includes(file.type)
    }, 'Please upload a PDF, DOC, DOCX, or TXT file')
    .refine((file) => file.size <= 5 * 1024 * 1024, 'File size must be less than 5MB'),
})

type ApplicationFormData = z.infer<typeof applicationFormSchema>

interface ApplicationFormProps {
  jobId: string
  orgSlug: string
}

export function ApplicationForm({ jobId, orgSlug }: ApplicationFormProps) {
  const { isAuthenticated, user, session } = useAuth()
  const { applicationState, setHasApplied, setIsSubmitting } = useApplicationState()
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [applicationResult, setApplicationResult] = useState<{
    applicationId: string
    candidateId: string
    status: string
    score?: number
    nextSteps: string
  } | null>(null)
  const [resumeParseResult, setResumeParseResult] = useState<ResumeParseResponse | null>(null)
  const [isParsingResume, setIsParsingResume] = useState(false)
  const [parseError, setParseError] = useState<string | null>(null)

  // Initialize form with react-hook-form and zod validation
  const form = useForm<ApplicationFormData>({
    resolver: zodResolver(applicationFormSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      linkedin: '',
      portfolio: '',
      coverLetter: '',
      additionalInfo: '',
    },
  })

  const { setValue, watch } = form

  const onSubmit = async (formData: ApplicationFormData) => {
    setError(null)
    setIsSubmitting(true)

    // Check if user has already applied
    if (applicationState.hasApplied) {
      setError('You have already applied to this position. Please check your email for updates.')
      setIsSubmitting(false)
      return
    }

    try {
      if (!isAuthenticated) {
        localStorage.setItem(
          'pendingApplication',
          JSON.stringify({
            jobId,
            orgSlug,
            formData: {
              firstName: formData.firstName,
              lastName: formData.lastName,
              email: formData.email,
              phone: formData.phone,
              linkedin: formData.linkedin,
              portfolio: formData.portfolio,
              coverLetter: formData.coverLetter,
              additionalInfo: formData.additionalInfo,
            },
            resumeFile: formData.resume
              ? {
                  name: formData.resume.name,
                  type: formData.resume.type,
                  size: formData.resume.size,
                  lastModified: formData.resume.lastModified,
                }
              : null,
            timestamp: Date.now(),
          })
        )

        setShowAuthModal(true)
        setIsSubmitting(false)
        return
      }

      const base64Content = await fileToBase64(formData.resume)

      const applicationData: ApplicationRequest = {
        candidateData: {
          name: `${formData.firstName.trim()} ${formData.lastName.trim()}`,
          email: formData.email.trim(),
          phone: formData.phone?.trim() || undefined,
        },
        resumeFile: {
          fileName: formData.resume.name,
          content: base64Content,
          mimeType: formData.resume.type as ApplicationRequest['resumeFile']['mimeType'],
          tags: ['frontend', 'web-development'],
        },
      }

      const result = await submitJobApplication(jobId, applicationData)

      setApplicationResult({
        applicationId: result.data.applicationId,
        candidateId: result.data.candidateId,
        status: result.data.status,
        score: result.data.score,
        nextSteps: result.data.nextSteps,
      })

      // Update shared state immediately for optimistic UI
      setHasApplied(true, result.data.applicationId)

      localStorage.removeItem('pendingApplication')

      setIsParsingResume(true)
      setParseError(null)

      try {
        console.log('Starting resume parsing and scoring...')
        const parseResult = await parseResumeAndScore(result.data.candidateId, jobId)

        console.log('Resume parsed successfully:', {
          overallScore: parseResult.data.score.overallScore,
          requiredSkillsScore: parseResult.data.score.requiredSkillsScore,
          skillMatches: parseResult.data.score.skillMatches.length,
          missingSkills: parseResult.data.score.missingRequiredSkills.length,
        })

        setResumeParseResult(parseResult)

        setApplicationResult((prev) =>
          prev
            ? {
                ...prev,
                score: parseResult.data.score.overallScore,
                status: parseResult.data.score.overallScore < 30 ? 'auto_rejected' : prev.status,
              }
            : prev
        )
      } catch (parseErr) {
        console.error('Resume parsing failed:', parseErr)
        if (parseErr instanceof Error) {
          setParseError(`Resume analysis failed: ${parseErr.message}`)
        } else {
          setParseError('Resume analysis failed. Your application was still submitted successfully.')
        }
      } finally {
        setIsParsingResume(false)
      }

      setIsSubmitted(true)
    } catch (err) {
      console.error('Application submission error:', err)

      if (err instanceof Error) {
        if (err.message.includes('DUPLICATE_APPLICATION')) {
          setError('You have already applied to this position. Please check your email for updates.')
        } else if (err.message.includes('FILE_TOO_LARGE')) {
          setError('Your resume file is too large. Please upload a file smaller than 5MB.')
        } else if (err.message.includes('INVALID_FILE')) {
          setError('Please upload a valid PDF, DOC, DOCX, or TXT resume file.')
        } else {
          setError(err.message)
        }
      } else {
        setError('An unexpected error occurred. Please try again.')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setError(null)
      setValue('resume', file)
    }
  }

  // Pre-fill form with user data when authenticated
  if (isAuthenticated && user && !form.formState.isDirty) {
    const metadata = user.user_metadata || {}
    if (metadata.first_name) {
      setValue('firstName', metadata.first_name || '')
      setValue('lastName', metadata.last_name || '')
      setValue('email', user.email || '')
    }
  }

  const handleAuthSuccess = (authUser: unknown) => {
    console.log('Authentication successful:', authUser)
    setShowAuthModal(false)
  }

  // Use shared application state
  const { hasApplied, applicationId, isSubmitting } = applicationState

  // Show existing application status if user has already applied
  if (hasApplied && !isSubmitting) {
    return (
      <div className='text-center py-12 space-y-6'>
        <div className='inline-flex items-center justify-center w-16 h-16 rounded-full mb-4 bg-blue-100'>
          <Check className='h-8 w-8 text-blue-600' />
        </div>

        <div className='space-y-4'>
          <h3 className='text-2xl font-semibold'>Already Applied</h3>

          <div className='max-w-md mx-auto space-y-3'>
            <p className='text-muted-foreground'>You have already submitted an application for this position.</p>
            {applicationId && <p className='text-sm text-muted-foreground'>Application ID: {applicationId}</p>}
            <p className='text-sm text-muted-foreground'>
              The company will review your information and reach out to you if you're a good fit.
            </p>
          </div>
        </div>
      </div>
    )
  }

  if (isSubmitted && applicationResult) {
    return (
      <div className='text-center py-12 space-y-6'>
        <div className='inline-flex items-center justify-center w-16 h-16 rounded-full mb-4 bg-green-100'>
          <Check className='h-8 w-8 text-green-600' />
        </div>

        <div className='space-y-4'>
          <h3 className='text-2xl font-semibold'>Application Submitted!</h3>

          <div className='max-w-md mx-auto space-y-3'>
            <p className='text-muted-foreground'>
              Thank you for your application! The company will review your information and reach out to you soon.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div>
      {error && (
        <Alert variant='destructive' className='mb-6'>
          <AlertTriangle className='h-4 w-4' />
          <AlertTitle>Application Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Authentication Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onAuthSuccess={handleAuthSuccess}
        mode='login'
      />

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-6'>
          <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
            <FormField
              control={form.control}
              name='firstName'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    First Name <span className='text-brand'>*</span>
                  </FormLabel>
                  <FormControl>
                    <Input placeholder='John' {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name='lastName'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Last Name <span className='text-brand'>*</span>
                  </FormLabel>
                  <FormControl>
                    <Input placeholder='Doe' {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
            <FormField
              control={form.control}
              name='email'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Email <span className='text-brand'>*</span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      type='email'
                      placeholder='john.doe@example.com'
                      className={hasApplied ? 'border-red-500' : ''}
                      {...field}
                    />
                  </FormControl>
                  {hasApplied && (
                    <div className='mt-2 p-3 bg-red-50 border border-red-200 rounded-md'>
                      <p className='text-sm text-red-800 font-medium'>You have already applied to this position</p>
                      <p className='text-xs text-red-600 mt-1'>Application ID: {applicationId}</p>
                      <p className='text-xs text-red-600'>
                        Please check your email for updates on your application status.
                      </p>
                    </div>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name='phone'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone</FormLabel>
                  <FormControl>
                    <Input type='tel' placeholder='+1 (555) 000-0000' {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name='resume'
            render={({ field: { value, onChange, ...field } }) => (
              <FormItem>
                <FormLabel>
                  Resume/CV <span className='text-brand'>*</span>
                </FormLabel>
                <FormControl>
                  <div className='relative'>
                    <input
                      type='file'
                      accept='.pdf,.doc,.docx,.txt'
                      onChange={handleFileChange}
                      className='hidden'
                      id='resume-upload'
                      {...field}
                    />
                    <label
                      htmlFor='resume-upload'
                      className='flex items-center justify-center gap-2 p-4 border border-dashed rounded-lg cursor-pointer hover:border-primary/30 transition-colors'>
                      <Upload className='h-5 w-5 text-muted-foreground' />
                      <span className='text-sm text-muted-foreground'>
                        {value ? value.name : 'Drop your resume here or click to browse'}
                      </span>
                    </label>
                  </div>
                </FormControl>
                <p className='text-xs text-muted-foreground'>PDF, DOC, DOCX, or TXT (max 5MB)</p>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
            <FormField
              control={form.control}
              name='linkedin'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>LinkedIn Profile</FormLabel>
                  <FormControl>
                    <Input type='url' placeholder='https://linkedin.com/in/johndoe' {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name='portfolio'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Portfolio</FormLabel>
                  <FormControl>
                    <Input type='url' placeholder='https://johndoe.com' {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name='coverLetter'
            render={({ field }) => (
              <FormItem>
                <FormLabel>Cover Letter</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Tell us why you're interested in this role and what makes you a great fit..."
                    className='min-h-[120px]'
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name='additionalInfo'
            render={({ field }) => (
              <FormItem>
                <FormLabel>Additional Information</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Anything else you'd like us to know? (availability, salary expectations, etc.)"
                    className='min-h-[80px]'
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className='flex items-center justify-between pt-4'>
            <p className='text-sm text-muted-foreground'>
              <span className='text-brand'>*</span> Required fields
            </p>
            <Button
              type='submit'
              disabled={isSubmitting || hasApplied}
              size='lg'
              loading={isSubmitting}
              title={hasApplied ? 'You have already applied to this position' : undefined}>
              {hasApplied ? 'Already Applied' : 'Submit Application'}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  )
}
