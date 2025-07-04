import { ClientAvatarUpload } from '@/components/candidate/avatar-upload'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import type { RouterOutputs } from '@/trpc/routers/_app'
import { getServerTRPCCaller } from '@/trpc/server'
import { Calendar, MapPin } from 'lucide-react'
import type React from 'react'
import { Suspense } from 'react'

const getInitials = (firstName?: string | null, lastName?: string | null): string => {
  if (firstName && lastName) {
    return `${firstName[0]}${lastName[0]}`.toUpperCase()
  }
  if (firstName) {
    return firstName.substring(0, 2).toUpperCase()
  }
  if (lastName) {
    return lastName.substring(0, 2).toUpperCase()
  }
  return '??'
}

type ProfileLayoutData = RouterOutputs['candidate']['getProfile']
type ApplicationSummaryData = RouterOutputs['candidate']['getApplicationSummary']

function ApplicationSummaryLoadingSkeleton() {
  return (
    <Card className='flex-1 shadow-none' flat>
      <CardHeader className='pb-2'>
        <CardTitle>Application Summary</CardTitle>
        <CardDescription>Overview of your job applications</CardDescription>
      </CardHeader>
      <CardContent>
        <div className='grid grid-cols-2 lg:grid-cols-4 gap-4'>
          <div className='flex flex-col items-center justify-center p-3 bg-secondary/50 rounded-lg'>
            <div className='text-2xl font-bold'>0</div>
            <div className='text-sm text-muted-foreground'>Total Applications</div>
          </div>
          <div className='flex flex-col items-center justify-center p-3 bg-warning/50 rounded-lg'>
            <div className='text-2xl font-bold text-warning-foreground'>0</div>
            <div className='text-sm text-muted-foreground'>In Review</div>
          </div>
          <div className='flex flex-col items-center justify-center p-3 bg-info/50 rounded-lg'>
            <div className='text-2xl font-bold text-info-foreground'>0</div>
            <div className='text-sm text-muted-foreground'>Interviews</div>
          </div>
          <div className='flex flex-col items-center justify-center p-3 bg-success/50 rounded-lg'>
            <div className='text-2xl font-bold text-success-foreground'>0</div>
            <div className='text-sm text-muted-foreground'>Offers</div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

async function ApplicationSummary() {
  const caller = await getServerTRPCCaller()
  let summary: ApplicationSummaryData = {
    total: 0,
    inReview: 0,
    interviews: 0,
    offers: 0,
  }

  try {
    summary = await caller.candidate.getApplicationSummary()
  } catch (error) {
    console.error('Error fetching application summary in layout:', error)
  }

  return (
    <Card className='flex-1 shadow-none border-none' flat>
      <CardHeader className='pb-2'>
        <CardTitle>Application Summary</CardTitle>
        <CardDescription>Overview of your job applications</CardDescription>
      </CardHeader>
      <CardContent>
        <div className='grid grid-cols-2 lg:grid-cols-4 gap-4'>
          <div className='flex flex-col items-center justify-center p-3 bg-secondary/50 rounded-lg'>
            <div className='text-2xl font-bold'>{summary.total}</div>
            <div className='text-sm text-muted-foreground'>Total Applications</div>
          </div>
          <div className='flex flex-col items-center justify-center p-3 bg-warning/50 rounded-lg'>
            <div className='text-2xl font-bold text-warning-foreground'>{summary.inReview}</div>
            <div className='text-sm text-muted-foreground'>In Review</div>
          </div>
          <div className='flex flex-col items-center justify-center p-3 bg-info/50 rounded-lg'>
            <div className='text-2xl font-bold text-info-foreground'>{summary.interviews}</div>
            <div className='text-sm text-muted-foreground'>Interviews</div>
          </div>
          <div className='flex flex-col items-center justify-center p-3 bg-success/50 rounded-lg'>
            <div className='text-2xl font-bold text-success-foreground'>{summary.offers}</div>
            <div className='text-sm text-muted-foreground'>Offers</div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default async function CandidateProfileLayout({ children }: { children: React.ReactNode }) {
  const caller = await getServerTRPCCaller()
  let profileData: ProfileLayoutData | null = null

  try {
    profileData = await caller.candidate.getProfile()
  } catch (error) {
    console.error('Error fetching profile in layout:', error)
  }

  return (
    <div className='container mx-auto max-w-5xl py-6 px-4 md:px-6'>
      <div className='flex flex-col md:flex-row gap-6 mb-6'>
        <div className='flex flex-col items-center gap-4'>
          <ClientAvatarUpload
            userId={profileData?.id || ''}
            initialAvatarUrl={profileData?.avatar_url}
            fallbackInitials={getInitials(profileData?.first_name, profileData?.last_name)}
          />
          <div className='text-center'>
            <h1 className='text-2xl font-bold'>
              {profileData?.first_name || 'N/A'} {profileData?.last_name || ''}
            </h1>
            <p className='text-muted-foreground'>{profileData?.job_title || 'Job Title N/A'}</p>
          </div>
          <div className='flex flex-wrap gap-2 justify-center'>
            {profileData?.location && (
              <Badge variant='outline' className='flex items-center gap-1'>
                <MapPin className='h-3 w-3' /> {profileData.location}
              </Badge>
            )}
            {profileData?.created_at && (
              <Badge variant='outline' className='flex items-center gap-1'>
                <Calendar className='h-3 w-3' /> Joined{' '}
                {new Date(profileData.created_at).toLocaleDateString('en-US', {
                  month: 'short',
                  year: 'numeric',
                })}
              </Badge>
            )}
          </div>
        </div>
        <Suspense fallback={<ApplicationSummaryLoadingSkeleton />}>
          <ApplicationSummary />
        </Suspense>
      </div>
      <main>{children}</main>
    </div>
  )
}
