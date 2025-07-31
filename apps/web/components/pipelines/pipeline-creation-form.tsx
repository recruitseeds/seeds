'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

import { useTRPC } from '@/trpc/client'
import { Button } from '@seeds/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@seeds/ui/dialog'
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@seeds/ui/form'
import { Input } from '@seeds/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@seeds/ui/select'
import { Textarea } from '@seeds/ui/textarea'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'

const pipelineFormSchema = z.object({
  name: z.string().min(1, 'Pipeline name is required'),
  description: z.string().optional(),
  department: z.string().optional(),
})

type PipelineFormValues = z.infer<typeof pipelineFormSchema>

interface PipelineCreationFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  department?: string
}

const departments = [
  'Engineering',
  'Design',
  'Sales',
  'Marketing',
  'Product',
  'Operations',
  'HR',
  'Finance',
  'Customer Success',
  'Other',
]

export function PipelineCreationForm({ open, onOpenChange, department }: PipelineCreationFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const trpc = useTRPC()
  const queryClient = useQueryClient()
  const router = useRouter()

  const form = useForm<PipelineFormValues>({
    resolver: zodResolver(pipelineFormSchema),
    defaultValues: {
      name: '',
      description: '',
      department: department || '',
    },
  })

  const createPipelineMutation = useMutation(
    trpc.organization.createPipeline.mutationOptions({
      onMutate: async (newPipeline) => {
        // Cancel any outgoing refetches
        await queryClient.cancelQueries(
          trpc.organization.listPipelines.queryOptions()
        )

        // Snapshot the previous value
        const previousPipelines = queryClient.getQueryData(
          trpc.organization.listPipelines.queryOptions().queryKey
        )

        // Optimistically update the pipelines list
        if (previousPipelines) {
          const tempPipeline = {
            id: `temp-${Date.now()}`,
            name: newPipeline.name,
            description: newPipeline.description,
            status: 'active',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            pipeline_steps: [],
          }

          queryClient.setQueryData(
            trpc.organization.listPipelines.queryOptions().queryKey,
            [tempPipeline, ...(previousPipelines as any[])]
          )
        }

        return { previousPipelines }
      },
      onError: (error, newPipeline, context) => {
        // Rollback on error
        if (context?.previousPipelines) {
          queryClient.setQueryData(
            trpc.organization.listPipelines.queryOptions().queryKey,
            context.previousPipelines
          )
        }
        console.error('Failed to create pipeline:', error.message)
      },
      onSuccess: (data) => {
        // Replace the temp pipeline with the real data
        queryClient.setQueryData(
          trpc.organization.listPipelines.queryOptions().queryKey,
          (oldData: any) => {
            if (!oldData) return oldData

            // Remove temp pipeline and add real pipeline
            const filteredData = (oldData as any[]).filter(p => !p.id.startsWith('temp-'))
            return [data, ...filteredData]
          }
        )

        // Pipeline created successfully
        form.reset()
        onOpenChange(false)
        // Navigate to the pipeline editor
        router.push(`/jobs/pipelines/edit/${data.id}`)
      },
    })
  )

  async function onSubmit(data: PipelineFormValues) {
    setIsLoading(true)
    try {
      await createPipelineMutation.mutateAsync({
        name: data.name,
        description: data.description || null,
        category_id: null, // We'll implement categories later
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-[425px]'>
        <DialogHeader>
          <DialogTitle>Create New Pipeline</DialogTitle>
          <DialogDescription>Create a custom hiring pipeline for your organization.</DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-4'>
            <FormField
              control={form.control}
              name='name'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Pipeline Name</FormLabel>
                  <FormControl>
                    <Input placeholder='e.g., Senior Software Engineer' {...field} />
                  </FormControl>
                  <FormDescription>Give your pipeline a descriptive name.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name='department'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Department</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder='Select a department' />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {departments.map((dept) => (
                        <SelectItem key={dept} value={dept}>
                          {dept}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>Choose the department this pipeline belongs to.</FormDescription>
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
                      placeholder='Describe what this pipeline is used for...'
                      className='resize-none'
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>Provide additional context about this pipeline.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type='button' variant='outline' onClick={() => onOpenChange(false)} disabled={isLoading}>
                Cancel
              </Button>
              <Button type='submit' loading={isLoading}>
                Create Pipeline
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
