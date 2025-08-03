'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Heart, MapPin, Clock, DollarSign } from 'lucide-react'

interface Job {
  id: string
  title: string
  company: string
  location: string
  type: string
  salary: string
  remote: string
  posted: string
  tags: string[]
  logo?: string
}

interface JobCardProps {
  job: Job
  onAuthRequired?: () => void
}

export function JobCard({ job, onAuthRequired }: JobCardProps) {
  const [isSaved, setIsSaved] = useState(false)

  const handleSave = () => {
    if (onAuthRequired) {
      onAuthRequired()
    } else {
      setIsSaved(!isSaved)
    }
  }

  const handleApply = () => {
    if (onAuthRequired) {
      onAuthRequired()
    } else {
      // Navigate to application page
      window.location.href = `/${job.company.toLowerCase().replace(/\s+/g, '-')}/${job.id}`
    }
  }

  return (
    <div className='group bg-card border border-border rounded-lg p-6 transition-all hover:shadow-md hover:border-brand/50 cursor-pointer'>
      <div className='flex items-start justify-between'>
        <div className='flex items-start space-x-4 flex-1'>
          {job.logo ? (
            <Image
              src={job.logo}
              alt={`${job.company} logo`}
              width={48}
              height={48}
              className='rounded-lg border'
            />
          ) : (
            <div className='w-12 h-12 bg-brand/10 rounded-lg flex items-center justify-center'>
              <span className='text-brand font-semibold text-lg'>
                {job.company.substring(0, 2).toUpperCase()}
              </span>
            </div>
          )}

          <div className='flex-1 min-w-0'>
            <h3 className='font-semibold text-lg group-hover:text-brand transition-colors'>{job.title}</h3>
            <p className='text-muted-foreground font-medium'>{job.company}</p>

            <div className='flex items-center space-x-4 mt-2 text-sm text-muted-foreground'>
              <div className='flex items-center'>
                <MapPin className='h-4 w-4 mr-1' />
                {job.location}
              </div>
              <div className='flex items-center'>
                <Clock className='h-4 w-4 mr-1' />
                {job.posted}
              </div>
              {job.salary && (
                <div className='flex items-center'>
                  <DollarSign className='h-4 w-4 mr-1' />
                  {job.salary}
                </div>
              )}
            </div>

            <div className='flex flex-wrap gap-2 mt-3'>
              <span className='px-2 py-1 text-xs bg-secondary rounded-full'>
                {job.type}
              </span>
              <span className='px-2 py-1 text-xs bg-secondary rounded-full'>
                {job.remote}
              </span>
              {job.tags.map((tag) => (
                <span key={tag} className='px-2 py-1 text-xs border border-border rounded-full'>
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className='flex items-center space-x-2 ml-4'>
          <button
            onClick={handleSave}
            className={`p-2 rounded-lg hover:bg-muted transition-colors ${isSaved ? 'text-red-500' : 'text-muted-foreground'}`}>
            <Heart className={`h-4 w-4 ${isSaved ? 'fill-current' : ''}`} />
          </button>
          <button
            onClick={handleApply}
            className='px-4 py-2 bg-brand hover:bg-brand-hover text-brand-foreground rounded-lg text-sm font-medium transition-colors'>
            Apply
          </button>
        </div>
      </div>
    </div>
  )
}