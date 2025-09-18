'use client'

import { Button } from '@seeds/ui/button'
import { Input } from '@seeds/ui/input'
import { Label } from '@seeds/ui/label'
import { Textarea } from '@seeds/ui/textarea'
import { Alert, AlertTitle, AlertDescription } from '@seeds/ui/alert'
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@seeds/ui/dropdown-menu'
import { Check, Upload, AlertTriangle, ExternalLink, ChevronDown, FileText } from 'lucide-react'
import { useState, useEffect } from 'react'
import { checkAuthentication, fileToBase64, submitJobApplication, parseResumeAndScore, checkExistingApplication, type ApplicationRequest, type JobsApiError, type ResumeParseResponse } from '../../../lib/api'
import { AuthModal } from '../../../components/auth-modal'
import { useAuth } from '../../../components/auth-provider'

interface ApplicationFormProps {
  jobId: string
  orgSlug: string
}

export function ApplicationForm({ jobId, orgSlug }: ApplicationFormProps) {
  const { isAuthenticated, user } = useAuth()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [resumeFile, setResumeFile] = useState<File | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [currentUser, setCurrentUser] = useState<any>(null)
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
  const [hasAlreadyApplied, setHasAlreadyApplied] = useState(false)
  const [checkingApplication, setCheckingApplication] = useState(false)
  const [existingApplicationId, setExistingApplicationId] = useState<string | null>(null)

  // Check if authenticated user has already applied and reset on auth changes
  useEffect(() => {
    if (isAuthenticated && user?.email) {
      console.log('Checking existing application for authenticated user:', user.email)
      checkExistingApplication(jobId, user.email)
        .then((result) => {
          console.log('Application check result:', result)
          setHasAlreadyApplied(result.data.hasApplied)
          setExistingApplicationId(result.data.applicationId || null)
        })
        .catch((error) => {
          console.warn('Failed to check existing application on mount:', error)
        })
    } else {
      // Reset application state when user logs out
      console.log('User logged out, resetting application state')
      setHasAlreadyApplied(false)
      setExistingApplicationId(null)
      setIsSubmitted(false)
      setApplicationResult(null)
      setError(null)
    }
  }, [isAuthenticated, user?.email, jobId])
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

  // Mock data for existing resume files - TODO: Replace with actual API call
  const [existingResumeFiles] = useState([
    {
      id: '1',
      name: 'Software_Engineer_Resume_2024.pdf',
      uploadedAt: '2024-01-15T10:30:00Z',
      size: '2.3 MB'
    },
    {
      id: '2', 
      name: 'Frontend_Developer_CV.docx',
      uploadedAt: '2024-01-10T15:45:00Z',
      size: '1.8 MB'
    },
    {
      id: '3',
      name: 'John_Doe_Resume_Latest.pdf', 
      uploadedAt: '2024-01-08T09:15:00Z',
      size: '2.1 MB'
    }
  ])
  
  const [selectedExistingResume, setSelectedExistingResume] = useState<{
    id: string
    name: string
    uploadedAt: string
    size: string
  } | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsSubmitting(true)

    // Clear any checking state when submitting
    setCheckingApplication(false)

    // Only check hasAlreadyApplied if we're authenticated and have confirmed status
    // Don't block submission based on debounced email checks
    if (isAuthenticated && hasAlreadyApplied && existingApplicationId) {
      setError('You have already applied to this position. Please check your email for updates.')
      setIsSubmitting(false)
      return
    }

    try {
      const authCheck = checkAuthentication()
      if (!authCheck.isAuthenticated && !currentUser) {
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

      if (!resumeFile && !selectedExistingResume) {
        throw new Error('Please upload your resume or select an existing one')
      }

      // Since resumeFile is required for the API, ensure we have it
      if (!resumeFile) {
        throw new Error('Please upload a resume file')
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
      setSelectedExistingResume(null) // Clear existing resume selection when new file is uploaded
    }
  }

  const handleExistingResumeSelect = (resume: typeof existingResumeFiles[0]) => {
    setSelectedExistingResume(resume)
    setResumeFile(null) // Clear uploaded file when existing resume is selected
    setError(null)
  }

  const handleUploadNewResume = () => {
    const input = document.getElementById('resume') as HTMLInputElement
    input?.click()
  }


  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
    
    // Removed email-based application checking to prevent race conditions
    // Application status is only checked on auth state changes
  }

  const handleAuthSuccess = (user: any) => {
    console.log('Authentication successful:', user)
    setCurrentUser(user)
    setShowAuthModal(false)
    
    if (user.firstName || user.lastName || user.email) {
      setFormData(prev => ({
        ...prev,
        firstName: user.firstName || prev.firstName,
        lastName: user.lastName || prev.lastName,
        email: user.email || prev.email,
      }))
    }
    
  }

  // Show "Already Applied" message only for authenticated users who have actually applied
  if (isAuthenticated && hasAlreadyApplied && existingApplicationId && !isSubmitted) {
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
            <p className='text-sm text-muted-foreground'>
              Application ID: <span className='font-mono'>{existingApplicationId}</span>
            </p>
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
      {/* Only show errors if user hasn't already applied */}
      {error && !hasAlreadyApplied && (
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
              className={`w-full ${hasAlreadyApplied ? 'border-destructive' : ''}`}
            />
            <div className='min-h-[1.25rem] mt-1'>
              {checkingApplication && (
                <p className='text-xs text-muted-foreground'>
                  Checking if you've already applied...
                </p>
              )}
              {/* Only show email validation for authenticated users with confirmed application */}
              {isAuthenticated && hasAlreadyApplied && existingApplicationId && !checkingApplication && (
                <p className='text-sm text-destructive-foreground'>
                  This email has already been used to apply to this position
                </p>
              )}
            </div>
            {/* Only show application block for authenticated users with confirmed application */}
            {isAuthenticated && hasAlreadyApplied && existingApplicationId && (
              <div className='mt-2 p-3 bg-destructive-subtle border border-destructive-border rounded-md'>
                <p className='text-sm text-destructive-vibrant font-medium'>
                  You have already applied to this position
                </p>
                <p className='text-xs text-destructive-vibrant mt-1'>
                  Application ID: {existingApplicationId}
                </p>
                <p className='text-xs text-destructive-vibrant'>
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
          
          {isAuthenticated && existingResumeFiles.length > 0 ? (
            // Enhanced dropdown for authenticated users with existing files
            <div>
              <input
                id='resume'
                name='resume'
                type='file'
                accept='.pdf,.doc,.docx'
                onChange={handleFileChange}
                className='hidden'
              />
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    type='button'
                    variant='outline'
                    className='w-full justify-between h-auto p-4 border-dashed hover:border-primary/30'
                  >
                    <div className='flex items-center gap-2'>
                      {selectedExistingResume ? (
                        <>
                          <FileText className='h-5 w-5 text-muted-foreground' />
                          <span className='text-sm'>
                            {selectedExistingResume.name}
                          </span>
                        </>
                      ) : resumeFile ? (
                        <>
                          <Upload className='h-5 w-5 text-muted-foreground' />
                          <span className='text-sm'>
                            {resumeFile.name}
                          </span>
                        </>
                      ) : (
                        <>
                          <Upload className='h-5 w-5 text-muted-foreground' />
                          <span className='text-sm text-muted-foreground'>
                            Choose resume or upload new
                          </span>
                        </>
                      )}
                    </div>
                    <ChevronDown className='h-4 w-4 text-muted-foreground' />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className='w-full min-w-[400px]' align='start'>
                  <DropdownMenuItem onClick={handleUploadNewResume} className='flex items-center gap-2'>
                    <Upload className='h-4 w-4' />
                    <div>
                      <div className='font-medium'>Upload new resume</div>
                      <div className='text-xs text-muted-foreground'>PDF, DOC, or DOCX (max 5MB)</div>
                    </div>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  {existingResumeFiles.map((resume) => (
                    <DropdownMenuItem 
                      key={resume.id} 
                      onClick={() => handleExistingResumeSelect(resume)}
                      className='flex items-center gap-2'
                    >
                      <FileText className='h-4 w-4' />
                      <div className='flex-1'>
                        <div className='font-medium text-sm'>{resume.name}</div>
                        <div className='text-xs text-muted-foreground'>
                          Uploaded {new Date(resume.uploadedAt).toLocaleDateString()} • {resume.size}
                        </div>
                      </div>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ) : (
            // Original file upload for non-authenticated users or users with no existing files
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
          )}
          
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
