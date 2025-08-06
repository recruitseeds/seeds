'use client'

import { Button } from '@seeds/ui/button'
import { Input } from '@seeds/ui/input'
import { Label } from '@seeds/ui/label'
import { Textarea } from '@seeds/ui/textarea'
import { Alert, AlertTitle, AlertDescription } from '@seeds/ui/alert'
import { Check, Upload, AlertTriangle, ExternalLink } from 'lucide-react'
import { useState } from 'react'
import { checkAuthentication, fileToBase64, submitJobApplication, parseResumeAndScore, type ApplicationRequest, type JobsApiError, type ResumeParseResponse } from '../../../lib/api'
import { AuthModal } from '../../../components/auth-modal'

interface ApplicationFormProps {
  jobId: string
  orgSlug: string
}

export function ApplicationForm({ jobId, orgSlug }: ApplicationFormProps) {
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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }))
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

  if (isSubmitted && applicationResult) {
    const isAutoRejected = applicationResult.status === 'auto_rejected'
    
    return (
      <div className='text-center py-12 space-y-6'>
        <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full mb-4 ${
          isAutoRejected ? 'bg-red-100' : 'bg-green-100'
        }`}>
          {isAutoRejected ? (
            <AlertTriangle className='h-8 w-8 text-red-600' />
          ) : (
            <Check className='h-8 w-8 text-green-600' />
          )}
        </div>
        
        <div className='space-y-4'>
          <h3 className='text-2xl font-semibold'>
            {isAutoRejected ? 'Application Received' : 'Application Submitted!'}
          </h3>
          
          {/* Resume parsing status */}
          {isParsingResume && (
            <div className='bg-blue-50 border border-blue-200 rounded-lg p-4'>
              <p className='text-sm font-medium text-blue-900'>
                🔍 Analyzing your resume...
              </p>
              <p className='text-xs text-blue-700 mt-1'>
                We're scoring your application against job requirements.
              </p>
            </div>
          )}
          
          {/* Parse error */}
          {parseError && (
            <div className='bg-yellow-50 border border-yellow-200 rounded-lg p-4'>
              <p className='text-sm font-medium text-yellow-900'>
                ⚠️ Resume Analysis Issue
              </p>
              <p className='text-xs text-yellow-700 mt-1'>
                {parseError}
              </p>
            </div>
          )}
          
          <div className='max-w-md mx-auto space-y-3'>
            <p className='text-muted-foreground'>
              {applicationResult.nextSteps}
            </p>
            
            {/* Score display */}
            {applicationResult.score !== undefined && (
              <div className={`border rounded-lg p-4 ${
                isAutoRejected 
                  ? 'bg-red-50 border-red-200' 
                  : applicationResult.score >= 70
                    ? 'bg-green-50 border-green-200'
                    : 'bg-yellow-50 border-yellow-200'
              }`}>
                <p className={`text-sm font-medium ${
                  isAutoRejected 
                    ? 'text-red-900' 
                    : applicationResult.score >= 70
                      ? 'text-green-900'
                      : 'text-yellow-900'
                }`}>
                  Match Score: {applicationResult.score}%
                </p>
                <p className={`text-xs mt-1 ${
                  isAutoRejected 
                    ? 'text-red-700' 
                    : applicationResult.score >= 70
                      ? 'text-green-700'
                      : 'text-yellow-700'
                }`}>
                  {isAutoRejected 
                    ? 'Your application did not meet the minimum requirements for this role.'
                    : 'Your resume has been analyzed and scored against this job\'s requirements.'
                  }
                </p>
              </div>
            )}
            
            {/* Detailed score breakdown */}
            {resumeParseResult && (
              <div className='bg-gray-50 border border-gray-200 rounded-lg p-4 text-left'>
                <h4 className='text-sm font-medium text-gray-900 mb-3'>Score Breakdown</h4>
                <div className='space-y-2 text-xs'>
                  <div className='flex justify-between'>
                    <span className='text-gray-600'>Skills Match:</span>
                    <span className='font-mono'>{resumeParseResult.data.score.requiredSkillsScore}%</span>
                  </div>
                  <div className='flex justify-between'>
                    <span className='text-gray-600'>Experience:</span>
                    <span className='font-mono'>{resumeParseResult.data.score.experienceScore}%</span>
                  </div>
                  <div className='flex justify-between'>
                    <span className='text-gray-600'>Education:</span>
                    <span className='font-mono'>{resumeParseResult.data.score.educationScore}%</span>
                  </div>
                  {resumeParseResult.data.score.skillMatches.length > 0 && (
                    <div className='mt-3 pt-2 border-t border-gray-200'>
                      <p className='text-gray-600 mb-1'>Matched Skills:</p>
                      <div className='flex flex-wrap gap-1'>
                        {resumeParseResult.data.score.skillMatches.slice(0, 5).map((match, idx) => (
                          <span key={idx} className='px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs'>
                            {match.skill}
                          </span>
                        ))}
                        {resumeParseResult.data.score.skillMatches.length > 5 && (
                          <span className='px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs'>
                            +{resumeParseResult.data.score.skillMatches.length - 5} more
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
            
            <div className='bg-gray-50 border border-gray-200 rounded-lg p-4'>
              <p className='text-xs text-gray-600'>
                Application ID: <span className='font-mono'>{applicationResult.applicationId}</span>
              </p>
            </div>
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
              className='w-full'
            />
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
          <Button type='submit' disabled={isSubmitting} size='lg' loading={isSubmitting}>
            Submit Application
          </Button>
        </div>
      </form>
    </div>
  )
}
