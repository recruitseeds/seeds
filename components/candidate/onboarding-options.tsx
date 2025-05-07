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

export function PreOnboardingOptions() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<string>('upload')
  const [isProcessing, setIsProcessing] = useState<boolean>(false)
  const [processError, setProcessError] = useState<string | null>(null)
  const [processSuccess, setProcessSuccess] = useState<boolean>(false)

  const handleManualEntry = () => {
    router.push('/candidate-onboarding/personal')
  }

  const handleResumeUpload = async (file: File) => {
    setIsProcessing(true)
    setProcessError(null)
    setProcessSuccess(false)

    const formData = new FormData()
    formData.append('resumeFile', file)

    try {
      const storeResult: any = await parseAndStoreResumeAction(formData)

      console.log(
        'Received raw storeResult:',
        JSON.stringify(storeResult, null, 2)
      )

      if (storeResult?.data?.success) {
        console.log(
          'Action successful:',
          storeResult.data.data?.message || storeResult.data.message
        )
        setProcessError(null)
        setProcessSuccess(true)
      } else {
        console.error(
          'Action failed or structure unexpected. Full Result:',
          storeResult
        )

        const errorMsg =
          storeResult?.data?.error?.message ||
          'Processing failed. Please try again.'

        setProcessError(errorMsg)
        setProcessSuccess(false)
      }
    } catch (error: any) {
      console.error('Critical error calling parseAndStoreResumeAction:', error)
      setProcessError(
        error.message || 'A critical error occurred calling the action.'
      )
      setProcessSuccess(false)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleProceed = () => {
    router.push('/candidate-onboarding/personal')
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
          Choose how you&apos;d like to start building your candidate profile.
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
                <FileText className='mr-2 h-4 w-4' /> Upload Resume
              </TabsTrigger>
              <TabsTrigger value='manual' disabled={isProcessing}>
                <PenLine className='mr-2 h-4 w-4' /> Enter Manually
              </TabsTrigger>
            </TabsList>

            <TabsContent value='upload' className='space-y-6'>
              <div className='mb-6 text-center'>
                <h3 className='mb-2 text-lg font-medium'>Upload Your Resume</h3>
                <p className='text-muted-foreground'>
                  We&apos;ll automatically extract information to save you time.
                </p>
              </div>
              <ResumeUploader
                onUpload={handleResumeUpload}
                isExtracting={false}
                onCancel={() => {}}
              />
              {isProcessing && (
                <div className='text-center text-muted-foreground'>
                  Processing resume...
                </div>
              )}
            </TabsContent>

            <TabsContent value='manual' className='space-y-6'>
              <div className='mb-6 text-center'>
                <h3 className='mb-2 text-lg font-medium'>
                  Enter Your Information Manually
                </h3>
                <p className='text-muted-foreground'>
                  You&apos;ll be guided through our step-by-step process.
                </p>
              </div>
              <div className='flex justify-center'>
                <Button size='lg' onClick={handleManualEntry}>
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
              <Button variant='outline' onClick={resetProcess}>
                Upload Another
              </Button>
              <Button onClick={handleProceed}>
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
