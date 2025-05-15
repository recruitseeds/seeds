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
import {
  AlertCircle,
  ArrowUpRight,
  Calendar,
  CheckCircle2,
  Clock,
  XCircle as XCircleStatus,
} from 'lucide-react'
import { useMemo } from 'react'
import { Button } from '../ui/button'

type Application = {
  id: string
  job_title: string | null
  company_name: string | null
  status: string | null
  application_date: string | null
  next_step_description?: string | null
  next_step_date?: string | null
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

export function ExperienceDialogTimeline({
  application,
}: ExperienceDialogTimelineProps) {
  const { timelineItems, activeTimelineStep } = useMemo(() => {
    const items = []
    if (!application) {
      return { timelineItems: [], activeTimelineStep: 0 }
    }

    items.push({
      id: 'applied',
      step: 1,
      date: formatDate(application.application_date),
      title: 'Application Submitted',
      description: `You applied for the ${
        application.job_title || 'position'
      } at ${application.company_name || 'the company'}.`,
    })

    items.push({
      id: 'in-review',
      step: 2,
      date:
        application.status === 'in-review'
          ? 'Current Stage'
          : formatDate(application.application_date),
      title: 'Application In Review',
      description: 'Your application is being reviewed by the hiring team.',
    })

    const interviewDate = application.next_step_date
    const interviewDesc =
      application.next_step_description || 'Interview details pending.'
    items.push({
      id: 'interview',
      step: 3,
      date:
        application.status === 'interview'
          ? formatDate(interviewDate)
          : 'Upcoming',
      title:
        application.status === 'interview'
          ? application.next_step_description || 'Interview Scheduled'
          : 'Interview Stage',
      description:
        application.status === 'interview'
          ? interviewDesc
          : 'Potential next step: interviews with the team.',
    })

    items.push({
      id: 'decision',
      step: 4,
      date:
        application.status === 'offer' || application.status === 'rejected'
          ? formatDate(application.application_date)
          : 'Upcoming',
      title:
        application.status === 'offer'
          ? 'Offer Extended'
          : application.status === 'rejected'
          ? 'Application Outcome'
          : 'Final Decision',
      description:
        application.status === 'offer'
          ? 'Congratulations! You have received an offer.'
          : application.status === 'rejected'
          ? 'The hiring process has concluded for this application.'
          : 'Awaiting the final outcome of your application.',
    })
    return { timelineItems: items, activeTimelineStep: 2 }
  }, [application])

  return (
    <ScrollArea className='h-[calc(100vh-10rem)]'>
      <div className='overflow-y-auto px-6 py-4 space-y-6'>
        <div className='space-y-1'>
          <h3 className='text-lg font-semibold'>{application.job_title}</h3>
          <p className='text-sm text-muted-foreground'>
            {application.company_name} &#8226;
            <Button size='sm' variant='link' className='text-brand px-1 gap-1'>
              Job posting
              <ArrowUpRight className='size-3' />
            </Button>
            {/* TODO: Add job url to candidate_applications table */}
            {/* {application.company_name || 'N/A'} - {application.job_url} */}
          </p>
        </div>
        <div className='space-y-1'>
          <Label className='text-xs text-muted-foreground'>Status</Label>
          <div>{getStatusBadge(application.status)}</div>
        </div>
        <div>
          <h4 className='text-base font-semibold mb-3'>Application Journey</h4>
          <Timeline defaultValue={activeTimelineStep}>
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
      </div>
    </ScrollArea>
  )
}
