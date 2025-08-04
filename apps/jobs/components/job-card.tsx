'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Badge } from '@seeds/ui/badge'
import { Button } from '@seeds/ui/button'
import { Bookmark, MapPin, Clock, DollarSign, Users, Zap, AlertCircle } from 'lucide-react'

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
  const [isSaved, setIsSaved] = useState(false)

  const handleSave = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (onAuthRequired) {
      onAuthRequired()
    } else {
      setIsSaved(!isSaved)
    }
  }

  const handleApply = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (onAuthRequired) {
      onAuthRequired()
    } else {
      // Navigate to application page
      const companySlug = job.companySlug || job.company.toLowerCase().replace(/\s+/g, '-')
      window.location.href = `/${companySlug}/${job.id}`
    }
  }

  const handleCardClick = () => {
    const companySlug = job.companySlug || job.company.toLowerCase().replace(/\s+/g, '-')
    window.location.href = `/${companySlug}/${job.id}`
  }

  const getCompanyInitials = (name: string): string => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <div 
      onClick={handleCardClick}
      className='group bg-card border border-border rounded-xl p-6 transition-all hover:border-primary/30 hover:shadow-sm cursor-pointer'
    >
      <div className='flex gap-4'>
        {/* Company Logo Section */}
        <div className='flex-shrink-0'>
          {job.logo ? (
            <Image
              src={job.logo}
              alt={`${job.company} logo`}
              width={56}
              height={56}
              className='rounded-lg object-cover'
            />
          ) : (
            <div className='w-14 h-14 bg-muted rounded-lg flex items-center justify-center'>
              <span className='text-sm font-semibold text-muted-foreground'>
                {getCompanyInitials(job.company)}
              </span>
            </div>
          )}
        </div>

        {/* Main Content Section */}
        <div className='flex-1 min-w-0'>
          {/* Job Title & Company */}
          <div className='mb-3'>
            <h3 className='text-lg font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-1'>
              {job.title}
            </h3>
            <p className='text-sm text-muted-foreground'>{job.company}</p>
          </div>

          {/* Meta Information */}
          <div className='flex flex-wrap items-center gap-x-4 gap-y-1 mb-3 text-sm text-muted-foreground'>
            <span className='flex items-center gap-1'>
              <MapPin className='w-3.5 h-3.5' />
              {job.location}
            </span>
            <span className='flex items-center gap-1'>
              <Clock className='w-3.5 h-3.5' />
              {job.posted}
            </span>
            {job.salary && (
              <span className='flex items-center gap-1'>
                <DollarSign className='w-3.5 h-3.5' />
                {job.salary}
              </span>
            )}
            {job.applicants && (
              <span className='flex items-center gap-1'>
                <Users className='w-3.5 h-3.5' />
                {job.applicants} applicants
              </span>
            )}
          </div>

          {/* Tags Section */}
          <div className='flex flex-wrap gap-2'>
            <Badge variant='secondary' className='text-xs'>
              {job.type}
            </Badge>
            <Badge variant='secondary' className='text-xs'>
              {job.remote}
            </Badge>
            {job.tags.slice(0, 3).map((tag) => (
              <Badge key={tag} variant='outline' className='text-xs'>
                {tag}
              </Badge>
            ))}
            {job.department && (
              <Badge variant='outline' className='text-xs'>
                {job.department}
              </Badge>
            )}
            {job.easyApply && (
              <Badge className='text-xs bg-green-500/10 text-green-600 border-green-500/20'>
                <Zap className='w-3 h-3 mr-1' />
                Easy Apply
              </Badge>
            )}
            {job.urgency && (
              <Badge className='text-xs bg-orange-500/10 text-orange-600 border-orange-500/20'>
                <AlertCircle className='w-3 h-3 mr-1' />
                {job.urgency}
              </Badge>
            )}
          </div>
        </div>

        {/* Action Section */}
        <div className='flex-shrink-0 flex flex-col gap-2'>
          <Button
            variant='ghost'
            size='icon'
            onClick={handleSave}
            className='w-10 h-10'
          >
            <Bookmark className={`w-4 h-4 ${isSaved ? 'fill-current' : ''}`} />
          </Button>
          <Button
            onClick={handleApply}
            size='sm'
            className='px-4'
          >
            Apply
          </Button>
        </div>
      </div>

      {/* Match Score (optional) */}
      {job.matchScore && (
        <div className='absolute top-4 right-4'>
          <Badge variant='secondary' className='text-xs'>
            {job.matchScore}% match
          </Badge>
        </div>
      )}
    </div>
  )
}