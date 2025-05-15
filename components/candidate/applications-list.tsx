'use client'

import { EditExperienceDialog } from '@/components/candidate/edit-experience-dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { formatDate } from '@/lib/dates'
import { useTRPC } from '@/trpc/client'
import { useQuery } from '@tanstack/react-query'
import {
  AlertCircle,
  Calendar,
  CheckCircle2,
  Clock,
  XCircle,
} from 'lucide-react'
import { useState } from 'react'
import { CandidateApplicationActionsDropdown } from './candidate-application-actions-dropdown'
import { CandidateApplicationsSkeleton } from './skeletons/candidate-applications-skeleton'

type ApplicationStatus =
  | 'applied'
  | 'in-review'
  | 'interview'
  | 'rejected'
  | 'offer'
  | string

const getStatusBadge = (status: ApplicationStatus | null) => {
  switch (status) {
    case 'applied':
      return (
        <Badge variant='outline' className='flex items-center gap-1'>
          <Clock className='h-3 w-3' /> Applied
        </Badge>
      )
    case 'in-review':
      return (
        <Badge variant='warning' className='flex items-center gap-1'>
          <AlertCircle className='size-3' /> In Review
        </Badge>
      )
    case 'interview':
      return (
        <Badge variant='info' className='flex items-center gap-1'>
          <Calendar className='size-3' /> Interview
        </Badge>
      )
    case 'rejected':
      return (
        <Badge variant='destructive' className='flex items-center gap-1'>
          <XCircle className='size-3' /> Rejected
        </Badge>
      )
    case 'offer':
      return (
        <Badge variant='success' className='flex items-center gap-1'>
          <CheckCircle2 className='size-3' /> Offer
        </Badge>
      )
    default:
      return <Badge variant='secondary'>{status || 'Unknown'}</Badge>
  }
}

export function ApplicationsList() {
  const trpcClient = useTRPC()
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 10

  const {
    data: applicationsData,
    isLoading,
    error,
    isFetching,
  } = useQuery(
    trpcClient.candidate.listApplications.queryOptions(
      { page: currentPage, pageSize: pageSize },
      {
        staleTime: 5 * 60 * 1000,
      }
    )
  )

  const applications = applicationsData?.data || []
  const totalCount = applicationsData?.count || 0
  const totalPages = Math.ceil(totalCount / pageSize)

  if (isLoading && !applicationsData) {
    return <CandidateApplicationsSkeleton />
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Job Applications</CardTitle>
        </CardHeader>
        <CardContent>
          <p className='text-red-600'>
            Error loading applications: {error.message}
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className='flex flex-row items-center justify-between'>
        <div>
          <CardTitle>Job Applications</CardTitle>
          <CardDescription>
            Track the status of your job applications
          </CardDescription>
        </div>
        <CandidateApplicationActionsDropdown />
      </CardHeader>
      <CardContent>
        {applications.length === 0 && !isLoading && !isFetching ? (
          <p>No applications found.</p>
        ) : (
          <div className='space-y-4'>
            {applications.map((app) => (
              <div
                key={app.id}
                className='flex flex-col md:flex-row items-start md:items-center justify-between p-4 border rounded'>
                <div className='flex items-center gap-4 mb-3 md:mb-0 flex-grow'>
                  <div className='w-10 h-10 rounded overflow-hidden flex-shrink-0 bg-muted'>
                    {app.company_logo_url ? (
                      // TODO: Revisit this to use Image component from next/image. During POC using GitHub png
                      // requires me to update next.config which I don't want to do.
                      <img
                        src={app.company_logo_url}
                        // src={app.company_logo_url || ''}
                        alt={app.company_name || 'Company'}
                        width={40}
                        height={40}
                        className='w-full h-full object-contain'
                      />
                    ) : (
                      <div className='w-full h-full flex items-center justify-center text-muted-foreground text-xs'>
                        {app.company_name?.substring(0, 1) || '?'}
                      </div>
                    )}
                  </div>
                  <div className='w-full md:w-auto'>
                    <h3 className='font-medium'>{app.job_title || 'N/A'}</h3>
                    <p className='text-sm text-muted-foreground'>
                      {app.company_name || 'N/A'}
                    </p>
                  </div>
                </div>
                <div className='flex flex-col md:flex-row items-start md:items-center gap-3 w-full md:w-auto md:flex-shrink-0'>
                  <div className='flex flex-col gap-1 items-start md:items-end w-full md:w-auto'>
                    {getStatusBadge(app.status as ApplicationStatus | null)}
                    <span className='text-xs text-muted-foreground'>
                      Applied on {formatDate(app.application_date)}
                    </span>
                  </div>
                  <EditExperienceDialog application={app} />
                </div>
              </div>
            ))}
          </div>
        )}
        {totalPages > 1 && (
          <div className='flex justify-center items-center gap-2 mt-6'>
            <Button
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              disabled={currentPage === 1 || isFetching}
              variant='outline'
              size='sm'>
              Previous
            </Button>
            <span className='text-sm text-muted-foreground'>
              Page {currentPage} of {totalPages}
            </span>
            <Button
              onClick={() =>
                setCurrentPage((prev) => Math.min(totalPages, prev + 1))
              }
              disabled={currentPage === totalPages || isFetching}
              variant='outline'
              size='sm'>
              Next
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
