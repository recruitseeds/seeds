'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { useTRPC } from '@/trpc/client'
import type { RouterOutputs } from '@/trpc/routers/_app'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Edit3, Plus, Trash2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { toast } from 'sonner'

// Helper function to format job type for display
const formatJobType = (jobType: string) => {
  const typeMap: Record<string, string> = {
    full_time: 'Full-time',
    part_time: 'Part-time',
    contract: 'Contract',
    internship: 'Internship',
    temporary: 'Temporary',
  }
  return typeMap[jobType] || jobType
}

// Helper function to format department for display
const formatDepartment = (department: string | null) => {
  if (!department) return null
  const deptMap: Record<string, string> = {
    engineering: 'Engineering',
    product: 'Product',
    sales: 'Sales',
    marketing: 'Marketing',
    'customer-support': 'Customer Support',
    hr: 'HR',
    finance: 'Finance',
  }
  return deptMap[department] || department
}

// Helper function to extract preview text from job content
const extractPreviewText = (content: any): string => {
  if (!content || !content.content) return ''

  // Look for the first paragraph with actual text
  for (const node of content.content) {
    if (node.type === 'paragraph' && node.content) {
      for (const textNode of node.content) {
        if (textNode.type === 'text' && textNode.text) {
          // Return first 100 characters with ellipsis
          const text = textNode.text.trim()
          return text.length > 100 ? `${text.substring(0, 100)}...` : text
        }
      }
    }
  }
  return ''
}

// Helper function to format relative time
const formatRelativeTime = (dateString: string) => {
  const date = new Date(dateString)
  const now = new Date()
  const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))

  if (diffInHours < 1) return 'Less than an hour ago'
  if (diffInHours < 24) return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`

  const diffInDays = Math.floor(diffInHours / 24)
  if (diffInDays < 7) return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`

  const diffInWeeks = Math.floor(diffInDays / 7)
  if (diffInWeeks < 4) return `${diffInWeeks} week${diffInWeeks > 1 ? 's' : ''} ago`

  return date.toLocaleDateString()
}

interface JobPosting {
  id: string
  title: string
  job_type: string
  department: string | null
  content: any
  updated_at: string | null
  created_at: string | null
}

interface DraftCardProps {
  job: JobPosting
  isEditMode: boolean
  isSelected: boolean
  onSelect: (id: string, selected: boolean) => void
  onClick: () => void
}

function DraftCard({ job, isEditMode, isSelected, onSelect, onClick }: DraftCardProps) {
  const displayTitle = job.title || 'Untitled'
  const jobType = formatJobType(job.job_type)
  const department = formatDepartment(job.department)
  const previewText = extractPreviewText(job.content)
  const lastModified = formatRelativeTime(job.updated_at || job.created_at || '')

  const handleCardClick = () => {
    if (isEditMode) {
      onSelect(job.id, !isSelected)
    } else {
      onClick()
    }
  }

  return (
    <div className='relative'>
      {isEditMode && (
        <div className='absolute -top-2 -right-2 z-10'>
          <Checkbox
            checked={isSelected}
            onCheckedChange={(checked) => onSelect(job.id, !!checked)}
            className='h-5 w-5 border-2 border-white shadow-lg bg-white'
          />
        </div>
      )}
      <Card
        className={`cursor-pointer transition-all hover:shadow-md ${
          isEditMode ? 'hover:border-gray-300' : 'hover:border-blue-300'
        } ${isSelected ? 'border-blue-500 bg-blue-50' : ''}`}
        onClick={handleCardClick}>
        <CardHeader className='pb-3'>
          <div className='space-y-2'>
            <h3 className='font-semibold text-lg leading-tight line-clamp-2'>{displayTitle}</h3>
            <div className='flex flex-wrap gap-2'>
              <span className='inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800'>
                {jobType}
              </span>
              {department && (
                <span className='inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800'>
                  {department}
                </span>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className='pt-0'>
          <div className='space-y-3'>
            {previewText && <p className='text-sm text-gray-600 line-clamp-3'>{previewText}</p>}
            <p className='text-xs text-gray-500'>Last modified {lastModified}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

interface DraftsPagePropsWithData {
  initialDraftsData: RouterOutputs['organization']['listJobPostings']
}

type DraftsPagePropsWithoutData = object

type DraftsPageProps = DraftsPagePropsWithData | DraftsPagePropsWithoutData

function hasData(props: DraftsPageProps): props is DraftsPagePropsWithData {
  return 'initialDraftsData' in props
}

export function DraftsPage(props: DraftsPageProps) {
  const router = useRouter()
  const [isEditMode, setIsEditMode] = useState(false)
  const [selectedJobs, setSelectedJobs] = useState<Set<string>>(new Set())
  const trpcClient = useTRPC()
  const queryClient = useQueryClient()

  // Query parameters for drafts
  const queryInput = {
    status: 'draft' as const,
    page: 1,
    pageSize: 50, // Get more since we're not paginating yet
  }

  const queryOptionsObj = trpcClient.organization.listJobPostings.queryOptions(
    queryInput,
    hasData(props) ? { initialData: props.initialDraftsData } : undefined
  )

  // Fetch draft job postings
  const { data: draftsData, isLoading, error } = useQuery(queryOptionsObj)

  // Delete job posting mutation
  const deleteJobsMutation = useMutation(
    trpcClient.organization.deleteJobPosting.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries(trpcClient.organization.listJobPostings.queryFilter())
        toast.success(`${selectedJobs.size} draft${selectedJobs.size > 1 ? 's' : ''} deleted successfully`)
        setSelectedJobs(new Set())
        setIsEditMode(false)
      },
      onError: (error) => {
        toast.error(`Failed to delete drafts: ${error.message}`)
      },
    })
  )

  const drafts = draftsData?.data || []

  const handleJobSelect = (jobId: string, selected: boolean) => {
    const newSelected = new Set(selectedJobs)
    if (selected) {
      newSelected.add(jobId)
    } else {
      newSelected.delete(jobId)
    }
    setSelectedJobs(newSelected)
  }

  const handleEditModeToggle = () => {
    setIsEditMode(!isEditMode)
    if (isEditMode) {
      setSelectedJobs(new Set())
    }
  }

  const handleDeleteSelected = async () => {
    if (selectedJobs.size === 0) return

    // Delete jobs one by one (could be optimized with batch delete if available)
    for (const jobId of selectedJobs) {
      try {
        await deleteJobsMutation.mutateAsync({ id: jobId })
      } catch (error) {
        // Error handling is done in the mutation onError
        break
      }
    }
  }

  const handleJobClick = (jobId: string) => {
    router.push(`/jobs/create/${jobId}`)
  }

  const handleCreateJob = () => {
    router.push('/jobs/create')
  }

  if (isLoading) {
    return (
      <div className='container mx-auto py-8'>
        <div className='animate-pulse space-y-6'>
          <div className='h-8 bg-gray-200 rounded w-1/3'></div>
          <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className='h-40 bg-gray-200 rounded-lg'></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className='container mx-auto py-8'>
        <div className='text-center'>
          <h1 className='text-2xl font-bold text-red-600 mb-4'>Error Loading Drafts</h1>
          <p className='text-gray-600'>{error.message}</p>
        </div>
      </div>
    )
  }

  return (
    <div className='container mx-auto py-8'>
      {/* Header */}
      <div className='flex items-center justify-between mb-8'>
        <div>
          <h1 className='text-3xl font-bold text-gray-900'>Draft Job Postings</h1>
          <p className='text-gray-600 mt-2'>
            {drafts.length} draft{drafts.length !== 1 ? 's' : ''} ready for editing
          </p>
        </div>
        <div className='flex items-center gap-3'>
          <Button variant='outline' onClick={handleCreateJob} className='flex items-center gap-2'>
            <Plus className='h-4 w-4' />
            Create Job Post
          </Button>
          <Button variant='outline' onClick={handleEditModeToggle} className='flex items-center gap-2'>
            <Edit3 className='h-4 w-4' />
            {isEditMode ? 'Cancel' : 'Edit'}
          </Button>
          {isEditMode && selectedJobs.size > 0 && (
            <Button
              variant='destructive'
              onClick={handleDeleteSelected}
              disabled={deleteJobsMutation.isPending}
              className='flex items-center gap-2'>
              <Trash2 className='h-4 w-4' />
              Delete ({selectedJobs.size})
            </Button>
          )}
        </div>
      </div>

      {/* Draft Grid */}
      {drafts.length === 0 ? (
        <div className='text-center py-12'>
          <div className='max-w-md mx-auto'>
            <div className='mb-4'>
              <Edit3 className='h-12 w-12 text-gray-400 mx-auto' />
            </div>
            <h3 className='text-lg font-semibold text-gray-900 mb-2'>No drafts yet</h3>
            <p className='text-gray-600 mb-6'>Start creating job postings and save them as drafts to see them here.</p>
            <Button onClick={handleCreateJob} className='flex items-center gap-2'>
              <Plus className='h-4 w-4' />
              Create Your First Job Post
            </Button>
          </div>
        </div>
      ) : (
        <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
          {drafts.map((job) => (
            <DraftCard
              key={job.id}
              job={job}
              isEditMode={isEditMode}
              isSelected={selectedJobs.has(job.id)}
              onSelect={handleJobSelect}
              onClick={() => handleJobClick(job.id)}
            />
          ))}
        </div>
      )}
    </div>
  )
}
