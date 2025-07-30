'use client'

import { updateCandidateOnboardingStatusAction } from '@/actions/update-candidate-onboarding-status'
import { Button } from '@seeds/ui/button'
import { CheckCircle2, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useTransition } from 'react'

export default function Page() {
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  const handleViewProfileClick = () => {
    startTransition(async () => {
      try {
        const result = await updateCandidateOnboardingStatusAction({
          isOnboarded: true,
        })

        if (!result) {
          console.error('Failed to update status: No response from action.')
          return
        }

        if (result.data?.success) {
          console.log('Profile status updated! Redirecting...')
          router.push('/candidate/profile')
        } else {
          let errorMessage = 'An unknown error occurred.'

          if (result.serverError) {
            errorMessage = result.serverError
          } else if (result.validationErrors) {
            const errorMessages: string[] = []
            for (const key in result.validationErrors) {
              const errors =
                result.validationErrors[
                  key as keyof typeof result.validationErrors
                ]
              if (Array.isArray(errors)) {
                errorMessages.push(...errors)
              }
            }
            errorMessage = errorMessages.join('; ') || 'Validation failed.'
          } else if (result.data?.error) {
            errorMessage = result.data.error.message
          }
          console.error(`Failed to update status: ${errorMessage}`)
        }
      } catch (error) {
        console.error('Failed to update onboarding status (exception):', error)
      }
    })
  }

  return (
    <div className='flex flex-col items-center justify-center space-y-6 py-12 text-center h-[calc(100vh-100px)]'>
      <div className='rounded-full bg-success p-4'>
        <CheckCircle2 className='h-16 w-16 text-success-foreground' />
      </div>
      <h2 className='text-3xl font-bold'>Profile Created Successfully!</h2>
      <p className='text-muted-foreground max-w-md text-lg'>
        Your candidate profile is ready. You can always come back to update your
        information or add more details later.
      </p>
      <Button size='lg' onClick={handleViewProfileClick} disabled={isPending}>
        {isPending ? (
          <>
            <Loader2 className='mr-2 h-4 w-4 animate-spin' />
            Processing...
          </>
        ) : (
          'View Your Profile'
        )}
      </Button>
    </div>
  )
}
