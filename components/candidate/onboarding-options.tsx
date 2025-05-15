'use client'

import { parseAndStoreResumeAction } from '@/actions/parse-resume-action'
import { ResumeUploader } from '@/components/candidate/resume-uploader'
import { Button } from '@/components/ui/button'
import {
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import type { CandidateUploadedFileMetadata } from '@/supabase/mutations'
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle,
  FileText,
  Loader2,
  PenLine,
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

const formatFileSize = (bytes: number | string | null | undefined): string => {
  const numericBytes = Number(bytes || 0)
  if (isNaN(numericBytes) || numericBytes <= 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  if (numericBytes < 1) return `${numericBytes} Bytes`
  const i = Math.floor(Math.log(numericBytes) / Math.log(k))
  const index = Math.min(i, sizes.length - 1)
  const sizeValue = Number.parseFloat(
    (numericBytes / Math.pow(k, index)).toFixed(2)
  )
  if (isNaN(sizeValue)) return 'N/A'
  return sizeValue + ' ' + sizes[index]
}

interface ParseResumeActionPayload {
  extractedData?: unknown
  message: string
}

interface ParseResumeActionResult {
  success: boolean
  data?: ParseResumeActionPayload
  error?: { message?: string; code?: string; [key: string]: unknown } | null
}

interface ActionHookResult<
  TSuccessData = unknown,
  TErrorData = {
    message?: string
    code?: string
    [key: string]: unknown
  } | null,
  TActionResult extends {
    success: boolean
    data?: TSuccessData
    error?: TErrorData
  } = { success: boolean; data?: TSuccessData; error?: TErrorData }
> {
  data?: TActionResult
  serverError?: string
  validationErrors?: Record<string, string[]>
}

interface PreOnboardingOptionsProps {
  existingResume?: CandidateUploadedFileMetadata | null
}

export function PreOnboardingOptions({
  existingResume,
}: PreOnboardingOptionsProps) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<string>('upload')
  const [isProcessing, setIsProcessing] = useState<boolean>(false)
  const [processError, setProcessError] = useState<string | null>(null)
  const [processSuccess, setProcessSuccess] = useState<boolean>(false)

  const handleNavigation = (path: string) => {
    router.push(path)
  }

  const handleResumeUpload = async (file: File) => {
    if (existingResume) {
      console.warn('handleResumeUpload called unexpectedly when resume exists.')
      return
    }

    setIsProcessing(true)
    setProcessError(null)
    setProcessSuccess(false)
    const formData = new FormData()
    formData.append('resumeFile', file)

    try {
      const hookResult = await (
        parseAndStoreResumeAction as unknown as (
          clientInput: FormData
        ) => Promise<
          ActionHookResult<
            ParseResumeActionPayload,
            ParseResumeActionResult['error'],
            ParseResumeActionResult
          >
        >
      )(formData)

      console.log(
        'Received raw hookResult:',
        JSON.stringify(hookResult, null, 2)
      )

      const actionResponse = hookResult?.data

      if (hookResult.serverError) {
        console.error('Server error from action:', hookResult.serverError)
        throw new Error(hookResult.serverError)
      }

      if (hookResult.validationErrors) {
        console.error(
          'Validation errors from action:',
          hookResult.validationErrors
        )
        const messages = Object.values(hookResult.validationErrors)
          .flat()
          .join(', ')
        throw new Error(`Validation failed: ${messages}`)
      }

      if (!actionResponse) {
        console.error(
          'Action response payload (hookResult.data) is missing.',
          hookResult
        )
        throw new Error('Invalid response structure received from action hook.')
      }

      if (actionResponse.success) {
        console.log(
          'Action successful:',
          actionResponse.data?.message || 'Resume processed.'
        )
        setProcessError(null)
        setProcessSuccess(true)
      } else {
        console.error(
          'Action reported failure:',
          actionResponse.error,
          'Full hook result:',
          hookResult
        )
        const errorMsg =
          actionResponse.error?.message ||
          'Processing failed. Please try again.'
        setProcessError(errorMsg)
        setProcessSuccess(false)
      }
    } catch (error: unknown) {
      console.error(
        'Critical error calling or processing parseAndStoreResumeAction:',
        error
      )
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'A critical error occurred calling the action.'
      setProcessError(errorMessage)
      setProcessSuccess(false)
    } finally {
      setIsProcessing(false)
    }
  }

  const resetProcess = () => {
    setProcessError(null)
    setProcessSuccess(false)
    setIsProcessing(false)
    setActiveTab('upload')
  }

  return (
    <div className='container mx-auto max-w-4xl'>
      <CardHeader className='text-center'>
        <CardTitle className='text-2xl'>
          Welcome to Your Application Journey
        </CardTitle>
        <CardDescription>
          {existingResume
            ? 'We found your saved resume. You can continue or start manually.'
            : "Choose how you'd like to start building your candidate profile."}
        </CardDescription>
      </CardHeader>
      <CardContent className='py-5'>
        {!isProcessing && !processError && !processSuccess && (
          <Tabs
            defaultValue='upload'
            value={activeTab}
            onValueChange={setActiveTab}
            className='w-full'>
            <TabsList className='mb-8 grid w-full grid-cols-2'>
              <TabsTrigger value='upload' disabled={isProcessing}>
                <FileText className='mr-2 h-4 w-4' />{' '}
                {existingResume ? 'View Saved Resume' : 'Upload Resume'}
              </TabsTrigger>
              <TabsTrigger value='manual' disabled={isProcessing}>
                <PenLine className='mr-2 h-4 w-4' /> Enter Manually
              </TabsTrigger>
            </TabsList>

            <TabsContent value='upload' className='space-y-6'>
              {existingResume ? (
                <div className='space-y-6 text-center'>
                  <h3 className='mb-2 text-lg font-medium'>
                    Your Saved Resume
                  </h3>
                  <div className='flex items-center p-4 border rounded-lg bg-muted/40 text-left'>
                    <FileText className='size-6 mr-4 flex-shrink-0' />
                    <div className='flex-1 min-w-0'>
                      <p className='font-medium truncate'>
                        {existingResume.file_name}
                      </p>
                      <p className='text-sm text-muted-foreground'>
                        {formatFileSize(existingResume.size_bytes)} - (Saved)
                      </p>
                    </div>
                  </div>
                  <p className='text-muted-foreground'>
                    You can continue with this resume to pre-fill your profile.
                  </p>
                  <Button
                    size='lg'
                    onClick={() =>
                      handleNavigation('/candidate-onboarding/personal')
                    }
                    className='w-full max-w-xs mx-auto'
                    variant='default'>
                    Continue with Saved Resume{' '}
                    <ArrowRight className='ml-2 h-4 w-4' />
                  </Button>
                </div>
              ) : (
                <>
                  <div className='mb-6 text-center'>
                    <h3 className='mb-2 text-lg font-medium'>
                      Upload Your Resume
                    </h3>
                    <p className='text-muted-foreground'>
                      We&apos;ll automatically extract information to save you
                      time.
                    </p>
                  </div>
                  <ResumeUploader
                    onUpload={handleResumeUpload}
                    isExtracting={isProcessing}
                    onCancel={() => {}}
                  />
                </>
              )}
            </TabsContent>

            <TabsContent value='manual' className='space-y-6'>
              <div className='mb-6 text-center'>
                <h3 className='mb-2 text-lg font-medium'>
                  Enter Your Information Manually
                </h3>
                <p className='text-muted-foreground'>
                  {existingResume
                    ? 'Proceed without using your saved resume and fill out everything manually.'
                    : "You'll be guided through our step-by-step process."}
                </p>
              </div>
              <div className='flex justify-center'>
                <Button
                  size='lg'
                  onClick={() =>
                    handleNavigation('/candidate-onboarding/personal')
                  }>
                  Start Manual Entry <ArrowRight className='ml-2 h-4 w-4' />
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        )}

        {isProcessing && (
          <div className='flex flex-col items-center justify-center py-10 text-center'>
            <Loader2 className='h-12 w-12 animate-spin text-primary mb-4' />
            <p className='text-muted-foreground'>
              Processing your resume, please wait...
            </p>
          </div>
        )}

        {!isProcessing && processError && (
          <div className='space-y-6 text-center'>
            <AlertTriangle className='mx-auto h-12 w-12 text-destructive' />
            <h3 className='text-lg font-medium text-destructive'>
              Processing Failed
            </h3>
            <p className='text-muted-foreground'>{processError}</p>
            <Button variant='outline' onClick={resetProcess}>
              Try Again
            </Button>
          </div>
        )}

        {!isProcessing && processSuccess && !processError && (
          <div className='space-y-6 text-center'>
            <CheckCircle className='mx-auto h-12 w-12 text-green-500' />
            <h3 className='text-lg font-medium'>
              Resume Processed Successfully!
            </h3>
            <p className='text-muted-foreground'>
              Your resume has been uploaded and processed. You can now proceed.
            </p>
            <div className='flex justify-center gap-4'>
              <Button
                onClick={() =>
                  handleNavigation('/candidate-onboarding/personal')
                }>
                Continue <ArrowRight className='ml-2 h-4 w-4' />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
      <CardFooter className='flex justify-center border-t pt-6'>
        <p className='max-w-md text-center text-sm text-muted-foreground'>
          Your information is secure and will only be used for your job
          applications within our platform.
        </p>
      </CardFooter>
    </div>
  )
}
