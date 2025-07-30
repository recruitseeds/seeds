'use client'

import { updateCandidateOnboardingStatusAction } from '@/actions/update-candidate-onboarding-status'
import { Button } from '@seeds/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@seeds/ui/card'
import { CheckCircle2 } from 'lucide-react'
import { useTransition } from 'react'
import { toast } from 'sonner'

interface OnboardingCompleteProps {
  profile: {
    completedSteps: {
      personalInfo?: boolean
      education?: boolean
      workExperience?: boolean
      files?: boolean
    }
    education?: { degrees: unknown[] }
    workExperience?: { jobs: unknown[] }
  }
}

export function OnboardingComplete({ profile }: OnboardingCompleteProps) {
  const [isPending, startTransition] = useTransition()

  const completedSteps = profile?.completedSteps ?? {}
  const totalSections = Object.keys(completedSteps).length
  const completedSectionsCount =
    Object.values(completedSteps).filter(Boolean).length

  const completionPercentage =
    totalSections > 0
      ? Math.round((completedSectionsCount / totalSections) * 100)
      : 0

  const handleViewProfileClick = () => {
    startTransition(async () => {
      try {
        await updateCandidateOnboardingStatusAction()
      } catch (error) {
        console.error('Failed to update onboarding status:', error)
        toast.error(
          `Failed to update status: ${
            error instanceof Error ? error.message : 'Unknown error'
          }`
        )
      }
    })
  }

  return (
    <div className='space-y-6'>
      <div className='flex flex-col items-center justify-center py-8'>
        <div className='rounded-full bg-success p-3 mb-4'>
          <CheckCircle2 className='h-12 w-12 text-success-foreground' />
        </div>
        <h2 className='text-2xl font-bold text-center mb-2'>
          Profile Created Successfully!
        </h2>
        <p className='text-muted-foreground text-center max-w-md'>
          Your candidate profile has been created. You can now start applying
          for jobs or complete any remaining sections.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Profile Completion</CardTitle>
          <CardDescription>
            Your profile is {completionPercentage}% complete
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className='space-y-4'>
            <div className='w-full bg-muted rounded-full h-2.5'>
              <div
                className='bg-primary h-2.5 rounded-full'
                style={{ width: `${completionPercentage}%` }}></div>
            </div>

            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              <div className='p-4 border rounded-lg'>
                <div className='flex items-center'>
                  <div
                    className={`w-4 h-4 rounded-full ${
                      completedSteps.personalInfo
                        ? 'bg-success border border-success-border'
                        : 'bg-warning border border-warning-border'
                    } mr-2`}></div>
                  <h3 className='font-medium'>Personal Information</h3>
                </div>
                <p className='text-sm text-muted-foreground mt-1'>
                  {completedSteps.personalInfo
                    ? 'Completed'
                    : 'Will finish later'}
                </p>
              </div>

              <div className='p-4 border rounded-lg'>
                <div className='flex items-center'>
                  <div
                    className={`w-4 h-4 rounded-full ${
                      completedSteps.education
                        ? 'bg-success border border-success-border'
                        : 'bg-warning border border-warning-border'
                    } mr-2`}></div>
                  <h3 className='font-medium'>Education</h3>
                </div>
                <p className='text-sm text-muted-foreground mt-1'>
                  {completedSteps.education
                    ? `${profile.education?.degrees?.length ?? 0} ${
                        (profile.education?.degrees?.length ?? 0) === 1
                          ? 'degree'
                          : 'degrees'
                      } added`
                    : 'Will finish later'}
                </p>
              </div>

              <div className='p-4 border rounded-lg'>
                <div className='flex items-center'>
                  <div
                    className={`w-4 h-4 rounded-full ${
                      completedSteps.workExperience
                        ? 'bg-success border border-success-border'
                        : 'bg-warning border border-warning-border'
                    } mr-2`}></div>
                  <h3 className='font-medium'>Work Experience</h3>
                </div>
                <p className='text-sm text-muted-foreground mt-1'>
                  {completedSteps.workExperience
                    ? `${profile.workExperience?.jobs?.length ?? 0} ${
                        (profile.workExperience?.jobs?.length ?? 0) === 1
                          ? 'job'
                          : 'jobs'
                      } added`
                    : 'Will finish later'}
                </p>
              </div>

              <div className='p-4 border rounded-lg'>
                <div className='flex items-center'>
                  <div
                    className={`w-4 h-4 rounded-full ${
                      completedSteps.files
                        ? 'bg-success border border-success-border'
                        : 'bg-warning border border-warning-border'
                    } mr-2`}></div>
                  <h3 className='font-medium'>Files</h3>
                </div>
                <p className='text-sm text-muted-foreground mt-1'>
                  {completedSteps.files
                    ? 'Documents uploaded'
                    : 'Will finish later'}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter className='flex justify-end'>
          <Button
            variant='default'
            onClick={handleViewProfileClick}
            disabled={isPending}>
            {isPending ? 'Processing...' : 'View Profile'}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
