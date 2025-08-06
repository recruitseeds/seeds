import { Badge } from '@seeds/ui/badge'
import { Button } from '@seeds/ui/button'
import { 
  Building2, 
  MapPin, 
  Clock, 
  DollarSign, 
  Calendar,
  Users,
  Briefcase
} from 'lucide-react'
import { formatSalary, getTimeAgo } from '../lib/api'
import { TipTapRenderer } from './tiptap-renderer'
import type { JobPostingDetail } from '../lib/api'

interface JobDetailProps {
  job: JobPostingDetail
}

export function JobDetail({ job }: JobDetailProps) {
  return (
    <div className='space-y-6'>
      {/* Job Header */}
      <div className='bg-card border border-border rounded-lg p-6'>
        <div className='flex items-start justify-between mb-4'>
          <div className='flex items-center space-x-4'>
            {job.organization.logo_url ? (
              <img 
                src={job.organization.logo_url} 
                alt={`${job.organization.name} logo`}
                className='w-12 h-12 rounded-lg object-cover'
              />
            ) : (
              <div className='w-12 h-12 rounded-lg bg-muted flex items-center justify-center'>
                <Building2 className='h-6 w-6 text-muted-foreground' />
              </div>
            )}
            <div>
              <h1 className='text-2xl font-bold text-foreground mb-1'>{job.title}</h1>
              <p className='text-lg text-muted-foreground'>{job.organization.name}</p>
            </div>
          </div>
        </div>

        <div className='flex flex-wrap gap-4 text-sm text-muted-foreground'>
          {job.department && (
            <div className='flex items-center'>
              <Users className='h-4 w-4 mr-1.5' />
              {job.department}
            </div>
          )}
          <div className='flex items-center'>
            <Briefcase className='h-4 w-4 mr-1.5' />
            {job.job_type.replace('_', ' ')}
          </div>
          {job.experience_level && (
            <div className='flex items-center'>
              <Clock className='h-4 w-4 mr-1.5' />
              {job.experience_level} level
            </div>
          )}
          <div className='flex items-center'>
            <DollarSign className='h-4 w-4 mr-1.5' />
            {formatSalary(job.salary_min, job.salary_max, job.salary_type)}
          </div>
          {job.published_at && (
            <div className='flex items-center'>
              <Calendar className='h-4 w-4 mr-1.5' />
              Posted {getTimeAgo(job.published_at)}
            </div>
          )}
        </div>

        {/* Job Type Badge */}
        <div className='flex flex-wrap gap-2 mt-4'>
          <Badge variant='secondary'>
            {job.job_type.replace('_', ' ').toUpperCase()}
          </Badge>
          {job.experience_level && (
            <Badge variant='outline'>
              {job.experience_level.toUpperCase()}
            </Badge>
          )}
        </div>
      </div>

      {/* Job Description */}
      <div className='bg-card border border-border rounded-lg p-6'>
        <h2 className='text-xl font-semibold mb-4'>Job Description</h2>
        <div className='prose prose-sm max-w-none dark:prose-invert'>
          {job.content ? (
            <TipTapRenderer content={job.content} />
          ) : (
            <p className='text-muted-foreground'>No job description available.</p>
          )}
        </div>
      </div>

      {/* Company Info */}
      <div className='bg-card border border-border rounded-lg p-6'>
        <h2 className='text-xl font-semibold mb-4'>About {job.organization.name}</h2>
        <div className='flex items-start space-x-4'>
          {job.organization.logo_url ? (
            <img 
              src={job.organization.logo_url} 
              alt={`${job.organization.name} logo`}
              className='w-16 h-16 rounded-lg object-cover flex-shrink-0'
            />
          ) : (
            <div className='w-16 h-16 rounded-lg bg-muted flex items-center justify-center flex-shrink-0'>
              <Building2 className='h-8 w-8 text-muted-foreground' />
            </div>
          )}
          <div>
            <h3 className='font-medium text-lg mb-2'>{job.organization.name}</h3>
            {job.organization.domain && (
              <div className='flex items-center text-sm text-muted-foreground mb-2'>
                <MapPin className='h-4 w-4 mr-1.5' />
                <a 
                  href={`https://${job.organization.domain}`} 
                  target='_blank' 
                  rel='noopener noreferrer'
                  className='hover:text-primary transition-colors'
                >
                  {job.organization.domain}
                </a>
              </div>
            )}
            <p className='text-sm text-muted-foreground'>
              Learn more about our company culture, mission, and values on our website.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}