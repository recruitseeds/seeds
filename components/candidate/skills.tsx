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
import { Loader2, Pencil, Plus } from 'lucide-react'

type SkillCategoryFromAPI = RouterOutputs['candidate']['listSkills'][number]

export function Skills() {
  const trpc = useTRPC()

  const {
    data: skillCategories,
    isLoading,
    error,
  } = useQuery(
    trpc.candidate.listSkills.queryOptions(undefined, {
      staleTime: 5 * 60 * 1000,
    })
  )

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Skills</CardTitle>
          <CardDescription>
            Loading your technical and professional skills...
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
          <CardTitle>Skills</CardTitle>
        </CardHeader>
        <CardContent>
          <p className='text-red-600'>Error loading skills: {error.message}</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className='flex flex-row items-center justify-between'>
        <div>
          <CardTitle>Skills</CardTitle>
          <CardDescription>
            Your technical and professional skills
          </CardDescription>
        </div>
        <div className='flex items-center gap-2'>
          <Button
            size='sm'
            onClick={() => alert('Add Skill UI to be implemented')}>
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
        {skillCategories && skillCategories.length > 0 ? (
          <div className='space-y-6'>
            {skillCategories.map((category) => (
              <div key={category.id}>
                {category.skills &&
                Array.isArray(category.skills) &&
                category.skills.length > 0 ? (
                  <div className='flex flex-wrap gap-2'>
                    {(category.skills as string[]).map((skill) => (
                      <Badge key={skill} variant='outline'>
                        {skill}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className='text-sm text-muted-foreground'>
                    No skills listed in this category.
                  </p>
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
