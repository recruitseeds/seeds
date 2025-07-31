'use client'

import { Button } from '../ui/button'
import { DatePicker } from '../ui/date-picker'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '../ui/form'
import { Input } from '../ui/input'
import { ScrollArea } from '../ui/scroll-area'
import { formatDateToYYYYMMDD, parseDateString } from '@/lib/dates'
import { useTRPC } from '@/trpc/client'
import type { AppRouter } from '@/trpc/routers/_app'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { TRPCClientErrorLike } from '@trpc/client'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

const applicationStatusEnum = z.enum(['applied', 'in-review', 'interview', 'rejected', 'offer'])
const applicationSourceEnum = z.enum(['platform', 'manual', 'import'])

const createApplicationSchema = z.object({
  job_title: z.string().min(1, 'Job title is required.'),
  company_name: z.string().min(1, 'Company name is required.'),
  application_date: z.string().min(1, 'Application date is required.'),
  application_url: z.string().url().optional().nullable(),
  status: applicationStatusEnum.default('applied'),
  source: applicationSourceEnum.default('manual'),
  next_step_date: z.string().optional().nullable(),
  next_step_description: z.string().optional().nullable(),
  contact_person: z.string().optional().nullable(),
  contact_email: z.string().email().optional().nullable(),
  salary_range: z.string().optional().nullable(),
  company_logo_url: z.string().url().optional().nullable(),
})

type CreateApplicationFormValues = z.infer<typeof createApplicationSchema>

interface CreateCandidateApplicationFormProps {
  onApplicationCreated?: () => void
  onClose?: () => void
}

export function CreateCandidateApplicationForm({ onApplicationCreated, onClose }: CreateCandidateApplicationFormProps) {
  const trpcClient = useTRPC()
  const queryClient = useQueryClient()
  const today = formatDateToYYYYMMDD(new Date())

  const form = useForm<CreateApplicationFormValues>({
    resolver: zodResolver(createApplicationSchema),
    defaultValues: {
      status: 'applied',
      source: 'manual',
      application_date: today,
    },
  })

  const createApplicationMutation = useMutation(
    trpcClient.candidate.createApplication.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries(trpcClient.candidate.listApplications.queryFilter())
        onApplicationCreated?.()
        form.reset({
          status: 'applied',
          source: 'manual',
          application_date: today,
        })
        onClose?.()
      },
      onError: (error: TRPCClientErrorLike<AppRouter>) => {
        console.error('Failed to create application:', error)
        alert(`Error: ${error.message}`)
      },
    })
  )

  const onSubmit = (data: CreateApplicationFormValues) => {
    const appDate = parseDateString(data.application_date)
    const nextStepDate = parseDateString(data.next_step_date || '')

    const payload = {
      ...data,
      application_date: appDate ? appDate.toISOString() : new Date().toISOString(),
      next_step_date: nextStepDate ? nextStepDate.toISOString() : null,
    }

    createApplicationMutation.mutate(payload)
  }

  const isSubmitting = form.formState.isSubmitting || createApplicationMutation.isPending

  return (
    <ScrollArea className='h-full'>
      <div className='mb-6'>
        <h2 className='text-xl font-semibold'>Add New Application</h2>
        <p className='text-sm text-muted-foreground'>Manually enter the details for a new job application.</p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-4 px-3 pb-4'>
          <FormField
            control={form.control}
            name='job_title'
            render={({ field }) => (
              <FormItem>
                <FormLabel>Job Title</FormLabel>
                <FormControl>
                  <Input placeholder='Software Engineer' {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name='company_name'
            render={({ field }) => (
              <FormItem>
                <FormLabel>Company Name</FormLabel>
                <FormControl>
                  <Input placeholder='Acme Inc.' {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name='application_date'
            render={({ field }) => (
              <FormItem className='flex flex-col'>
                <FormLabel>Application Date</FormLabel>
                <DatePicker
                  selected={parseDateString(field.value)}
                  onSelect={(date) => field.onChange(date ? formatDateToYYYYMMDD(date) : today)}
                  placeholder='Select application date'
                  disabled={isSubmitting}
                />
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name='application_url'
            render={({ field }) => (
              <FormItem>
                <FormLabel>Application URL</FormLabel>
                <FormControl>
                  <Input placeholder='https://example.com/jobs/123' {...field} value={field.value || ''} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name='contact_person'
            render={({ field }) => (
              <FormItem>
                <FormLabel>Contact Person</FormLabel>
                <FormControl>
                  <Input placeholder='Jane Smith' {...field} value={field.value || ''} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name='contact_email'
            render={({ field }) => (
              <FormItem>
                <FormLabel>Contact Email</FormLabel>
                <FormControl>
                  <Input type='email' placeholder='jane.smith@example.com' {...field} value={field.value || ''} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name='salary_range'
            render={({ field }) => (
              <FormItem>
                <FormLabel>Salary Range</FormLabel>
                <FormControl>
                  <Input placeholder='$80,000 - $100,000' {...field} value={field.value || ''} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className='flex justify-end gap-2 pt-6'>
            <Button type='submit' disabled={isSubmitting}>
              {isSubmitting ? 'Save application' : 'Save application'}
            </Button>
            <Button
              type='button'
              variant='outline'
              onClick={() => {
                form.reset()
                onClose?.()
              }}
              disabled={isSubmitting}>
              Cancel
            </Button>
          </div>
        </form>
      </Form>
    </ScrollArea>
  )
}
