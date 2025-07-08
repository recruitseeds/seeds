'use client'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Timeline,
  TimelineContent,
  TimelineDate,
  TimelineHeader,
  TimelineIndicator,
  TimelineItem,
  TimelineSeparator,
  TimelineTitle,
} from '@/components/ui/timeline'
import { formatDate } from '@/lib/dates'
import { parseNextSteps } from '@/lib/next-steps'
import { AlertCircle, ArrowUpRight, Calendar, CheckCircle2, Clock, Info, XCircle as XCircleStatus } from 'lucide-react'
import { useMemo } from 'react'
import { Alert, AlertDescription } from '../ui/alert'
import { Button } from '../ui/button'

type Application = {
  id: string
  job_title: string | null
  company_name: string | null
  status: string | null
  application_date: string | null
  next_step_description?: string | null
  next_step_date?: string | null
  next_steps?: Array<{
    id: string
    description: string
    date: string | null
    completed: boolean
  }> | null
  source: 'manual' | 'import' | 'platform' | null
  application_url?: string | null
}

interface ExperienceDialogTimelineProps {
  application: Application
}

const getStatusBadge = (status: string | null) => {
  switch (status) {
    case 'applied':
      return (
        <Badge variant='outline' className='flex items-center gap-1'>
          <Clock className='h-3 w-3' /> Applied
        </Badge>
      )
    case 'in-review':
      return (
        <Badge variant='warning' className='flex items-center gap-1'>
          <AlertCircle className='size-3' /> In Review
        </Badge>
      )
    case 'interview':
      return (
        <Badge variant='info' className='flex items-center gap-1'>
          <Calendar className='size-3' /> Interview
        </Badge>
      )
    case 'rejected':
      return (
        <Badge variant='destructive' className='flex items-center gap-1'>
          <XCircleStatus className='size-3' /> Rejected
        </Badge>
      )
    case 'offer':
      return (
        <Badge variant='success' className='flex items-center gap-1'>
          <CheckCircle2 className='size-3' /> Offer
        </Badge>
      )
    default:
      return <Badge variant='secondary'>{status || 'Unknown'}</Badge>
  }
}

export function ApplicationDialogTimeline({ application }: ExperienceDialogTimelineProps) {
  const { timelineItems, isManualApplication, currentStep } = useMemo(() => {
    const items = []
    const isManual = application.source === 'manual' || application.source === 'import' || application.source === null
    let activeStep = 1

    if (!application) {
      return { timelineItems: [], isManualApplication: true, currentStep: 1 }
    }

    items.push({
      id: 'applied',
      step: 1,
      date: formatDate(application.application_date),
      title: 'Application Submitted',
      description: `You applied for the ${application.job_title || 'position'} at ${
        application.company_name || 'the company'
      }.`,
      status: 'completed' as const,
    })

    if (isManual) {
      const parsedSteps = parseNextSteps(application.next_steps ?? null)

      if (parsedSteps && parsedSteps.length > 0) {
        let completedStepsCount = 0

        parsedSteps.forEach((nextStep, index) => {
          const stepNumber = items.length + 1
          const isCompleted = nextStep.completed

          if (isCompleted) {
            completedStepsCount++
          }

          items.push({
            id: `custom-step-${nextStep.id}`,
            step: stepNumber,
            date: nextStep.date ? formatDate(nextStep.date) : 'No date set',
            title: nextStep.description || `Step ${index + 1}`,
            description: nextStep.completed ? 'This step has been completed.' : 'This step is pending.',
            status: nextStep.completed ? ('completed' as const) : ('pending' as const),
          })
        })

        if (completedStepsCount === parsedSteps.length) {
          activeStep = items.length
        } else {
          activeStep = 2 + completedStepsCount
        }
      } else if (application.next_step_description && application.next_step_date) {
        items.push({
          id: 'legacy-next',
          step: 2,
          date: formatDate(application.next_step_date),
          title: application.next_step_description,
          description: 'Next step for this application.',
          status: 'pending' as const,
        })
        activeStep = 2
      } else {
        items.push({
          id: 'awaiting-response',
          step: 2,
          date: 'Pending',
          title: 'Awaiting Response',
          description: 'Waiting to hear back from the company.',
          status: application.status === 'in-review' ? ('current' as const) : ('pending' as const),
        })
        activeStep = 2
      }
    } else {
      items.push({
        id: 'in-review',
        step: 2,
        date: application.status === 'in-review' ? 'Current Stage' : 'Pending',
        title: 'Application Review',
        description: 'The hiring team is reviewing your application.',
        status: application.status === 'in-review' ? ('current' as const) : ('pending' as const),
      })

      if (application.next_step_description || application.status === 'interview') {
        items.push({
          id: 'interview',
          step: 3,
          date: application.next_step_date ? formatDate(application.next_step_date) : 'To be scheduled',
          title: application.next_step_description || 'Interview',
          description: application.next_step_description
            ? `${application.next_step_description} scheduled.`
            : 'Interview with the team.',
          status: application.status === 'interview' ? ('current' as const) : ('pending' as const),
        })
      }

      if (application.status === 'in-review') {
        activeStep = 2
      } else if (application.status === 'interview') {
        activeStep = 3
      }
    }

    if (application.status === 'offer' || application.status === 'rejected') {
      const finalStep = items.length + 1
      items.push({
        id: 'decision',
        step: finalStep,
        date: 'Completed',
        title: application.status === 'offer' ? 'Offer Extended' : 'Application Concluded',
        description:
          application.status === 'offer'
            ? 'Congratulations! You have received an offer.'
            : 'The hiring process has concluded for this application.',
        status: 'completed' as const,
      })
      activeStep = finalStep
    }

    return {
      timelineItems: items,
      isManualApplication: isManual,
      currentStep: activeStep,
    }
  }, [application])

  return (
    <ScrollArea className='h-[calc(100vh-10rem)]'>
      <div className='overflow-y-auto px-6 py-4 space-y-6'>
        <div className='space-y-1'>
          <h3 className='text-lg font-semibold'>{application.job_title}</h3>
          <p className='text-sm text-muted-foreground'>
            {application.company_name}
            {application.application_url && (
              <>
                {' '}
                &#8226;{' '}
                <Button size='sm' variant='link' className='text-brand px-1 gap-1' asChild>
                  <a href={application.application_url} target='_blank' rel='noopener noreferrer'>
                    Job posting
                    <ArrowUpRight className='size-3' />
                  </a>
                </Button>
              </>
            )}
          </p>
        </div>

        <div className='space-y-1'>
          <Label className='text-xs text-muted-foreground'>Status</Label>
          <div>{getStatusBadge(application.status)}</div>
        </div>

        {isManualApplication && (
          <Alert>
            <Info className='h-4 w-4' />
            <AlertDescription>
              This is a {application.source === 'import' ? 'imported' : 'self-entered'} application. You can define
              custom next steps by editing the application.
            </AlertDescription>
          </Alert>
        )}

        <div>
          <h4 className='text-base font-semibold mb-3'>
            {isManualApplication ? 'Application Timeline' : 'Hiring Process'}
          </h4>
          <Timeline value={currentStep}>
            {timelineItems.map((item) => (
              <TimelineItem key={item.id} step={item.step}>
                <TimelineHeader>
                  <TimelineSeparator />
                  <TimelineDate>{item.date}</TimelineDate>
                  <TimelineTitle>{item.title}</TimelineTitle>
                  <TimelineIndicator />
                </TimelineHeader>
                <TimelineContent>{item.description}</TimelineContent>
              </TimelineItem>
            ))}
          </Timeline>
        </div>

        {!isManualApplication && (
          <div className='bg-muted/50 p-4 rounded-lg'>
            <h5 className='font-medium mb-2'>Company-Managed Process</h5>
            <p className='text-sm text-muted-foreground'>
              The hiring process for this position is managed by {application.company_name}. Next steps and timeline
              updates will be communicated directly by the company.
            </p>
          </div>
        )}
      </div>
    </ScrollArea>
  )
}
