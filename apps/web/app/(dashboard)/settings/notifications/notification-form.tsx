'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { useEffect } from 'react'

import { useTRPC } from '@/trpc/client'
import { Button } from '@seeds/ui/button'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@seeds/ui/form'
import { Switch } from '@seeds/ui/switch'
import { Alert, AlertDescription } from '@seeds/ui/alert'
import { InfoIcon } from 'lucide-react'
import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'

const notificationsFormSchema = z.object({
  // Application activity notifications
  new_application: z.boolean().default(true),
  application_status_change: z.boolean().default(true),
  application_reminders: z.boolean().default(true),
  
  // Team collaboration notifications
  team_mentions: z.boolean().default(true),
  new_comments: z.boolean().default(true),
  assigned_to_application: z.boolean().default(true),
  
  // System notifications
  pipeline_updates: z.boolean().default(false),
  job_posting_expiry: z.boolean().default(true),
  weekly_summary: z.boolean().default(false),
  
  // Critical notifications (always on)
  security_alerts: z.boolean().default(true),
})

type NotificationsFormValues = z.infer<typeof notificationsFormSchema>

interface NotificationsFormProps {
  initialSettings?: Record<string, unknown> | null
}

export function NotificationsForm({ initialSettings }: NotificationsFormProps) {
  const form = useForm<NotificationsFormValues>({
    resolver: zodResolver(notificationsFormSchema),
    defaultValues: {
      new_application: true,
      application_status_change: true,
      application_reminders: true,
      team_mentions: true,
      new_comments: true,
      assigned_to_application: true,
      pipeline_updates: false,
      job_posting_expiry: true,
      weekly_summary: false,
      security_alerts: true,
    },
  })

  const trpc = useTRPC()
  const updateSettings = useMutation(trpc.organization.updateUserSettingsPartial.mutationOptions())

  // Load saved notification preferences
  useEffect(() => {
    if (initialSettings) {
      const notifications = initialSettings.notifications as Record<string, boolean>
      if (notifications) {
        Object.entries(notifications).forEach(([key, value]) => {
          if (key in notificationsFormSchema.shape) {
            form.setValue(key as keyof NotificationsFormValues, value)
          }
        })
      }
    }
  }, [initialSettings, form])

  async function onSubmit(data: NotificationsFormValues) {
    try {
      await updateSettings.mutateAsync({
        path: 'notifications',
        value: data,
      })

      toast.success('Notification preferences updated successfully')
    } catch (error) {
      toast.error('Failed to update notification preferences')
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-8'>
        <Alert>
          <InfoIcon className="h-4 w-4" />
          <AlertDescription>
            Notification settings are being prepared for future implementation. 
            Configure your preferences now to be ready when the notification system launches.
          </AlertDescription>
        </Alert>

        <div>
          <h3 className='mb-4 text-lg font-medium'>Application Activity</h3>
          <div className='space-y-4'>
            <FormField
              control={form.control}
              name='new_application'
              render={({ field }) => (
                <FormItem className='flex flex-row items-center justify-between rounded-lg border p-4'>
                  <div className='space-y-0.5'>
                    <FormLabel className='text-base'>
                      New applications
                    </FormLabel>
                    <FormDescription>
                      Get notified when someone applies to your job postings.
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='application_status_change'
              render={({ field }) => (
                <FormItem className='flex flex-row items-center justify-between rounded-lg border p-4'>
                  <div className='space-y-0.5'>
                    <FormLabel className='text-base'>
                      Application status changes
                    </FormLabel>
                    <FormDescription>
                      Receive updates when applications move through your pipeline.
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='application_reminders'
              render={({ field }) => (
                <FormItem className='flex flex-row items-center justify-between rounded-lg border p-4'>
                  <div className='space-y-0.5'>
                    <FormLabel className='text-base'>
                      Application reminders
                    </FormLabel>
                    <FormDescription>
                      Get reminded about applications requiring action.
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>
        </div>

        <div>
          <h3 className='mb-4 text-lg font-medium'>Team Collaboration</h3>
          <div className='space-y-4'>
            <FormField
              control={form.control}
              name='team_mentions'
              render={({ field }) => (
                <FormItem className='flex flex-row items-center justify-between rounded-lg border p-4'>
                  <div className='space-y-0.5'>
                    <FormLabel className='text-base'>
                      Team mentions
                    </FormLabel>
                    <FormDescription>
                      Get notified when teammates mention you in comments.
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='new_comments'
              render={({ field }) => (
                <FormItem className='flex flex-row items-center justify-between rounded-lg border p-4'>
                  <div className='space-y-0.5'>
                    <FormLabel className='text-base'>
                      New comments
                    </FormLabel>
                    <FormDescription>
                      Receive notifications for new comments on applications you're involved with.
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='assigned_to_application'
              render={({ field }) => (
                <FormItem className='flex flex-row items-center justify-between rounded-lg border p-4'>
                  <div className='space-y-0.5'>
                    <FormLabel className='text-base'>
                      Application assignments
                    </FormLabel>
                    <FormDescription>
                      Get notified when you're assigned to review an application.
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>
        </div>

        <div>
          <h3 className='mb-4 text-lg font-medium'>System Updates</h3>
          <div className='space-y-4'>
            <FormField
              control={form.control}
              name='pipeline_updates'
              render={({ field }) => (
                <FormItem className='flex flex-row items-center justify-between rounded-lg border p-4'>
                  <div className='space-y-0.5'>
                    <FormLabel className='text-base'>
                      Pipeline updates
                    </FormLabel>
                    <FormDescription>
                      Get notified about changes to hiring pipelines.
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='job_posting_expiry'
              render={({ field }) => (
                <FormItem className='flex flex-row items-center justify-between rounded-lg border p-4'>
                  <div className='space-y-0.5'>
                    <FormLabel className='text-base'>
                      Job posting expiry
                    </FormLabel>
                    <FormDescription>
                      Get reminded before your job postings expire.
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='weekly_summary'
              render={({ field }) => (
                <FormItem className='flex flex-row items-center justify-between rounded-lg border p-4'>
                  <div className='space-y-0.5'>
                    <FormLabel className='text-base'>
                      Weekly summary
                    </FormLabel>
                    <FormDescription>
                      Receive a weekly summary of your recruiting activity.
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='security_alerts'
              render={({ field }) => (
                <FormItem className='flex flex-row items-center justify-between rounded-lg border p-4'>
                  <div className='space-y-0.5'>
                    <FormLabel className='text-base'>
                      Security alerts
                    </FormLabel>
                    <FormDescription>
                      Important security notifications about your account.
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      disabled
                      aria-readonly
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>
        </div>

        <Button type='submit'>Update notification preferences</Button>
      </form>
    </Form>
  )
}