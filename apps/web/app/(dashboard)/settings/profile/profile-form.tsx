'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

import { useTRPC } from '@/trpc/client'
import { Button } from '@seeds/ui/button'
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@seeds/ui/form'
import { Input } from '@seeds/ui/input'
import { Textarea } from '@seeds/ui/textarea'
import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'

const profileFormSchema = z.object({
  name: z
    .string()
    .min(2, {
      message: 'Name must be at least 2 characters.',
    })
    .max(50, {
      message: 'Name must not be longer than 50 characters.',
    }),
  email: z.string().email({
    message: 'Please enter a valid email address.',
  }),
  bio: z
    .string()
    .max(500, {
      message: 'Bio must not be longer than 500 characters.',
    })
    .optional(),
  github_url: z
    .string()
    .optional()
    .refine((val) => !val || val === '' || z.string().url().safeParse(val).success, {
      message: 'Please enter a valid GitHub URL.',
    }),
  linkedin_url: z
    .string()
    .optional()
    .refine((val) => !val || val === '' || z.string().url().safeParse(val).success, {
      message: 'Please enter a valid LinkedIn URL.',
    }),
  twitter_url: z
    .string()
    .optional()
    .refine((val) => !val || val === '' || z.string().url().safeParse(val).success, {
      message: 'Please enter a valid Twitter URL.',
    }),
  website_url: z
    .string()
    .optional()
    .refine((val) => !val || val === '' || z.string().url().safeParse(val).success, {
      message: 'Please enter a valid website URL.',
    }),
})

type ProfileFormValues = z.infer<typeof profileFormSchema>

interface ProfileFormProps {
  initialSettings?: Record<string, unknown> | null
}

export function ProfileForm({ initialSettings }: ProfileFormProps) {
  // Use server-provided data or empty strings as fallback
  const profile = initialSettings?.profile as Record<string, unknown> || {}
  
  const defaultValues: Partial<ProfileFormValues> = {
    name: (profile.name as string) || '',
    email: (profile.email as string) || '',
    bio: (profile.bio as string) || '',
    github_url: (profile.github_url as string) || '',
    linkedin_url: (profile.linkedin_url as string) || '',
    twitter_url: (profile.twitter_url as string) || '',
    website_url: (profile.website_url as string) || '',
  }
  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues,
  })

  const trpc = useTRPC()
  const updateSettings = useMutation(trpc.organization.updateUserSettingsPartial.mutationOptions())

  async function onSubmit(data: ProfileFormValues) {
    try {
      await updateSettings.mutateAsync({
        path: 'profile',
        value: data,
      })

      toast.success('Profile updated successfully')
    } catch (error) {
      toast.error('Failed to update profile')
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-8'>
        <FormField
          control={form.control}
          name='name'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Display Name</FormLabel>
              <FormControl>
                <Input placeholder='Your full name' {...field} />
              </FormControl>
              <FormDescription>This is the name that will be displayed on your profile and in emails.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name='email'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input placeholder='your.email@example.com' {...field} />
              </FormControl>
              <FormDescription>Your primary email address for notifications and communication.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name='bio'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Bio</FormLabel>
              <FormControl>
                <Textarea placeholder='Tell us a little bit about yourself' className='resize-none' {...field} />
              </FormControl>
              <FormDescription>A brief description of yourself (optional).</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
          <FormField
            control={form.control}
            name='github_url'
            render={({ field }) => (
              <FormItem>
                <FormLabel>GitHub URL</FormLabel>
                <FormControl>
                  <Input placeholder='https://github.com/username' {...field} />
                </FormControl>
                <FormDescription>Your GitHub profile (optional)</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name='linkedin_url'
            render={({ field }) => (
              <FormItem>
                <FormLabel>LinkedIn URL</FormLabel>
                <FormControl>
                  <Input placeholder='https://linkedin.com/in/username' {...field} />
                </FormControl>
                <FormDescription>Your LinkedIn profile (optional)</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name='twitter_url'
            render={({ field }) => (
              <FormItem>
                <FormLabel>Twitter URL</FormLabel>
                <FormControl>
                  <Input placeholder='https://x.com/username' {...field} />
                </FormControl>
                <FormDescription>Your X (Twitter) profile (optional)</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name='website_url'
            render={({ field }) => (
              <FormItem>
                <FormLabel>Website URL</FormLabel>
                <FormControl>
                  <Input placeholder='https://yourwebsite.com' {...field} />
                </FormControl>
                <FormDescription>Your personal website or portfolio (optional)</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <Button type='submit'>Update profile</Button>
      </form>
    </Form>
  )
}
