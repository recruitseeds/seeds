import { Alert, AlertDescription, Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Input, Label } from '@seeds/ui'
import { submitJobApplication } from '@/lib/api'
import { AlertCircle, CheckCircle, Loader2, Upload } from 'lucide-react'
import type React from 'react'
import { useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'

interface ApplicationFormProps {
  jobId: string
  onSuccess?: (response: any) => void
  onError?: (error: any) => void
  className?: string
}

export function ApplicationForm({ jobId, onSuccess, onError, className }: ApplicationFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
  })
  const [resumeFile, setResumeFile] = useState<File | null>(null)
  const [resumeFileData, setResumeFileData] = useState<{
    fileName: string
    content: string
    mimeType: string
  } | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [applicationStatus, setApplicationStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [applicationResponse, setApplicationResponse] = useState<any>(null)
  const [errorMessage, setErrorMessage] = useState<string>('')

  const submissionInProgress = useRef(false)
  const lastSubmissionTime = useRef<number>(0)
  const submissionCount = useRef(0)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (applicationStatus === 'success' && applicationResponse) {
      const timer = setTimeout(() => {
        resetForm()
      }, 10000)
      return () => clearTimeout(timer)
    }
  }, [applicationStatus, applicationResponse])

  const resetForm = () => {
    setFormData({ name: '', email: '', phone: '' })
    setResumeFile(null)
    setResumeFileData(null)
    setApplicationStatus('idle')
    setApplicationResponse(null)
    setErrorMessage('')
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
    submissionInProgress.current = false
    setIsSubmitting(false)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const maxSize = 5 * 1024 * 1024
    if (file.size > maxSize) {
      toast.error('File too large. Maximum size is 5MB.')
      return
    }

    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
    ]

    if (!allowedTypes.includes(file.type)) {
      toast.error('Invalid file type. Please upload a PDF, DOC, DOCX, or TXT file.')
      return
    }

    setResumeFile(file)

    const reader = new FileReader()
    reader.onload = (event) => {
      const base64 = event.target?.result as string
      const base64Content = base64.split(',')[1]
      setResumeFileData({
        fileName: file.name,
        content: base64Content,
        mimeType: file.type,
      })
    }
    reader.readAsDataURL(file)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const submissionId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    const currentTime = Date.now()
    const timeSinceLastSubmission = currentTime - lastSubmissionTime.current

    console.log('Form submission attempt', {
      submissionId,
      submissionCount: submissionCount.current + 1,
      timeSinceLastSubmission,
      isSubmitting,
      submissionInProgress: submissionInProgress.current,
      jobId,
      email: formData.email,
    })

    if (submissionInProgress.current) {
      console.warn('Submission already in progress - blocking', {
        submissionId,
      })
      return
    }

    if (isSubmitting) {
      console.warn('Form is submitting - blocking', { submissionId })
      return
    }

    if (timeSinceLastSubmission < 2000) {
      console.error('Rapid submission detected - blocking', {
        submissionId,
        timeSinceLastSubmission,
      })
      toast.error('Please wait a moment before submitting again')
      return
    }

    if (!formData.name || !formData.email || !resumeFileData) {
      toast.error('Please fill in all required fields')
      return
    }

    submissionInProgress.current = true
    setIsSubmitting(true)
    lastSubmissionTime.current = currentTime
    submissionCount.current += 1

    console.log('Proceeding with submission', {
      submissionId,
      submissionNumber: submissionCount.current,
    })

    try {
      console.log('Making API request', {
        submissionId,
        url: `/test/v1/public/jobs/${jobId}/apply`,
        method: 'POST',
        payload: {
          email: formData.email,
          fileName: resumeFileData.fileName,
        },
      })

      const response = await submitJobApplication(jobId, {
        candidateData: formData,
        resumeFile: resumeFileData,
      })

      console.log('API response received', {
        submissionId,
        success: response.success,
        applicationId: response.data?.applicationId,
        status: response.data?.status,
      })

      if (response.success) {
        setApplicationStatus('success')
        setApplicationResponse(response.data)
        onSuccess?.(response)

        setTimeout(() => {
          resetForm()
        }, 5000)
      }
    } catch (error: any) {
      console.error('Submission error', {
        submissionId,
        error: error.message,
        code: error.code,
      })

      if (error.code === 'DUPLICATE_APPLICATION') {
        console.warn('Duplicate application error', {
          submissionId,
          timeSinceLastSubmission,
          submissionCount: submissionCount.current,
        })
      }

      setApplicationStatus('error')
      setErrorMessage(error.message || 'An error occurred while submitting your application')
      onError?.(error)
    } finally {
      setTimeout(() => {
        submissionInProgress.current = false
        setIsSubmitting(false)
        console.log('Submission flags reset', { submissionId })
      }, 500)
    }
  }

  if (applicationStatus === 'success' && applicationResponse) {
    return (
      <Card className={className}>
        <CardContent className='pt-6'>
          <div className='space-y-4'>
            <div className='flex items-center space-x-2 text-green-600'>
              <CheckCircle className='h-5 w-5' />
              <span className='font-semibold'>Application Submitted Successfully!</span>
            </div>
            <p className='text-sm text-muted-foreground'>Application ID: {applicationResponse.applicationId}</p>
            {applicationResponse.score && <p className='text-sm'>Match Score: {applicationResponse.score}%</p>}
            <p className='text-sm'>{applicationResponse.nextSteps}</p>
            <Button onClick={resetForm} variant='outline' className='w-full'>
              Apply to Another Position
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Apply for This Position</CardTitle>
        <CardDescription>Submit your application and we'll get back to you soon</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className='space-y-4'>
          <div className='space-y-2'>
            <Label htmlFor='name'>Full Name *</Label>
            <Input
              id='name'
              name='name'
              value={formData.name}
              onChange={handleInputChange}
              required
              disabled={isSubmitting}
              placeholder='John Doe'
            />
          </div>

          <div className='space-y-2'>
            <Label htmlFor='email'>Email Address *</Label>
            <Input
              id='email'
              name='email'
              type='email'
              value={formData.email}
              onChange={handleInputChange}
              required
              disabled={isSubmitting}
              placeholder='john@example.com'
            />
          </div>

          <div className='space-y-2'>
            <Label htmlFor='phone'>Phone Number</Label>
            <Input
              id='phone'
              name='phone'
              type='tel'
              value={formData.phone}
              onChange={handleInputChange}
              disabled={isSubmitting}
              placeholder='+1 (555) 123-4567'
            />
          </div>

          <div className='space-y-2'>
            <Label htmlFor='resume'>Resume *</Label>
            <div className='flex items-center space-x-2'>
              <Input
                ref={fileInputRef}
                id='resume'
                type='file'
                accept='.pdf,.doc,.docx,.txt'
                onChange={handleFileChange}
                disabled={isSubmitting}
                className='flex-1'
              />
              {resumeFile && (
                <div className='flex items-center text-sm text-muted-foreground'>
                  <Upload className='h-4 w-4 mr-1' />
                  {resumeFile.name}
                </div>
              )}
            </div>
            <p className='text-xs text-muted-foreground'>Accepted formats: PDF, DOC, DOCX, TXT (max 5MB)</p>
          </div>

          {applicationStatus === 'error' && errorMessage && (
            <Alert variant='destructive'>
              <AlertCircle className='h-4 w-4' />
              <AlertDescription>{errorMessage}</AlertDescription>
            </Alert>
          )}

          <Button
            type='submit'
            disabled={isSubmitting || !formData.name || !formData.email || !resumeFileData}
            className='w-full'
            onClick={(e) => {
              console.log('Submit button clicked', {
                isSubmitting,
                submissionInProgress: submissionInProgress.current,
                timestamp: new Date().toISOString(),
              })
            }}>
            {isSubmitting ? (
              <>
                <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                Submitting...
              </>
            ) : (
              'Submit Application'
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
