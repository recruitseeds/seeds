'use client'

import { useTRPC } from '@/trpc/client'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Tooltip } from '@/components/ui/tooltip'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ChevronDown, ChevronUp, Clock, Edit2, Plus, Trash2, User } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

interface PipelineEditorProps {
  pipelineId: string
  initialPipeline?: any
  initialOrganizationUsers?: any[]
}

const stepFormSchema = z.object({
  name: z.string().min(1, 'Step name is required'),
  description: z.string().optional(),
  duration_days: z.number().int().min(0).optional(),
  predefined_step: z.string().optional(),
  task_owner_id: z.string().optional().nullable(),
})

type StepFormValues = z.infer<typeof stepFormSchema>

interface PipelineStep {
  id: string
  name: string
  description: string | null
  step_order: number
  duration_days: number | null
  task_owner_id: string | null
  task_owner?: {
    id: string
    name: string | null
    email: string | null
  } | null
}

interface OrganizationUser {
  id: string
  name: string | null
  email: string | null
}

const predefinedSteps = [
  {
    value: 'application_review',
    label: 'Application Review',
    description: 'Initial review of candidate application and resume',
    defaultDuration: 1,
  },
  {
    value: 'recruiter_screening',
    label: 'Recruiter Screening',
    description: 'Phone or video call with recruiter to assess basic fit',
    defaultDuration: 2,
  },
  {
    value: 'phone_screen',
    label: 'Phone Screen',
    description: 'Initial phone interview with hiring manager',
    defaultDuration: 3,
  },
  {
    value: 'technical_assessment',
    label: 'Technical Assessment',
    description: 'Online coding test or technical evaluation',
    defaultDuration: 5,
  },
  {
    value: 'technical_interview',
    label: 'Technical Interview',
    description: 'In-depth technical interview with team members',
    defaultDuration: 3,
  },
  {
    value: 'behavioral_interview',
    label: 'Behavioral Interview',
    description: 'Interview focusing on cultural fit and soft skills',
    defaultDuration: 2,
  },
  {
    value: 'panel_interview',
    label: 'Panel Interview',
    description: 'Interview with multiple team members or stakeholders',
    defaultDuration: 3,
  },
  {
    value: 'reference_check',
    label: 'Reference Check',
    description: 'Contact previous employers and references',
    defaultDuration: 5,
  },
  {
    value: 'final_interview',
    label: 'Final Interview',
    description: 'Final interview with senior leadership or decision makers',
    defaultDuration: 2,
  },
  {
    value: 'background_check',
    label: 'Background Check',
    description: 'Verify employment history and conduct background screening',
    defaultDuration: 7,
  },
  {
    value: 'offer_preparation',
    label: 'Offer Preparation',
    description: 'Prepare and review job offer details',
    defaultDuration: 2,
  },
  {
    value: 'offer_extended',
    label: 'Offer Extended',
    description: 'Formal job offer sent to candidate',
    defaultDuration: 3,
  },
]

export function PipelineEditor({ pipelineId, initialPipeline, initialOrganizationUsers = [] }: PipelineEditorProps) {
  const [showStepDialog, setShowStepDialog] = useState(false)
  const [editingStep, setEditingStep] = useState<PipelineStep | null>(null)
  const [insertAfterOrder, setInsertAfterOrder] = useState<number | null>(null)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [stepToDelete, setStepToDelete] = useState<string | null>(null)

  
  const isShiftingSteps = useRef(false)
  const isMovingStep = useRef(false)

  const trpc = useTRPC()
  const queryClient = useQueryClient()
  const router = useRouter()

  const { data: organizationUsers = initialOrganizationUsers } = useQuery({
    ...trpc.organization.getOrganizationUsers.queryOptions(),
    initialData: initialOrganizationUsers,
    enabled: !initialOrganizationUsers.length,
  })

  const { data: pipeline, isLoading } = useQuery({
    ...trpc.organization.getPipeline.queryOptions({ id: pipelineId }),
    initialData: initialPipeline,
    enabled: !initialPipeline,
  })

  const createStepMutation = useMutation(
    trpc.organization.createPipelineStep.mutationOptions({
      onMutate: async (newStep) => {
        
        await queryClient.cancelQueries(trpc.organization.getPipeline.queryOptions({ id: pipelineId }))

        
        const previousPipeline = queryClient.getQueryData(
          trpc.organization.getPipeline.queryOptions({ id: pipelineId }).queryKey
        )

        
        if (previousPipeline && (previousPipeline as any)?.pipeline_steps) {
          const currentSteps = [...(previousPipeline as any).pipeline_steps]

          
          const tempStep = {
            id: `temp-${Date.now()}`,
            name: newStep.name,
            description: newStep.description,
            step_order: newStep.step_order,
            duration_days: newStep.duration_days,
            task_owner_id: newStep.task_owner_id,
            task_owner: newStep.task_owner_id ? organizationUsers.find((u) => u.id === newStep.task_owner_id) : null,
            automation_config: null,
            permissions: null,
          }

          currentSteps.push(tempStep)

          
          const updatedSteps = currentSteps.sort((a, b) => a.step_order - b.step_order)

          queryClient.setQueryData(trpc.organization.getPipeline.queryOptions({ id: pipelineId }).queryKey, {
            ...previousPipeline,
            pipeline_steps: updatedSteps,
          })
        }

        return { previousPipeline }
      },
      onError: (error, newStep, context) => {
        
        if (context?.previousPipeline) {
          queryClient.setQueryData(
            trpc.organization.getPipeline.queryOptions({ id: pipelineId }).queryKey,
            context.previousPipeline
          )
        }
        console.error('Failed to create step:', error.message)
      },
      onSuccess: (data) => {
        
        queryClient.setQueryData(
          trpc.organization.getPipeline.queryOptions({ id: pipelineId }).queryKey,
          (oldData: any) => {
            if (!oldData) return oldData

            const updatedSteps = oldData.pipeline_steps
              .filter((step: any) => !step.id.startsWith('temp-'))
              .concat(data)
              .sort((a: any, b: any) => a.step_order - b.step_order)

            return {
              ...oldData,
              pipeline_steps: updatedSteps,
            }
          }
        )

        
        setShowStepDialog(false)
        setInsertAfterOrder(null)
        form.reset()
      },
    })
  )

  const updateStepMutation = useMutation(
    trpc.organization.updatePipelineStep.mutationOptions({
      onMutate: async (updatedStep) => {
        
        await queryClient.cancelQueries(trpc.organization.getPipeline.queryOptions({ id: pipelineId }))

        
        const previousPipeline = queryClient.getQueryData(
          trpc.organization.getPipeline.queryOptions({ id: pipelineId }).queryKey
        )

        
        if (previousPipeline && (previousPipeline as any)?.pipeline_steps) {
          const updatedSteps = (previousPipeline as any).pipeline_steps
            .map((step: any) => {
              if (step.id === updatedStep.id) {
                return {
                  ...step,
                  ...updatedStep,
                  
                  task_owner:
                    updatedStep.task_owner_id !== undefined
                      ? updatedStep.task_owner_id
                        ? organizationUsers.find((u) => u.id === updatedStep.task_owner_id)
                        : null
                      : step.task_owner,
                }
              }
              return step
            })
            .sort((a: any, b: any) => a.step_order - b.step_order)

          queryClient.setQueryData(trpc.organization.getPipeline.queryOptions({ id: pipelineId }).queryKey, {
            ...previousPipeline,
            pipeline_steps: updatedSteps,
          })
        }

        return { previousPipeline }
      },
      onError: (error, updatedStep, context) => {
        
        if (context?.previousPipeline) {
          queryClient.setQueryData(
            trpc.organization.getPipeline.queryOptions({ id: pipelineId }).queryKey,
            context.previousPipeline
          )
        }
        console.error('Failed to update step:', error.message)
      },
      onSuccess: (data) => {
        
        queryClient.setQueryData(
          trpc.organization.getPipeline.queryOptions({ id: pipelineId }).queryKey,
          (oldData: any) => {
            if (!oldData) return oldData

            const updatedSteps = oldData.pipeline_steps
              .map((step: any) => (step.id === data.id ? data : step))
              .sort((a: any, b: any) => a.step_order - b.step_order)

            return {
              ...oldData,
              pipeline_steps: updatedSteps,
            }
          }
        )

        
        if (!isShiftingSteps.current && !isMovingStep.current) {
          
        }

        setShowStepDialog(false)
        setEditingStep(null)
        form.reset()
      },
    })
  )

  const deleteStepMutation = useMutation(
    trpc.organization.deletePipelineStep.mutationOptions({
      onMutate: async (variables) => {
        
        await queryClient.cancelQueries(trpc.organization.getPipeline.queryOptions({ id: pipelineId }))

        
        const previousPipeline = queryClient.getQueryData(
          trpc.organization.getPipeline.queryOptions({ id: pipelineId }).queryKey
        )

        
        if (previousPipeline && (previousPipeline as any)?.pipeline_steps) {
          
          const updatedSteps = (previousPipeline as any).pipeline_steps
            .filter((step: any) => step.id !== variables.id)
            .sort((a: any, b: any) => a.step_order - b.step_order)
            .map((step: any, index: number) => ({ ...step, step_order: index + 1 }))

          queryClient.setQueryData(trpc.organization.getPipeline.queryOptions({ id: pipelineId }).queryKey, {
            ...previousPipeline,
            pipeline_steps: updatedSteps,
          })
        }

        return { previousPipeline }
      },
      onError: (error, variables, context) => {
        
        if (context?.previousPipeline) {
          queryClient.setQueryData(
            trpc.organization.getPipeline.queryOptions({ id: pipelineId }).queryKey,
            context.previousPipeline
          )
        }
        console.error('Failed to delete step:', error.message)
      },
      onSuccess: () => {
        
        setShowDeleteDialog(false)
        setStepToDelete(null)
      },
    })
  )

  const form = useForm<StepFormValues>({
    resolver: zodResolver(stepFormSchema),
    defaultValues: {
      name: '',
      description: '',
      duration_days: undefined,
      predefined_step: 'custom',
      task_owner_id: 'none',
    },
  })

  const steps = pipeline?.pipeline_steps?.sort((a: any, b: any) => a.step_order - b.step_order) || []

  const handleAddStep = (afterOrder?: number) => {
    setInsertAfterOrder(afterOrder ?? null)
    setEditingStep(null)
    form.reset({
      name: '',
      description: '',
      duration_days: undefined,
      predefined_step: 'custom',
      task_owner_id: 'none',
    })
    setShowStepDialog(true)
  }

  const handleEditStep = (step: PipelineStep) => {
    setEditingStep(step)
    setInsertAfterOrder(null)
    form.setValue('name', step.name)
    form.setValue('description', step.description || '')
    form.setValue('duration_days', step.duration_days || undefined)
    form.setValue('predefined_step', 'custom')
    form.setValue('task_owner_id', step.task_owner_id || 'none')
    setShowStepDialog(true)
  }

  const handleDeleteStep = (stepId: string) => {
    setStepToDelete(stepId)
    setShowDeleteDialog(true)
  }

  const confirmDeleteStep = async () => {
    if (stepToDelete) {
      await deleteStepMutation.mutateAsync({ id: stepToDelete })
    }
  }

  const handleMoveStep = async (step: PipelineStep, direction: 'up' | 'down') => {
    const targetOrder = direction === 'up' ? step.step_order - 1 : step.step_order + 1
    const targetStep = steps.find((s: any) => s.step_order === targetOrder)

    if (!targetStep) return

    isMovingStep.current = true

    try {
      
      await Promise.all([
        updateStepMutation.mutateAsync({
          id: step.id,
          step_order: targetOrder,
        }),
        updateStepMutation.mutateAsync({
          id: targetStep.id,
          step_order: step.step_order,
        }),
      ])

      
      
    } catch (error) {
      console.error('Failed to move step:', error)
    } finally {
      isMovingStep.current = false
    }
  }

  const onSubmit = async (data: StepFormValues) => {
    const taskOwnerId = data.task_owner_id === 'none' ? null : data.task_owner_id || null

    if (editingStep) {
      await updateStepMutation.mutateAsync({
        id: editingStep.id,
        name: data.name,
        description: data.description || null,
        duration_days: data.duration_days || null,
        task_owner_id: taskOwnerId,
      })
    } else {
      const newOrder = insertAfterOrder !== null ? insertAfterOrder + 1 : steps.length + 1

      
      if (insertAfterOrder !== null) {
        const stepsToShift = steps.filter((s: any) => s.step_order > insertAfterOrder)

        if (stepsToShift.length > 0) {
          isShiftingSteps.current = true

          try {
            
            await Promise.all(
              stepsToShift.map((step: any) =>
                updateStepMutation.mutateAsync({
                  id: step.id,
                  step_order: step.step_order + 1,
                })
              )
            )
          } finally {
            isShiftingSteps.current = false
          }
        }
      }

      
      await createStepMutation.mutateAsync({
        pipeline_id: pipelineId,
        name: data.name,
        description: data.description || null,
        step_order: newOrder,
        duration_days: data.duration_days || null,
        task_owner_id: taskOwnerId,
      })
    }
  }

  if (isLoading) {
    return <div>Loading...</div>
  }

  if (!pipeline) {
    return <div>Pipeline not found</div>
  }

  return (
    <div className='space-y-6'>
      <div>
        <h1 className='text-2xl font-bold tracking-tight'>{pipeline.name}</h1>
        <p className='text-muted-foreground'>
          {pipeline.description || 'Configure the steps for this hiring pipeline'}
        </p>
      </div>

      <div className='space-y-4'>
        <div className='flex items-center justify-between'>
          <h2 className='text-lg font-semibold'>Pipeline Steps</h2>
          <Button onClick={() => handleAddStep()}>
            <Plus className='h-4 w-4 mr-2' />
            Add Step
          </Button>
        </div>

        <div className='grid gap-3'>
          {steps.map((step: any, index: number) => (
            <div key={step.id} className='space-y-3'>
              <Card className='min-h-[120px] bg-card gap-0 py-2 px-0 rounded-lg'>
                <CardHeader className='pb-4 px-3'>
                  <div className='flex items-start justify-between'>
                    <div className='flex items-center gap-3'>
                      <Badge variant='outline' className='px-2 py-1 font-medium'>
                        {step.step_order}
                      </Badge>
                      <CardTitle className='text-lg font-semibold'>{step.name}</CardTitle>
                    </div>
                    <div className='flex items-center gap-1'>
                      <Button
                        variant='outline'
                        size='sm'
                        onClick={() => handleMoveStep(step, 'up')}
                        disabled={index === 0}
                        className='h-8 w-8 p-0'
                        {...(index !== 0 && { tooltip: 'Move step up' })}>
                        <ChevronUp className='h-4 w-4' />
                      </Button>
                      <Button
                        variant='outline'
                        size='sm'
                        onClick={() => handleMoveStep(step, 'down')}
                        disabled={index === steps.length - 1}
                        className='h-8 w-8 p-0'
                        {...(index !== steps.length - 1 && { tooltip: 'Move step down' })}>
                        <ChevronDown className='h-4 w-4' />
                      </Button>
                    </div>
                  </div>
                  {step.description && (
                    <CardDescription className='mt-2 text-sm leading-relaxed'>{step.description}</CardDescription>
                  )}
                </CardHeader>
                <CardContent className='pt-0 px-3'>
                  <div className='flex items-center justify-between'>
                    <div className='flex items-center gap-4'>
                      {step.duration_days && step.duration_days > 0 && (
                        <div className='flex items-center gap-2 text-sm text-muted-foreground'>
                          <Clock className='h-4 w-4' />
                          <span>
                            {step.duration_days} {step.duration_days === 1 ? 'day' : 'days'}
                          </span>
                        </div>
                      )}
                      {step.task_owner && (
                        <>
                          {/* Small screens: Icon with tooltip */}
                          <div className='sm:hidden'>
                            <Tooltip title={step.task_owner.name || step.task_owner.email}>
                              <User className='h-4 w-4 text-muted-foreground cursor-pointer' />
                            </Tooltip>
                          </div>
                          {/* Large screens: Icon with text */}
                          <div className='hidden sm:flex items-center gap-2 text-sm text-muted-foreground'>
                            <User className='h-4 w-4' />
                            <span>{step.task_owner.name || step.task_owner.email}</span>
                          </div>
                        </>
                      )}
                    </div>

                    <div className='flex items-center gap-2'>
                      <Button variant='secondary' size='sm' onClick={() => handleEditStep(step)} className='h-8'>
                        <Edit2 className='h-4 w-4' />
                        <span className='hidden md:inline md:ml-1'>Edit</span>
                      </Button>
                      <Button
                        variant='destructive-subtle'
                        size='sm'
                        onClick={() => handleDeleteStep(step.id)}
                        className='h-8'>
                        <Trash2 className='h-4 w-4' />
                        <span className='hidden md:inline md:ml-1'>Delete</span>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {index < steps.length - 1 && (
                <div className='flex justify-center'>
                  <Button
                    tooltip='Add step'
                    variant='outline'
                    size='icon'
                    onClick={() => handleAddStep(step.step_order)}>
                    <Plus />
                  </Button>
                </div>
              )}
            </div>
          ))}

          {/* Add step button at the end */}
          {steps.length > 0 && (
            <div className='flex justify-center'>
              <Button
                tooltip='Add step'
                variant='outline'
                size='icon'
                onClick={() => handleAddStep(steps[steps.length - 1]?.step_order)}>
                <Plus />
              </Button>
            </div>
          )}

          {steps.length === 0 && (
            <Card className='border-dashed border-2 bg-card'>
              <CardContent className='flex flex-col items-center justify-center py-16'>
                <Plus className='h-12 w-12 text-muted-foreground mb-6' />
                <h3 className='text-lg font-medium mb-2'>No pipeline steps yet</h3>
                <p className='text-sm text-muted-foreground text-center mb-4'>
                  Get started by adding your first step to this pipeline.
                </p>
                <Button onClick={() => handleAddStep()}>
                  <Plus className='h-4 w-4 mr-2' />
                  Add First Step
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <Dialog open={showStepDialog} onOpenChange={setShowStepDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingStep ? 'Edit Step' : 'Add New Step'}</DialogTitle>
            <DialogDescription>
              {editingStep ? 'Update the details for this pipeline step.' : 'Add a new step to your pipeline.'}
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-4'>
              {!editingStep && (
                <FormField
                  control={form.control}
                  name='predefined_step'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Quick Add (Optional)</FormLabel>
                      <Select
                        onValueChange={(value) => {
                          field.onChange(value)
                          if (value && value !== 'custom') {
                            const step = predefinedSteps.find((s) => s.value === value)
                            if (step) {
                              form.setValue('name', step.label)
                              form.setValue('description', step.description)
                              form.setValue('duration_days', step.defaultDuration)
                            }
                          } else {
                            form.setValue('name', '')
                            form.setValue('description', '')
                            form.setValue('duration_days', undefined)
                          }
                        }}
                        value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder='Choose a predefined step or create custom' />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value='custom'>Custom Step</SelectItem>
                          {predefinedSteps.map((step) => (
                            <SelectItem key={step.value} value={step.value}>
                              {step.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <FormField
                control={form.control}
                name='name'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Step Name</FormLabel>
                    <FormControl>
                      <Input placeholder='e.g., Phone Screen' {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name='description'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description (Optional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder='Describe what happens in this step...'
                        className='resize-none'
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name='duration_days'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Expected Duration (Days)</FormLabel>
                    <FormControl>
                      <Input
                        type='number'
                        min='0'
                        placeholder='e.g., 3'
                        {...field}
                        value={field.value || ''}
                        onChange={(e) => {
                          const value = e.target.value
                          if (value === '') {
                            field.onChange(undefined)
                          } else {
                            const numValue = Number.parseInt(value)
                            if (!Number.isNaN(numValue) && numValue >= 0) {
                              field.onChange(numValue)
                            }
                          }
                        }}
                        onKeyDown={(e) => {
                          
                          if (e.key === '-' || e.key === 'e' || e.key === 'E') {
                            e.preventDefault()
                          }
                        }}
                      />
                    </FormControl>
                    <FormDescription>How many days should this step typically take?</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name='task_owner_id'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Task Owner (Optional)</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || 'none'}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder='Select someone responsible for this step' />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value='none'>No assigned owner</SelectItem>
                        {organizationUsers.map((user: any) => (
                          <SelectItem key={user.id} value={user.id}>
                            {user.name || user.email}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>Who is responsible for completing this step?</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button type='button' variant='outline' onClick={() => setShowStepDialog(false)}>
                  Cancel
                </Button>
                <Button type='submit'>{editingStep ? 'Update Step' : 'Add Step'}</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Pipeline Step</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this step? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteStep}>Delete Step</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
