'use client'

import { updateCandidateProfileSchema } from '@/actions/schema'
import { updateCandidateProfileAction } from '@/actions/update-candidate-action'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import type { Database } from '@/supabase/types/db'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  Briefcase,
  Github,
  Globe,
  Linkedin,
  Loader2,
  Mail,
  MapPin,
  Phone,
  Twitter,
  User,
} from 'lucide-react'
import { useAction } from 'next-safe-action/hooks'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

type CandidateProfile =
  Database['public']['Tables']['candidate_profiles']['Row']

const formSchema = updateCandidateProfileSchema.extend({
  email: z.string().email(),
})

type PersonalInfoFormValues = z.infer<typeof formSchema>

interface PersonalInfoFormProps {
  initialData: CandidateProfile | null
  userEmail: string
}

export function PersonalInfoForm({
  initialData,
  userEmail,
}: PersonalInfoFormProps) {
  const router = useRouter()

  const { execute: updateProfile, status } = useAction(
    updateCandidateProfileAction,
    {
      onSuccess: (data) => {
        console.log('Profile updated successfully via action:', data)
        router.push('/candidate-onboarding/education')
      },
      onError: (error) => {
        console.error('Profile update failed via action:', error)
      },
    }
  )

  const form = useForm<PersonalInfoFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      firstName: initialData?.first_name ?? '',
      lastName: initialData?.last_name ?? '',
      jobTitle: initialData?.job_title ?? undefined,
      email: userEmail,
      location: initialData?.location ?? '',
      phone: initialData?.phone_number ?? undefined,
      website: initialData?.personal_website_url ?? '',
      linkedin: initialData?.linkedin_url ?? '',
      github: initialData?.github_url ?? '',
      twitter: initialData?.twitter_url ?? '',
      bio: initialData?.bio ?? undefined,
    },
  })

  const isSubmitting = status === 'executing'

  const iconContainerClass =
    'flex items-center px-3 border rounded-l-md bg-muted'
  const inputClass = 'rounded-l-none'

  const handleFormSubmit = (values: PersonalInfoFormValues) => {
    const { ...payload } = values
    updateProfile(payload)
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(handleFormSubmit)}
        className='space-y-6'>
        <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
          <FormField
            control={form.control}
            name='firstName'
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  First Name <span className='text-red-500'>*</span>
                </FormLabel>
                <div className='flex'>
                  <div className={iconContainerClass}>
                    <User className='h-4 w-4 text-muted-foreground' />
                  </div>
                  <FormControl>
                    <Input
                      placeholder='John'
                      className={inputClass}
                      {...field}
                      disabled={isSubmitting}
                    />
                  </FormControl>
                </div>
                <FormDescription>Your legal first name.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name='lastName'
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Last Name <span className='text-red-500'>*</span>
                </FormLabel>
                <div className='flex'>
                  <div className={iconContainerClass}>
                    <User className='h-4 w-4 text-muted-foreground' />
                  </div>
                  <FormControl>
                    <Input
                      placeholder='Doe'
                      className={inputClass}
                      {...field}
                      disabled={isSubmitting}
                    />
                  </FormControl>
                </div>
                <FormDescription>Your legal last name.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name='jobTitle'
            render={({ field }) => (
              <FormItem>
                <FormLabel>Job Title</FormLabel>
                <div className='flex'>
                  <div className={iconContainerClass}>
                    <Briefcase className='h-4 w-4 text-muted-foreground' />
                  </div>
                  <FormControl>
                    <Input
                      placeholder='Software Engineer'
                      className={inputClass}
                      {...field}
                      value={field.value ?? ''}
                      disabled={isSubmitting}
                    />
                  </FormControl>
                </div>
                <FormDescription>
                  Your current or most recent role. (Optional)
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name='email'
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Email <span className='text-red-500'>*</span>
                </FormLabel>
                <div className='flex'>
                  <div className={iconContainerClass}>
                    <Mail className='h-4 w-4 text-muted-foreground' />
                  </div>
                  <FormControl>
                    <Input
                      placeholder='john.doe@example.com'
                      className={inputClass}
                      {...field}
                      disabled
                    />
                  </FormControl>
                </div>
                <FormDescription>
                  Your account email (cannot be changed here).
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name='phone'
            render={({ field }) => (
              <FormItem>
                <FormLabel>Phone Number</FormLabel>
                <div className='flex'>
                  <div className={iconContainerClass}>
                    <Phone className='h-4 w-4 text-muted-foreground' />
                  </div>
                  <FormControl>
                    <Input
                      placeholder='+1 (555) 123-4567'
                      className={inputClass}
                      {...field}
                      value={field.value ?? ''}
                      disabled={isSubmitting}
                    />
                  </FormControl>
                </div>
                <FormDescription>Optional</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name='location'
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Location <span className='text-red-500'>*</span>
                </FormLabel>
                <div className='flex'>
                  <div className={iconContainerClass}>
                    <MapPin className='h-4 w-4 text-muted-foreground' />
                  </div>
                  <FormControl>
                    <Input
                      placeholder='San Francisco, CA'
                      className={inputClass}
                      {...field}
                      disabled={isSubmitting}
                    />
                  </FormControl>
                </div>
                <FormDescription>City and state/country.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name='website'
            render={({ field }) => (
              <FormItem>
                <FormLabel>Personal Website</FormLabel>
                <div className='flex'>
                  <div className={iconContainerClass}>
                    <Globe className='h-4 w-4 text-muted-foreground' />
                  </div>
                  <FormControl>
                    <Input
                      placeholder='https://yourwebsite.com'
                      className={inputClass}
                      {...field}
                      value={field.value ?? ''}
                      disabled={isSubmitting}
                    />
                  </FormControl>
                </div>
                <FormDescription>Optional</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name='linkedin'
            render={({ field }) => (
              <FormItem>
                <FormLabel>LinkedIn</FormLabel>
                <div className='flex'>
                  <div className={iconContainerClass}>
                    <Linkedin className='h-4 w-4 text-muted-foreground' />
                  </div>
                  <FormControl>
                    <Input
                      placeholder='https://linkedin.com/in/username'
                      className={inputClass}
                      {...field}
                      value={field.value ?? ''}
                      disabled={isSubmitting}
                    />
                  </FormControl>
                </div>
                <FormDescription>Optional</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name='github'
            render={({ field }) => (
              <FormItem>
                <FormLabel>GitHub</FormLabel>
                <div className='flex'>
                  <div className={iconContainerClass}>
                    <Github className='h-4 w-4 text-muted-foreground' />
                  </div>
                  <FormControl>
                    <Input
                      placeholder='https://github.com/username'
                      className={inputClass}
                      {...field}
                      value={field.value ?? ''}
                      disabled={isSubmitting}
                    />
                  </FormControl>
                </div>
                <FormDescription>Optional</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name='twitter'
            render={({ field }) => (
              <FormItem>
                <FormLabel>Twitter</FormLabel>
                <div className='flex'>
                  <div className={iconContainerClass}>
                    <Twitter className='h-4 w-4 text-muted-foreground' />
                  </div>
                  <FormControl>
                    <Input
                      placeholder='https://twitter.com/username'
                      className={inputClass}
                      {...field}
                      value={field.value ?? ''}
                      disabled={isSubmitting}
                    />
                  </FormControl>
                </div>
                <FormDescription>Optional</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name='bio'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Professional Summary</FormLabel>
              <FormControl>
                <Textarea
                  placeholder='Write a short professional summary...'
                  className='min-h-[112px]'
                  {...field}
                  value={field.value ?? ''}
                  disabled={isSubmitting}
                />
              </FormControl>
              <FormDescription>
                Optional - Brief description of your professional background
                (max 500 characters)
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className='flex justify-end'>
          <Button type='submit' disabled={isSubmitting}>
            {isSubmitting ? (
              <Loader2 className='mr-2 h-4 w-4 animate-spin' />
            ) : null}
            Continue
          </Button>
        </div>
      </form>
    </Form>
  )
}
