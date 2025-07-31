'use client'
import { Alert, AlertDescription } from '../ui/alert'
import { Badge } from '../ui/badge'
import { Button } from '../ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '../ui/form'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { RadioGroup, RadioGroupItem } from '../ui/radio-group'
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from '../ui/sheet'
import { useTRPC } from '@/trpc/client'
import type { RouterOutputs } from '@/trpc/routers/_app'
import { zodResolver } from '@hookform/resolvers/zod'
import { ScrollArea } from '@radix-ui/react-scroll-area'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { AlertCircleIcon, Loader2, Plus, X } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

interface SkillsPropsWithData {
  initialSkillsData: RouterOutputs['candidate']['listSkills']
}
type SkillsPropsWithoutData = object
type SkillsProps = SkillsPropsWithData | SkillsPropsWithoutData

function hasData(props: SkillsProps): props is SkillsPropsWithData {
  return 'initialSkillsData' in props
}

const skillSchema = z.object({
  skill_name: z.string().min(1, 'Skill name is required.'),
  proficiency_level: z.enum(['beginner', 'intermediate', 'advanced', 'expert']),
})

type SkillFormValues = z.infer<typeof skillSchema>

export function Skills(props: SkillsProps) {
  const trpc = useTRPC()
  const queryClient = useQueryClient()
  const [isSheetOpen, setIsSheetOpen] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const form = useForm<SkillFormValues>({
    resolver: zodResolver(skillSchema),
    defaultValues: {
      skill_name: '',
      proficiency_level: 'intermediate',
    },
  })

  const {
    data: skills,
    isLoading,
    error,
  } = useQuery({
    ...trpc.candidate.listSkills.queryOptions(undefined),
    ...(hasData(props) ? { initialData: props.initialSkillsData } : {}),
  })

  const createSkillMutation = useMutation(
    trpc.candidate.createSkill.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries(trpc.candidate.listSkills.queryFilter())
        setIsSheetOpen(false)
        form.reset()
        setSubmitError(null)
      },
      onError: (error) => {
        console.error('Failed to add skill:', error.message)
        if (
          error.message.toLowerCase().includes('already exists') ||
          error.message.toLowerCase().includes('duplicate') ||
          error.message.toLowerCase().includes('unique')
        ) {
          setSubmitError('This skill already exists in your profile.')
        } else {
          setSubmitError('Failed to add skill. Please try again.')
        }
      },
    })
  )

  const deleteSkillMutation = useMutation(
    trpc.candidate.deleteSkill.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries(trpc.candidate.listSkills.queryFilter())
      },
      onError: (error) => {
        console.error('Failed to delete skill:', error.message)
      },
    })
  )

  const onSheetOpenChange = (open: boolean) => {
    setIsSheetOpen(open)
    if (!open) {
      form.reset()
      setSubmitError(null)
    }
  }

  const onSubmit = (data: SkillFormValues) => {
    setSubmitError(null)

    const skillsList = skills || []
    const skillExists = skillsList.some((skill) => skill.name.toLowerCase() === data.skill_name.toLowerCase())

    if (skillExists) {
      setSubmitError('This skill already exists in your profile.')
      return
    }

    createSkillMutation.mutate(data)
  }

  const handleDeleteSkill = (skillId: string) => {
    deleteSkillMutation.mutate({ skillId })
  }

  const isSubmitting = form.formState.isSubmitting || createSkillMutation.isPending

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

  const skillsList = skills || []

  return (
    <>
      <Card className='border-none pt-0 px-0'>
        <CardHeader className='flex flex-row items-center justify-between px-0'>
          <div>
            <CardTitle>Skills</CardTitle>
            <CardDescription>Your technical and professional skills</CardDescription>
          </div>
          <div className='flex items-center gap-2'>
            <Button size='sm' onClick={() => setIsSheetOpen(true)}>
              <Plus className='h-4 w-4 mr-1' /> Add Skill
            </Button>
          </div>
        </CardHeader>
        <CardContent className='px-0'>
          {skillsList.length > 0 ? (
            <div className='flex flex-wrap gap-2'>
              {skillsList.map((skill) => (
                <Badge
                  key={skill.id}
                  variant='outline'
                  className='group relative hover:bg-destructive/10 hover:text-destructive hover:border-destructive transition-colors cursor-pointer'
                  onClick={() => handleDeleteSkill(skill.id)}>
                  {skill.name}
                  <X className='h-3 w-3 ml-1 opacity-100' />
                </Badge>
              ))}
            </div>
          ) : (
            <p className='text-sm text-muted-foreground'>
              No skills added yet. Click &quot;Add Skill&quot; to get started.
            </p>
          )}
        </CardContent>
      </Card>

      <Sheet open={isSheetOpen} onOpenChange={onSheetOpenChange}>
        <SheetContent className='flex flex-col sm:max-w-2xl w-full h-[100dvh] overflow-y-auto'>
          <SheetHeader className='px-6 pt-6'>
            <SheetTitle>Add Skill</SheetTitle>
            <SheetDescription>Add a new skill to your profile</SheetDescription>
          </SheetHeader>
          <ScrollArea className='flex-1'>
            <div className='px-6 py-4'>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-4'>
                  <FormField
                    control={form.control}
                    name='skill_name'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Skill Name</FormLabel>
                        <FormControl>
                          <Input placeholder='e.g., React, Python, Figma' {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name='proficiency_level'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Proficiency Level</FormLabel>
                        <FormControl>
                          <RadioGroup
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                            className='grid grid-cols-2 gap-4'>
                            <div className='flex items-center space-x-2'>
                              <RadioGroupItem value='beginner' id='beginner' />
                              <Label htmlFor='beginner'>Beginner</Label>
                            </div>
                            <div className='flex items-center space-x-2'>
                              <RadioGroupItem value='intermediate' id='intermediate' />
                              <Label htmlFor='intermediate'>Intermediate</Label>
                            </div>
                            <div className='flex items-center space-x-2'>
                              <RadioGroupItem value='advanced' id='advanced' />
                              <Label htmlFor='advanced'>Advanced</Label>
                            </div>
                            <div className='flex items-center space-x-2'>
                              <RadioGroupItem value='expert' id='expert' />
                              <Label htmlFor='expert'>Expert</Label>
                            </div>
                          </RadioGroup>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  {submitError && (
                    <Alert variant='destructive'>
                      <AlertCircleIcon />
                      <AlertDescription>{submitError}</AlertDescription>
                    </Alert>
                  )}
                </form>
              </Form>
            </div>
          </ScrollArea>
          <SheetFooter className='px-6 pb-6 pt-4'>
            <Button
              type='button'
              onClick={form.handleSubmit(onSubmit)}
              disabled={isSubmitting}
              className='w-full sm:w-auto'>
              {isSubmitting ? (
                <>
                  <Loader2 className='size-4 animate-spin' />
                  Add
                </>
              ) : (
                'Add Skill'
              )}
            </Button>
            <Button type='button' variant='outline' onClick={() => setIsSheetOpen(false)} className='w-full sm:w-auto'>
              Cancel
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </>
  )
}
