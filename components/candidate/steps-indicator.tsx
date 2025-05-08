import { Steps } from '@ark-ui/react/steps'
import { Check } from 'lucide-react'
import Link from 'next/link' // 1. Import Link

interface Step {
  id: string
  title: string
}

interface StepIndicatorProps {
  steps: Step[]
  currentStep: number
}

export function StepIndicator({ steps, currentStep }: StepIndicatorProps) {
  if (!steps || steps.length === 0) {
    return null
  }

  const segments = steps.length - 1
  const completedSegments = currentStep
  const progressFraction = segments <= 0 ? 0 : completedSegments / segments
  const progressPercentage = progressFraction * 100

  return (
    <div className='px-10 py-4 border-y'>
      <Steps.Root count={steps.length}>
        <Steps.List className='relative flex justify-between'>
          <div className='absolute left-0 right-0 top-4 h-0.5'>
            <div className='relative h-full mx-4'>
              <div className='absolute inset-0 -translate-y-px bg-secondary' />
              <div
                className='absolute left-0 top-0 h-full -translate-y-px bg-primary'
                style={{
                  width: `${progressPercentage}%`,
                  transition: 'width 0.3s ease-in-out',
                }}
              />
            </div>
          </div>

          {steps.map((step, index) => (
            <Steps.Item key={step.id} index={index} className='relative z-10'>
              <Steps.Trigger asChild>
                <Link
                  href={step.id}
                  className='flex flex-col items-center w-8 text-center no-underline'>
                  <Steps.Indicator
                    className={`flex h-8 w-8 items-center justify-center rounded-full border-1 ${
                      index < currentStep
                        ? 'border-primary bg-primary text-primary-foreground'
                        : index === currentStep
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'border-secondary bg-background text-muted-foreground'
                    } transition-colors duration-300 ease-in-out`}>
                    {index < currentStep ? (
                      <Check className='size-5' />
                    ) : (
                      <span className='text-sm font-medium'>{index + 1}</span>
                    )}
                  </Steps.Indicator>
                  <div
                    className={`mt-1.5 w-max max-w-[60px] text-xs font-medium ${
                      index <= currentStep
                        ? 'text-foreground'
                        : 'text-muted-foreground'
                    } transition-colors duration-300 ease-in-out`}>
                    {step.title}
                  </div>
                </Link>
              </Steps.Trigger>
              <Steps.Separator className='hidden' />
            </Steps.Item>
          ))}
        </Steps.List>
      </Steps.Root>
    </div>
  )
}
