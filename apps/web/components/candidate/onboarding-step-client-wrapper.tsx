'use client'

import { StepIndicator } from '@/components/candidate/steps-indicator'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@seeds/ui/card'
import { usePathname } from 'next/navigation'
import React from 'react'

interface Step {
  id: string
  title: string
  description: string
}

interface OnboardingStepClientWrapperProps {
  steps: Step[]
  children: React.ReactNode
}

export function OnboardingStepClientWrapper({
  steps,
  children,
}: OnboardingStepClientWrapperProps) {
  const pathname = usePathname()
  const currentSegment =
    pathname?.substring(pathname.lastIndexOf('/') + 1) || ''
  const currentStepIndex = steps.findIndex((step) => step.id === currentSegment)
  const currentStepDetails =
    currentStepIndex !== -1 ? steps[currentStepIndex] : null
  const indicatorSteps = steps.slice(0, -1)
  const isLastStep = currentStepIndex === steps.length - 1

  return (
    <Card>
      {!isLastStep && currentStepDetails && (
        <CardHeader>
          <div className='flex justify-between items-start flex-col'>
            <CardTitle className='text-2xl'>
              {currentStepDetails.title}
            </CardTitle>
            <CardDescription>{currentStepDetails.description}</CardDescription>
          </div>
        </CardHeader>
      )}

      {!isLastStep &&
        currentStepIndex >= 0 &&
        currentStepIndex < indicatorSteps.length && (
          <StepIndicator
            steps={indicatorSteps}
            currentStep={currentStepIndex}
          />
        )}
      <CardContent>{children}</CardContent>
    </Card>
  )
}
