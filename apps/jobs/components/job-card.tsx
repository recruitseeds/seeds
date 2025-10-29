'use client'

import { Badge } from '@seeds/ui/badge'
import { Button } from '@seeds/ui/button'
import { Bookmark, Clock, MapPin } from 'lucide-react'
import Link from 'next/link'
import { useSavedJobCheck, useSaveJob, useUnsaveJob } from '../lib/queries'
import { useAuth } from './auth-provider'

interface Job {
  id: string
  title: string
  company: string
  companySlug?: string
  location: string
  type: 'Full-time' | 'Part-time' | 'Contract' | 'Internship'
  salary: string
  salaryMin?: number
  salaryMax?: number
  remote: 'Remote' | 'Hybrid' | 'On-site'
  posted: string
  tags: string[]
  logo?: string
  department?: string
  applicants?: number
  easyApply?: boolean
  urgency?: 'Closing soon' | 'Urgent'
  matchScore?: number
}

interface JobCardProps {
  job: Job
  onAuthRequired?: () => void
}

export function JobCard({ job, onAuthRequired }: JobCardProps) {
  const { isAuthenticated, user } = useAuth()
  const saveJob = useSaveJob(user?.email)
  const unsaveJob = useUnsaveJob(user?.email)

  // TODO: Saved jobs feature commented out for now
  // const { data: savedData } = useSavedJobCheck(job.id, user?.email)
  const isSaved = false // savedData?.data.isSaved ?? false

  const handleSave = async (e: React.MouseEvent) => {
    e.stopPropagation()
    // TODO: Saved jobs feature commented out for now
    console.log('Save job feature temporarily disabled')
    // if (!isAuthenticated && onAuthRequired) {
    //   // Show auth dialog if user is not authenticated
    //   onAuthRequired()
    // } else if (isAuthenticated) {
    //   // Simple save/unsave operations
    //   try {
    //     if (isSaved) {
    //       await unsaveJob.mutateAsync(job.id)
    //     } else {
    //       await saveJob.mutateAsync(job.id)
    //     }
    //   } catch (error) {
    //     console.error('Failed to toggle save job:', error)
    //   }
    // }
  }

  const handleCardClick = () => {
    window.location.href = `/browse/${job.id}`
  }

  const getCompanyInitials = (name: string): string => {
    return name
      .split(' ')
      .map((word) => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <div
      onClick={handleCardClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          handleCardClick()
        }
      }}
      tabIndex={0}
      role='button'
      className='group bg-background p-6 transition-colors hover:bg-muted/30 cursor-pointer'>
      <div className='flex gap-4'>
        {/* Company Logo */}
        <div className='flex-shrink-0'>
          <div className='w-12 h-12 bg-muted rounded-lg flex items-center justify-center'>
            <span className='text-xs font-semibold text-muted-foreground'>{getCompanyInitials(job.company)}</span>
          </div>
        </div>

        {/* Main Content */}
        <div className='flex-1 min-w-0'>
          {/* Title and Company */}
          <div className='mb-2'>
            <h3 className='text-base font-semibold text-foreground group-hover:text-primary transition-colors'>
              {job.title}
            </h3>
            <p className='text-sm text-muted-foreground'>{job.company}</p>
          </div>

          {/* Location and Meta */}
          <div className='flex flex-wrap items-center gap-x-4 gap-y-1 mb-3 text-sm text-muted-foreground'>
            <span className='flex items-center gap-1'>
              <MapPin className='w-3.5 h-3.5' />
              {job.location}
            </span>
            <span className='flex items-center gap-1'>
              <Clock className='w-3.5 h-3.5' />
              {job.posted}
            </span>
            <span className='flex items-center gap-1'>{job.salary}</span>
          </div>

          <div className='flex flex-wrap gap-2'>
            <Badge variant='secondary' className='text-xs'>
              {job.type}
            </Badge>
            <Badge variant='secondary' className='text-xs'>
              {job.remote}
            </Badge>
            {job.tags.slice(0, 2).map((tag) => (
              <Badge key={tag} variant='secondary' className='text-xs'>
                {tag}
              </Badge>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className='flex items-center gap-2'>
          {/* TODO: Saved jobs feature temporarily hidden */}
          {/* <Button
            variant='ghost'
            size='icon'
            onClick={handleSave}
            className='h-8 w-8'
            disabled={saveJob.isPending || unsaveJob.isPending}>
            <Bookmark
              className={`w-4 h-4 ${isSaved ? 'fill-current text-primary' : ''} ${saveJob.isPending || unsaveJob.isPending ? 'opacity-50' : ''}`}
            />
          </Button> */}

          <Button asChild variant='outline' size='sm'>
            <Link href={`/browse/${job.id}`}>View</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
