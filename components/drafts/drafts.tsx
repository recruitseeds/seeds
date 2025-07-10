'use client'

import { Container } from '@/components/container'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import type { Json } from '@/supabase/types/db'
import { useTRPC } from '@/trpc/client'
import type { RouterOutputs } from '@/trpc/routers/_app'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Edit3, PenOff, Plus, Trash2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { toast } from 'sonner'

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

const extractPreviewText = (content: Json): string => {
  if (!content || typeof content !== 'object' || !('content' in content)) return ''

  const contentArray = content.content
  if (!Array.isArray(contentArray)) return ''

  for (const node of contentArray) {
    if (typeof node === 'object' && node && 'type' in node && node.type === 'paragraph' && 'content' in node) {
      const nodeContent = node.content
      if (Array.isArray(nodeContent)) {
        for (const textNode of nodeContent) {
          if (
            typeof textNode === 'object' &&
            textNode &&
            'type' in textNode &&
            textNode.type === 'text' &&
            'text' in textNode
          ) {
            const text = typeof textNode.text === 'string' ? textNode.text.trim() : ''
            if (text) {
              return text.length > 100 ? `${text.substring(0, 100)}...` : text
            }
          }
        }
      }
    }
  }
  return ''
}

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
  content: Json
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
    <div className='relative p-2'>
      <div className='absolute top-0 right-0 z-10 w-5 h-5'>
        {isEditMode && (
          <div className='w-full h-full flex items-center justify-center'>
            <Checkbox
              checked={isSelected}
              onCheckedChange={(checked) => onSelect(job.id, !!checked)}
              className='size-4 border bg-background dark:bg-foreground'
            />
          </div>
        )}
      </div>
      <Card
        className={`cursor-pointer ${isSelected ? 'border-primary/20 !bg-secondary/50' : ''} gap-0 bg-card h-full`}
        onClick={handleCardClick}>
        <CardHeader className='pb-3'>
          <div className='space-y-2'>
            <h3 className='font-semibold text-lg leading-tight line-clamp-2 min-h-[3.5rem] flex items-start'>
              {displayTitle}
            </h3>
            <div className='flex flex-wrap gap-2 min-h-[1.5rem]'>
              <Badge variant='outline'>{jobType}</Badge>
              {department && <Badge variant='outline'>{department}</Badge>}
            </div>
          </div>
        </CardHeader>
        <CardContent className='pt-0 flex-1 flex flex-col justify-end'>
          <div className=''>
            <p className='text-xs text-gray-500 min-h-[1rem] line-clamp-1'>Last modified {lastModified}</p>
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

  const queryInput = {
    status: 'draft' as const,
    page: 1,
    pageSize: 50,
  }

  const queryOptionsObj = trpcClient.organization.listJobPostings.queryOptions(
    queryInput,
    hasData(props) ? { initialData: props.initialDraftsData } : undefined
  )

  const { data: draftsData, isLoading, error } = useQuery(queryOptionsObj)

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

  const handleSelectAll = () => {
    if (selectedJobs.size === drafts.length) {
      setSelectedJobs(new Set())
    } else {
      setSelectedJobs(new Set(drafts.map((job) => job.id)))
    }
  }

  const handleDeleteSelected = async () => {
    if (selectedJobs.size === 0) return

    for (const jobId of selectedJobs) {
      try {
        await deleteJobsMutation.mutateAsync({ id: jobId })
      } catch (error) {
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

  const isAllSelected = selectedJobs.size === drafts.length && drafts.length > 0
  const isSomeSelected = selectedJobs.size > 0 && selectedJobs.size < drafts.length

  if (isLoading) {
    return (
      <div className='container mx-auto py-8'>
        <div className='animate-pulse space-y-6'>
          <div className='h-8 bg-gray-200 rounded w-1/3' />
          <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
            {Array.from({ length: 8 }, (_, i) => `skeleton-${crypto.randomUUID()}`).map((key) => (
              <div key={key} className='h-40 bg-gray-200 rounded-lg' />
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
    <Container>
      <div className='container mx-auto py-8'>
        <div className='mb-4'>
          <div className='flex justify-end'>
            <div className='flex items-center gap-2'>
              {isEditMode && selectedJobs.size > 0 && (
                <Button
                  variant='destructive'
                  size='sm'
                  onClick={handleDeleteSelected}
                  disabled={deleteJobsMutation.isPending}
                  className='flex items-center gap-2 p-2 lg:px-3'>
                  <Trash2 className='h-4 w-4' />
                  <span className='hidden lg:inline'>Delete ({selectedJobs.size})</span>
                </Button>
              )}
              <Button
                variant='outline'
                size='sm'
                onClick={handleEditModeToggle}
                disabled={drafts.length === 0}
                className='flex items-center gap-2 p-2 lg:px-3'>
                {isEditMode ? (
                  <>
                    <PenOff className='h-4 w-4' />
                    <span className='hidden lg:inline'>Cancel</span>
                  </>
                ) : (
                  <>
                    <Edit3 className='h-4 w-4' />
                    <span className='hidden lg:inline'>Edit</span>
                  </>
                )}
              </Button>
              <Button
                variant='brand'
                size='sm'
                onClick={handleCreateJob}
                className='flex items-center gap-2 p-2 lg:px-3'>
                <Plus className='h-4 w-4' />
                <span className='hidden lg:inline'>Create Job Post</span>
              </Button>
            </div>
          </div>
        </div>

        <div className='mb-4 h-10'>
          {isEditMode && drafts.length > 0 && (
            <div className='flex items-center gap-3 justify-end h-full'>
              {selectedJobs.size > 0 && (
                <span className='text-sm text-muted-foreground'>
                  {selectedJobs.size} of {drafts.length} selected
                </span>
              )}
              <Button variant='outline' size='sm' onClick={handleSelectAll} className='text-sm font-medium'>
                {isAllSelected ? 'Deselect All' : 'Select All'}
              </Button>
            </div>
          )}
        </div>

        {drafts.length === 0 ? null : (
          <div className='grid grid-cols-2 lg:grid-cols-4 gap-4'>
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
    </Container>
  )
}
