'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { useTRPC } from '@/trpc/client'
import type { RouterOutputs } from '@/trpc/routers/_app'
import { useQuery } from '@tanstack/react-query'
import { Briefcase, Calendar, Loader2, Pencil, Plus } from 'lucide-react'

type WorkExperienceItemFromAPI =
  RouterOutputs['candidate']['listWorkExperiences'][number]

export function WorkExperience() {
  const trpc = useTRPC()

  const {
    data: experiences,
    isLoading,
    error,
  } = useQuery(trpc.candidate.listWorkExperiences.queryOptions(undefined))

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Work Experience</CardTitle>
          <CardDescription>
            Loading your professional journey...
          </CardDescription>
        </CardHeader>
        <CardContent className='flex justify-center items-center h-40'>
          <Loader2 className='h-8 w-8 animate-spin text-muted-foreground' />
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Work Experience</CardTitle>
        </CardHeader>
        <CardContent>
          <p className='text-red-600'>
            Error loading work experiences: {error.message}
          </p>
        </CardContent>
      </Card>
    )
  }

  const iconVerticalAlignClass = 'top-[6px]'

  return (
    <Card>
      <CardHeader className='flex flex-row items-center justify-between'>
        <div>
          <CardTitle>Work Experience</CardTitle>
          <CardDescription>Your professional journey</CardDescription>
        </div>
        <div className='flex items-center gap-2'>
          <Button
            size='sm'
            onClick={() => alert('Add Experience UI to be implemented')}>
            <Plus className='h-4 w-4 mr-1' /> Add Experience
          </Button>
          <Button
            variant='outline'
            size='icon'
            className='h-7'
            onClick={() => alert('Edit Section UI to be implemented')}>
            <Pencil className='h-3 w-3' />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {experiences && experiences.length > 0 ? (
          <div className='relative'>
            <div className='absolute left-[7px] top-5 bottom-20 w-0.5 bg-border'></div>
            <div className='space-y-8'>
              {experiences.map((experience) => (
                <div key={experience.id} className='relative pl-8'>
                  <div
                    className={`absolute left-0 ${iconVerticalAlignClass} h-4 w-4 rounded-full bg-foreground flex items-center justify-center border-2 border-foreground z-10`}>
                    <Briefcase className='h-[9px] w-[9px] text-background' />
                  </div>

                  <div>
                    <div className='flex flex-col md:flex-row md:items-start justify-between mb-2'>
                      <div className='md:flex-1'>
                        <h3 className='font-medium text-lg'>
                          {experience.job_title || 'N/A'}
                        </h3>
                        <p className='text-muted-foreground'>
                          {experience.company_name || 'N/A'} •{' '}
                          {experience.location || 'N/A'}
                        </p>
                      </div>
                      <div className='flex items-center gap-1 text-sm text-muted-foreground mt-1 md:mt-0'>
                        <Calendar className='h-3 w-3' />
                        <span>
                          {experience.start_date
                            ? new Date(
                                experience.start_date
                              ).toLocaleDateString('en-US', {
                                month: 'short',
                                year: 'numeric',
                              })
                            : 'N/A'}
                          {' - '}
                          {experience.end_date
                            ? new Date(experience.end_date).toLocaleDateString(
                                'en-US',
                                { month: 'short', year: 'numeric' }
                              )
                            : ' Present'}
                        </span>
                      </div>
                    </div>
                    <p className='text-sm mb-3'>
                      {experience.description.text ||
                        'No description provided.'}
                    </p>
                    {experience.skills_tags &&
                    Array.isArray(experience.skills_tags) &&
                    experience.skills_tags.length > 0 ? (
                      <div className='flex flex-wrap gap-2'>
                        {(experience.skills_tags as string[]).map((skill) => (
                          <Badge key={skill} variant='secondary'>
                            {skill}
                          </Badge>
                        ))}
                      </div>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <p>No work experience added yet.</p>
        )}
      </CardContent>
    </Card>
  )
}
