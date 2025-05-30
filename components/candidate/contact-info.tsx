'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useTRPC } from '@/trpc/client'
import type { RouterOutputs } from '@/trpc/routers/_app'
import { useQuery } from '@tanstack/react-query'
import { Github, Globe, Linkedin, Loader2, Mail, MapPin, Phone, Twitter } from 'lucide-react'

interface ContactInfoPropsWithData {
  initialContactData: RouterOutputs['candidate']['getContactInfo'] | null
}

type ContactInfoPropsWithoutData = object

type ContactInfoProps = ContactInfoPropsWithData | ContactInfoPropsWithoutData

function hasData(props: ContactInfoProps): props is ContactInfoPropsWithData {
  return 'initialContactData' in props
}

export function ContactInfo(props: ContactInfoProps) {
  const trpc = useTRPC()

  const {
    data: contactData,
    isLoading,
    error,
  } = useQuery({
    ...trpc.candidate.getContactInfo.queryOptions(undefined),
    ...(hasData(props) ? { initialData: props.initialContactData } : {}),
  })

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Contact Information</CardTitle>
          <CardDescription>Manage your contact details and social profiles</CardDescription>
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
          <CardTitle>Contact Information</CardTitle>
          <CardDescription>Manage your contact details and social profiles</CardDescription>
        </CardHeader>
        <CardContent>
          <p className='text-red-600'>Error loading contact info: {error.message}</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Contact Information</CardTitle>
        <CardDescription>Manage your contact details and social profiles</CardDescription>
      </CardHeader>
      <CardContent>
        <form className='space-y-6'>
          <div className='space-y-4'>
            <h3 className='font-medium'>Basic Information</h3>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              <div className='space-y-2'>
                <Label htmlFor='email'>Email Address</Label>
                <div className='flex'>
                  <div className='flex items-center px-3 border rounded-l-md bg-muted'>
                    <Mail className='h-4 w-4 text-muted-foreground' />
                  </div>
                  <Input
                    id='email'
                    placeholder='your.email@example.com'
                    defaultValue={contactData?.email || ''}
                    className='rounded-l-none'
                  />
                </div>
              </div>
              <div className='space-y-2'>
                <Label htmlFor='phone'>Phone Number</Label>
                <div className='flex'>
                  <div className='flex items-center px-3 border rounded-l-md bg-muted'>
                    <Phone className='h-4 w-4 text-muted-foreground' />
                  </div>
                  <Input
                    id='phone'
                    placeholder='+1 (555) 123-4567'
                    defaultValue={contactData?.phone || ''}
                    className='rounded-l-none'
                  />
                </div>
              </div>
              <div className='space-y-2'>
                <Label htmlFor='location'>Location</Label>
                <div className='flex'>
                  <div className='flex items-center px-3 border rounded-l-md bg-muted'>
                    <MapPin className='h-4 w-4 text-muted-foreground' />
                  </div>
                  <Input
                    id='location'
                    placeholder='City, State, Country'
                    defaultValue={contactData?.location || ''}
                    className='rounded-l-none'
                  />
                </div>
              </div>
              <div className='space-y-2'>
                <Label htmlFor='website'>Personal Website</Label>
                <div className='flex'>
                  <div className='flex items-center px-3 border rounded-l-md bg-muted'>
                    <Globe className='h-4 w-4 text-muted-foreground' />
                  </div>
                  <Input
                    id='website'
                    placeholder='https://yourwebsite.com'
                    defaultValue={contactData?.website || ''}
                    className='rounded-l-none'
                  />
                </div>
              </div>
            </div>
          </div>

          <div className='space-y-4'>
            <h3 className='font-medium'>Social Profiles</h3>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              <div className='space-y-2'>
                <Label htmlFor='linkedin'>LinkedIn</Label>
                <div className='flex'>
                  <div className='flex items-center px-3 border rounded-l-md bg-muted'>
                    <Linkedin className='h-4 w-4 text-muted-foreground' />
                  </div>
                  <Input
                    id='linkedin'
                    placeholder='linkedin.com/in/username'
                    defaultValue={contactData?.linkedin || ''}
                    className='rounded-l-none'
                  />
                </div>
              </div>
              <div className='space-y-2'>
                <Label htmlFor='github'>GitHub</Label>
                <div className='flex'>
                  <div className='flex items-center px-3 border rounded-l-md bg-muted'>
                    <Github className='h-4 w-4 text-muted-foreground' />
                  </div>
                  <Input
                    id='github'
                    placeholder='github.com/username'
                    defaultValue={contactData?.github || ''}
                    className='rounded-l-none'
                  />
                </div>
              </div>
              <div className='space-y-2'>
                <Label htmlFor='twitter'>Twitter</Label>
                <div className='flex'>
                  <div className='flex items-center px-3 border rounded-l-md bg-muted'>
                    <Twitter className='h-4 w-4 text-muted-foreground' />
                  </div>
                  <Input
                    id='twitter'
                    placeholder='twitter.com/username'
                    defaultValue={contactData?.twitter || ''}
                    className='rounded-l-none'
                  />
                </div>
              </div>
            </div>
          </div>

          <div className='space-y-4'>
            <h3 className='font-medium'>Additional Information</h3>
            <div className='space-y-2'>
              <Label htmlFor='bio'>Professional Summary</Label>
              <Textarea
                id='bio'
                placeholder='Write a short professional summary...'
                defaultValue={contactData?.bio || ''}
                className='min-h-[120px]'
              />
            </div>
          </div>

          <div className='flex justify-end gap-3'>
            <Button variant='outline'>Cancel</Button>
            <Button>Save Changes</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
