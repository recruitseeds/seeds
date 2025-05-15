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
import { useQuery } from '@tanstack/react-query'
import { Calendar, GraduationCap, Loader2, Pencil, Plus } from 'lucide-react'

export function Education() {
  const trpc = useTRPC()

  const {
    data: educationItems,
    isLoading,
    error,
  } = useQuery(trpc.candidate.listEducation.queryOptions(undefined))

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Education</CardTitle>
          <CardDescription>Loading your academic background...</CardDescription>
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
          <CardTitle>Education</CardTitle>
        </CardHeader>
        <CardContent>
          <p className='text-red-600'>
            Error loading education history: {error.message}
          </p>
        </CardContent>
      </Card>
    )
  }

  const iconVerticalAlignClass = 'top-[6px]' // Adjust for vertical alignment with degree/institution

  return (
    <Card>
      <CardHeader className='flex flex-row items-center justify-between'>
        <div>
          <CardTitle>Education</CardTitle>
          <CardDescription>Your academic background</CardDescription>
        </div>
        <div className='flex items-center gap-2'>
          <Button
            size='sm'
            onClick={() => alert('Add Education UI to be implemented')}>
            <Plus className='h-4 w-4 mr-1' /> Add Education
          </Button>
          <Button
            variant='outline'
            size='icon'
            className='h-7'
            onClick={() => alert('Edit Section UI to be implemented')}>
            <Pencil className='h-3 w-3' /> {/* Adjusted icon size */}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {educationItems && educationItems.length > 0 ? (
          <div className='relative'>
            <div className='absolute left-[7px] top-5 bottom-10 w-0.5 bg-border -z-10'></div>
            <div className='space-y-8'>
              {educationItems.map((education) => (
                <div key={education.id} className='relative pl-8'>
                  <div
                    className={`absolute left-0 ${iconVerticalAlignClass} h-4 w-4 rounded-full bg-foreground flex items-center justify-center border-2 border-foreground z-10`}>
                    <GraduationCap className='h-[9px] w-[9px] text-background' />
                  </div>

                  <div>
                    <div className='flex flex-col md:flex-row md:items-start justify-between mb-2'>
                      <div className='md:flex-1'>
                        <h3 className='font-medium text-lg'>
                          {education.degree_name || 'N/A'}
                        </h3>
                        <p className='text-muted-foreground'>
                          {education.institution_name || 'N/A'} •{' '}
                          {education.location || 'N/A'}
                        </p>
                      </div>
                      <div className='flex items-center gap-1 text-sm text-muted-foreground mt-1 md:mt-0'>
                        <Calendar className='h-3 w-3' />
                        <span>
                          {education.start_date
                            ? new Date(education.start_date).toLocaleDateString(
                                'en-US',
                                { month: 'short', year: 'numeric' }
                              )
                            : 'N/A'}
                          {' - '}
                          {education.end_date
                            ? new Date(education.end_date).toLocaleDateString(
                                'en-US',
                                { month: 'short', year: 'numeric' }
                              )
                            : 'Present'}
                        </span>
                      </div>
                    </div>
                    {education.description && (
                      <p className='text-sm mb-3'>
                        {typeof education.description === 'object' &&
                        'text' in education.description
                          ? (education.description as { text: string }).text
                          : education.description}
                      </p>
                    )}
                    {education.achievements &&
                    Array.isArray(education.achievements) &&
                    education.achievements.length > 0 ? (
                      <div className='flex flex-wrap gap-2'>
                        {(education.achievements as string[]).map(
                          (achievement) => (
                            <Badge key={achievement} variant='secondary'>
                              {achievement}
                            </Badge>
                          )
                        )}
                      </div>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <p>No education history added yet.</p>
        )}
      </CardContent>
    </Card>
  )
}
