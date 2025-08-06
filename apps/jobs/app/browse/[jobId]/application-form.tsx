'use client'

import { Button } from '@seeds/ui/button'
import { Input } from '@seeds/ui/input'
import { Label } from '@seeds/ui/label'
import { Textarea } from '@seeds/ui/textarea'
import { Alert, AlertTitle, AlertDescription } from '@seeds/ui/alert'
import { Check, Upload, AlertTriangle, ExternalLink } from 'lucide-react'
import { useState } from 'react'
import { fileToBase64, submitJobApplication, parseResumeAndScore, checkExistingApplication, type ApplicationRequest, type JobsApiError, type ResumeParseResponse } from '../../../lib/api'
import { AuthModal } from '../../../components/auth-modal'
import { useAuth } from '../../../components/auth-provider'

interface ApplicationFormProps {
  jobId: string
  orgSlug: string
  serverApplicationCheck?: {
    hasApplied: boolean
    applicationId: string | null
  }
}

export function ApplicationForm({ jobId, orgSlug, serverApplicationCheck }: ApplicationFormProps) {
  const { isAuthenticated, user, session } = useAuth()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [resumeFile, setResumeFile] = useState<File | null>(null)
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
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    linkedin: '',
    portfolio: '',
    coverLetter: '',
    additionalInfo: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsSubmitting(true)

    // Check if user has already applied
    if (hasAlreadyApplied) {
      setError('You have already applied to this position. Please check your email for updates.')
      setIsSubmitting(false)
      return
    }

    try {
      if (!isAuthenticated) {
        localStorage.setItem('pendingApplication', JSON.stringify({
          jobId,
          orgSlug,
          formData,
          resumeFile: resumeFile ? {
            name: resumeFile.name,
            type: resumeFile.type,
            size: resumeFile.size,
            lastModified: resumeFile.lastModified
          } : null,
          timestamp: Date.now()
        }))

        setShowAuthModal(true)
        setIsSubmitting(false)
        return
      }

      if (!formData.firstName.trim() || !formData.lastName.trim() || !formData.email.trim()) {
        throw new Error('Please fill in all required fields (name and email)')
      }

      if (!resumeFile) {
        throw new Error('Please upload your resume')
      }

      const allowedTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'text/plain'
      ]

      if (!allowedTypes.includes(resumeFile.type)) {
        throw new Error('Please upload a PDF, DOC, DOCX, or TXT file')
      }

      const maxSize = 5 * 1024 * 1024
      if (resumeFile.size > maxSize) {
        throw new Error('File size must be less than 5MB')
      }

      const base64Content = await fileToBase64(resumeFile)

      const applicationData: ApplicationRequest = {
        candidateData: {
          name: `${formData.firstName.trim()} ${formData.lastName.trim()}`,
          email: formData.email.trim(),
          phone: formData.phone.trim() || undefined,
        },
        resumeFile: {
          fileName: resumeFile.name,
          content: base64Content,
          mimeType: resumeFile.type as ApplicationRequest['resumeFile']['mimeType'],
          tags: ['frontend', 'web-development']
        }
      }

      const result = await submitJobApplication(jobId, applicationData)
      
      setApplicationResult({
        applicationId: result.data.applicationId,
        candidateId: result.data.candidateId,
        status: result.data.status,
        score: result.data.score,
        nextSteps: result.data.nextSteps
      })
      
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
          missingSkills: parseResult.data.score.missingRequiredSkills.length
        })
        
        setResumeParseResult(parseResult)
        
        setApplicationResult(prev => prev ? {
          ...prev,
          score: parseResult.data.score.overallScore,
          status: parseResult.data.score.overallScore < 30 ? 'auto_rejected' : prev.status
        } : prev)
        
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
      const allowedTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'text/plain'
      ]
      
      if (!allowedTypes.includes(file.type)) {
        setError('Please upload a PDF, DOC, DOCX, or TXT file')
        return
      }
      
      const maxSize = 5 * 1024 * 1024
      if (file.size > maxSize) {
        setError('File size must be less than 5MB')
        return
      }
      
      setError(null)
      setResumeFile(file)
    }
  }

  // This function is no longer needed - React Query handles the checking

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
    
    // No need to manually check applications - React Query handles it
  }

  // Pre-fill form with user data when authenticated (no useEffect needed)
  if (isAuthenticated && user) {
    const metadata = user.user_metadata || {}
    if (!formData.firstName && metadata.first_name) {
      setFormData(prev => ({
        ...prev,
        firstName: metadata.first_name || '',
        lastName: metadata.last_name || '',
        email: user.email || '',
      }))
    }
  }

  const handleAuthSuccess = (authUser: any) => {
    console.log('Authentication successful:', authUser)
    setShowAuthModal(false)
  }

  // Use server-side application check if available, otherwise client-side
  const hasAlreadyApplied = serverApplicationCheck?.hasApplied || false
  const existingApplicationId = serverApplicationCheck?.applicationId || null

  // Show existing application status if user has already applied
  if (hasAlreadyApplied && !isSubmitting) {
    return (
      <div className='text-center py-12 space-y-6'>
        <div className='inline-flex items-center justify-center w-16 h-16 rounded-full mb-4 bg-blue-100'>
          <Check className='h-8 w-8 text-blue-600' />
        </div>
        
        <div className='space-y-4'>
          <h3 className='text-2xl font-semibold'>Already Applied</h3>
          
          <div className='max-w-md mx-auto space-y-3'>
            <p className='text-muted-foreground'>
              You have already submitted an application for this position.
            </p>
            {existingApplicationId && (
              <p className='text-sm text-muted-foreground'>
                Application ID: {existingApplicationId}
              </p>
            )}
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
        <Alert variant="destructive" className='mb-6'>
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
        mode="login"
      />
      
      <form onSubmit={handleSubmit} className='space-y-6'>
        <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
          <div className='space-y-2'>
            <Label htmlFor='firstName'>
              First Name <span className='text-brand'>*</span>
            </Label>
            <Input
              id='firstName'
              name='firstName'
              value={formData.firstName}
              onChange={handleInputChange}
              required
              placeholder='John'
              className='w-full'
            />
          </div>

          <div className='space-y-2'>
            <Label htmlFor='lastName'>
              Last Name <span className='text-brand'>*</span>
            </Label>
            <Input
              id='lastName'
              name='lastName'
              value={formData.lastName}
              onChange={handleInputChange}
              required
              placeholder='Doe'
              className='w-full'
            />
          </div>
        </div>

        <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
          <div className='space-y-2'>
            <Label htmlFor='email'>
              Email <span className='text-brand'>*</span>
            </Label>
            <Input
              id='email'
              name='email'
              type='email'
              value={formData.email}
              onChange={handleInputChange}
              required
              placeholder='john.doe@example.com'
              className={`w-full ${hasAlreadyApplied ? 'border-red-500' : ''}`}
            />
            {checkingApplication && (
              <p className='text-xs text-muted-foreground mt-1'>
                Checking if you've already applied...
              </p>
            )}
            {hasAlreadyApplied && (
              <div className='mt-2 p-3 bg-red-50 border border-red-200 rounded-md'>
                <p className='text-sm text-red-800 font-medium'>
                  You have already applied to this position
                </p>
                <p className='text-xs text-red-600 mt-1'>
                  Application ID: {existingApplicationId}
                </p>
                <p className='text-xs text-red-600'>
                  Please check your email for updates on your application status.
                </p>
              </div>
            )}
          </div>

          <div className='space-y-2'>
            <Label htmlFor='phone'>Phone</Label>
            <Input
              id='phone'
              name='phone'
              type='tel'
              value={formData.phone}
              onChange={handleInputChange}
              placeholder='+1 (555) 000-0000'
              className='w-full'
            />
          </div>
        </div>

        <div className='space-y-2'>
          <Label htmlFor='resume'>
            Resume/CV <span className='text-brand'>*</span>
          </Label>
          <div className='relative'>
            <input
              id='resume'
              name='resume'
              type='file'
              accept='.pdf,.doc,.docx'
              onChange={handleFileChange}
              required
              className='hidden'
            />
            <label
              htmlFor='resume'
              className='flex items-center justify-center gap-2 p-4 border border-dashed rounded-lg cursor-pointer hover:border-primary/30 transition-colors'>
              <Upload className='h-5 w-5 text-muted-foreground' />
              <span className='text-sm text-muted-foreground'>
                {resumeFile ? resumeFile.name : 'Drop your resume here or click to browse'}
              </span>
            </label>
          </div>
          <p className='text-xs text-muted-foreground'>PDF, DOC, or DOCX (max 5MB)</p>
        </div>

        <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
          <div className='space-y-2'>
            <Label htmlFor='linkedin'>LinkedIn Profile</Label>
            <Input
              id='linkedin'
              name='linkedin'
              type='url'
              value={formData.linkedin}
              onChange={handleInputChange}
              placeholder='https://linkedin.com/in/johndoe'
              className='w-full'
            />
          </div>

          <div className='space-y-2'>
            <Label htmlFor='portfolio'>Portfolio</Label>
            <Input
              id='portfolio'
              name='portfolio'
              type='url'
              value={formData.portfolio}
              onChange={handleInputChange}
              placeholder='https://johndoe.com'
              className='w-full'
            />
          </div>
        </div>

        <div className='space-y-2'>
          <Label htmlFor='coverLetter'>Cover Letter</Label>
          <Textarea
            id='coverLetter'
            name='coverLetter'
            value={formData.coverLetter}
            onChange={handleInputChange}
            placeholder="Tell us why you're interested in this role and what makes you a great fit..."
            className='min-h-[120px] w-full'
          />
        </div>

        <div className='space-y-2'>
          <Label htmlFor='additionalInfo'>Additional Information</Label>
          <Textarea
            id='additionalInfo'
            name='additionalInfo'
            value={formData.additionalInfo}
            onChange={handleInputChange}
            placeholder="Anything else you'd like us to know? (availability, salary expectations, etc.)"
            className='min-h-[80px] w-full'
          />
        </div>

        <div className='flex items-center justify-between pt-4'>
          <p className='text-sm text-muted-foreground'>
            <span className='text-brand'>*</span> Required fields
          </p>
          <Button 
            type='submit' 
            disabled={isSubmitting || hasAlreadyApplied || checkingApplication} 
            size='lg' 
            loading={isSubmitting}
            title={hasAlreadyApplied ? 'You have already applied to this position' : undefined}
          >
            {hasAlreadyApplied ? 'Already Applied' : 'Submit Application'}
          </Button>
        </div>
      </form>
    </div>
  )
}
