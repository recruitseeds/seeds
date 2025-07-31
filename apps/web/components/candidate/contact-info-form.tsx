'use client'
import { Button } from '../ui/button'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '../ui/form'
import { Input } from '../ui/input'
import { Textarea } from '../ui/textarea'
import { useTRPC } from '@/trpc/client'
import type { RouterOutputs } from '@/trpc/routers/_app'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Github, Globe, Linkedin, Loader2, Mail, MapPin, Phone, Twitter, User } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

const contactSchema = z.object({
  first_name: z.string().max(100).optional().nullable(),
  last_name: z.string().max(100).optional().nullable(),
  phone_number: z.string().max(50).optional().nullable(),
  location: z.string().max(255).optional().nullable(),
  personal_website_url: z.string().url('Please enter a valid URL').optional().or(z.literal('')).nullable(),
  linkedin_url: z.string().url('Please enter a valid URL').optional().or(z.literal('')).nullable(),
  github_url: z.string().url('Please enter a valid URL').optional().or(z.literal('')).nullable(),
  twitter_url: z.string().url('Please enter a valid URL').optional().or(z.literal('')).nullable(),
  bio: z.string().max(2000).optional().nullable(),
})

type ContactFormValues = z.infer<typeof contactSchema>

interface ContactInfoFormProps {
  initialData: RouterOutputs['candidate']['getContactInfo']
}

export function ContactInfoForm({ initialData }: ContactInfoFormProps) {
  const trpc = useTRPC()
  const queryClient = useQueryClient()

  const form = useForm<ContactFormValues>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      first_name: (initialData as any).first_name || '',
      last_name: (initialData as any).last_name || '',
      phone_number: initialData.phone_number || '',
      location: initialData.location || '',
      personal_website_url: initialData.personal_website_url || '',
      linkedin_url: initialData.linkedin_url || '',
      github_url: initialData.github_url || '',
      twitter_url: initialData.twitter_url || '',
      bio: initialData.bio || '',
    },
  })

  const updateContactMutation = useMutation(
    trpc.candidate.updateContactInfo.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries(trpc.candidate.getContactInfo.queryFilter())
      },
      onError: (error) => {
        console.error('Failed to update contact info:', error.message)
      },
    })
  )

  const onSubmit = (data: ContactFormValues) => {
    const cleanedData = Object.fromEntries(
      Object.entries(data).map(([key, value]) => [key, value === '' ? null : value])
    ) as ContactFormValues
    updateContactMutation.mutate(cleanedData)
  }

  const onCancel = () => {
    form.reset({
      first_name: (initialData as any).first_name || '',
      last_name: (initialData as any).last_name || '',
      phone_number: initialData.phone_number || '',
      location: initialData.location || '',
      personal_website_url: initialData.personal_website_url || '',
      linkedin_url: initialData.linkedin_url || '',
      github_url: initialData.github_url || '',
      twitter_url: initialData.twitter_url || '',
      bio: initialData.bio || '',
    })
  }

  const isSubmitting = form.formState.isSubmitting || updateContactMutation.isPending

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-6'>
        <div className='space-y-4'>
          <h3 className='font-medium'>Basic Information</h3>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            {/* First Name */}
            <FormField
              control={form.control}
              name='first_name'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>First Name</FormLabel>
                  <FormControl>
                    <div className='flex'>
                      <div className='flex items-center px-3 border rounded-l-md bg-muted'>
                        <User className='h-4 w-4 text-muted-foreground' />
                      </div>
                      <Input placeholder='First name' className='rounded-l-none' {...field} value={field.value || ''} />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name='last_name'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Last Name</FormLabel>
                  <FormControl>
                    <div className='flex'>
                      <div className='flex items-center px-3 border rounded-l-md bg-muted'>
                        <User className='h-4 w-4 text-muted-foreground' />
                      </div>
                      <Input placeholder='Last name' className='rounded-l-none' {...field} value={field.value || ''} />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className='space-y-2'>
              <label htmlFor='email' className='text-sm font-medium'>
                Email Address
              </label>
              <div className='flex'>
                <div className='flex items-center px-3 border rounded-l-md bg-muted'>
                  <Mail className='h-4 w-4 text-muted-foreground' />
                </div>
                <Input
                  id='email'
                  placeholder='your.email@example.com'
                  value={initialData.email || ''}
                  disabled
                  className='rounded-l-none bg-muted'
                />
              </div>
              {/* <span className='text-xs text-muted-foreground sr-only'>Email cannot be changed here</span> */}
            </div>
            <FormField
              control={form.control}
              name='phone_number'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone Number</FormLabel>
                  <FormControl>
                    <div className='flex'>
                      <div className='flex items-center px-3 border rounded-l-md bg-muted h-9'>
                        <Phone className='size-4 text-muted-foreground' />
                      </div>
                      <Input
                        placeholder='+1 (555) 123-4567'
                        className='rounded-l-none'
                        {...field}
                        value={field.value || ''}
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name='location'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Location</FormLabel>
                  <FormControl>
                    <div className='flex'>
                      <div className='flex items-center px-3 border rounded-l-md bg-muted'>
                        <MapPin className='h-4 w-4 text-muted-foreground' />
                      </div>
                      <Input
                        placeholder='City, State, Country'
                        className='rounded-l-none'
                        {...field}
                        value={field.value || ''}
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        <div className='space-y-4'>
          <h3 className='font-medium'>Social Profiles</h3>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            <FormField
              control={form.control}
              name='personal_website_url'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Personal Website</FormLabel>
                  <FormControl>
                    <div className='flex'>
                      <div className='flex items-center px-3 border rounded-l-md bg-muted'>
                        <Globe className='h-4 w-4 text-muted-foreground' />
                      </div>
                      <Input
                        placeholder='https://yourwebsite.com'
                        className='rounded-l-none'
                        {...field}
                        value={field.value || ''}
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name='linkedin_url'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>LinkedIn</FormLabel>
                  <FormControl>
                    <div className='flex'>
                      <div className='flex items-center px-3 border rounded-l-md bg-muted'>
                        <Linkedin className='h-4 w-4 text-muted-foreground' />
                      </div>
                      <Input
                        placeholder='https://linkedin.com/in/username'
                        className='rounded-l-none'
                        {...field}
                        value={field.value || ''}
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name='github_url'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>GitHub</FormLabel>
                  <FormControl>
                    <div className='flex'>
                      <div className='flex items-center px-3 border rounded-l-md bg-muted'>
                        <Github className='h-4 w-4 text-muted-foreground' />
                      </div>
                      <Input
                        placeholder='https://github.com/username'
                        className='rounded-l-none'
                        {...field}
                        value={field.value || ''}
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name='twitter_url'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Twitter</FormLabel>
                  <FormControl>
                    <div className='flex'>
                      <div className='flex items-center px-3 border rounded-l-md bg-muted'>
                        <Twitter className='h-4 w-4 text-muted-foreground' />
                      </div>
                      <Input
                        placeholder='https://twitter.com/username'
                        className='rounded-l-none'
                        {...field}
                        value={field.value || ''}
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        <div className='space-y-4'>
          <h3 className='font-medium'>Additional Information</h3>
          <FormField
            control={form.control}
            name='bio'
            render={({ field }) => (
              <FormItem>
                <FormLabel>Professional Summary</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder='Write a short professional summary...'
                    className='min-h-[120px]'
                    {...field}
                    value={field.value || ''}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className='flex justify-end gap-3'>
          <Button type='submit' disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                Save Changes
              </>
            ) : (
              'Save Changes'
            )}
          </Button>
        </div>
      </form>
    </Form>
  )
}
