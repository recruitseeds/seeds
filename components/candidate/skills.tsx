'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useTRPC } from '@/trpc/client'
import type { RouterOutputs } from '@/trpc/routers/_app'
import { useQuery } from '@tanstack/react-query'
import { Loader2, Pencil, Plus } from 'lucide-react'

interface SkillsPropsWithData {
  initialSkillsData: RouterOutputs['candidate']['listSkills']
}

type SkillsPropsWithoutData = object

type SkillsProps = SkillsPropsWithData | SkillsPropsWithoutData

function hasData(props: SkillsProps): props is SkillsPropsWithData {
  return 'initialSkillsData' in props
}

export function Skills(props: SkillsProps) {
  const trpc = useTRPC()

  const {
    data: skillsData,
    isLoading,
    error,
  } = useQuery({
    ...trpc.candidate.listSkills.queryOptions(undefined),
    ...(hasData(props) ? { initialData: props.initialSkillsData } : {}),
  })

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Skills</CardTitle>
          <CardDescription>Your technical and professional skills</CardDescription>
        </CardHeader>
        <CardContent className='flex justify-center items-center h-60'>
          <Loader2 className='h-10 w-10 animate-spin text-muted-foreground' />
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Skills</CardTitle>
          <CardDescription>Your technical and professional skills</CardDescription>
        </CardHeader>
        <CardContent>
          <p className='text-red-600'>Error loading skills: {error.message}</p>
        </CardContent>
      </Card>
    )
  }

  const skillCategories = skillsData || []

  return (
    <Card>
      <CardHeader className='flex flex-row items-center justify-between'>
        <div>
          <CardTitle>Skills</CardTitle>
          <CardDescription>Your technical and professional skills</CardDescription>
        </div>
        <div className='flex items-center gap-2'>
          <Button size='sm' onClick={() => alert('Add Skill UI to be implemented')}>
            <Plus className='h-4 w-4 mr-1' /> Add Skill
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
        {skillCategories.length > 0 ? (
          <div className='space-y-6'>
            {skillCategories.map((category) => (
              <div key={category.id}>
                {category.skills && Array.isArray(category.skills) && category.skills.length > 0 ? (
                  <div className='flex flex-wrap gap-2'>
                    {(category.skills as string[]).map((skill) => (
                      <Badge key={skill} variant='outline'>
                        {skill}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className='text-sm text-muted-foreground'>No skills listed in this category.</p>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className='text-sm text-muted-foreground'>
            No skills added yet. Click &quot;Add Skill&quot; to get started.
          </p>
        )}
      </CardContent>
    </Card>
  )
}
