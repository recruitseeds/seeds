'use client'

import type { JobPost } from '@/data/jobs-posts'
import type { ColumnDef } from '@tanstack/react-table'
import { Check, Copy, ExternalLink, Facebook, Linkedin, Loader2, MoreHorizontal, Twitter } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'

import { DataTableColumnHeader } from '@/components/data-table/column-header'

// Create a cell component for actions that manages its own state
function ActionsCell({
  job,
  onDelete,
  onClose,
  onDuplicate,
}: {
  job: JobPost
  onDelete?: (id: string) => void
  onClose?: (id: string) => void
  onDuplicate?: (job: JobPost) => void
}) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showShareDialog, setShowShareDialog] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isClosing, setIsClosing] = useState(false)
  const [isDuplicating, setIsDuplicating] = useState(false)
  const [copySuccess, setCopySuccess] = useState(false)

  const router = useRouter()

  // Generate the job share URL (client-side only)
  const getJobUrl = () => {
    if (typeof window !== 'undefined') {
      return `${window.location.origin}/jobs/public/${job.id}`
    }
    return `https://yoursite.com/jobs/public/${job.id}` // fallback
  }

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    setIsDeleting(true)

    try {
      if (onDelete) {
        await onDelete(job.id)
      } else {
        console.log(`Deleting job: ${job.id}`)
        await new Promise((resolve) => setTimeout(resolve, 500))
      }
      setShowDeleteDialog(false)
    } catch (error) {
      console.error('Failed to delete job:', error)
    } finally {
      setIsDeleting(false)
    }
  }

  const handleClose = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    setIsClosing(true)

    try {
      if (onClose) {
        await onClose(job.id)
      } else {
        console.log(`Closing job: ${job.id}`)
        await new Promise((resolve) => setTimeout(resolve, 500))
      }
    } catch (error) {
      console.error('Failed to close job:', error)
    } finally {
      setIsClosing(false)
    }
  }

  const handleDuplicate = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    setIsDuplicating(true)

    try {
      if (onDuplicate) {
        await onDuplicate(job)
      } else {
        console.log(`Duplicating job: ${job.id}`)
        await new Promise((resolve) => setTimeout(resolve, 500))
      }
    } catch (error) {
      console.error('Failed to duplicate job:', error)
    } finally {
      setIsDuplicating(false)
    }
  }

  const handleEdit = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    router.push(`/jobs/create/${job.id}`)
  }

  const handleCopyLink = async () => {
    try {
      const jobUrl = getJobUrl()
      await navigator.clipboard.writeText(jobUrl)
      setCopySuccess(true)
      setTimeout(() => setCopySuccess(false), 2000)
    } catch (err) {
      console.error('Failed to copy link:', err)
    }
  }

  const handleSocialShare = (platform: string) => {
    const jobUrl = getJobUrl()
    const title = `${job.title} at ${job.company || 'Our Company'}`
    const text = `Check out this job opportunity: ${title}`

    const urls = {
      twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(jobUrl)}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(jobUrl)}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(jobUrl)}`,
    }

    window.open(urls[platform as keyof typeof urls], '_blank', 'width=600,height=400')
  }

  const handleMenuItemClick = (e: React.MouseEvent, action: () => void) => {
    e.preventDefault()
    e.stopPropagation()
    action()
  }

  return (
    <>
      <div className='flex justify-end'>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant='ghost' className='h-8 w-8 p-0' onClick={(e) => e.stopPropagation()}>
              <span className='sr-only'>Open menu</span>
              <MoreHorizontal className='h-4 w-4' />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align='end'>
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem onClick={(e) => handleMenuItemClick(e, handleEdit)}>Edit Job</DropdownMenuItem>
            <DropdownMenuItem
              onClick={(e) => handleMenuItemClick(e, () => console.log(`View applicants for job: ${job.id}`))}>
              View Applicants
            </DropdownMenuItem>
            <DropdownMenuItem onClick={(e) => handleMenuItemClick(e, handleClose)} disabled={isClosing}>
              {isClosing && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
              Close Job
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={(e) => handleMenuItemClick(e, handleDuplicate)} disabled={isDuplicating}>
              {isDuplicating && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
              Duplicate Job
            </DropdownMenuItem>
            <DropdownMenuItem onClick={(e) => handleMenuItemClick(e, () => setShowShareDialog(true))}>
              Share Job
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className='text-destructive'
              onClick={(e) => handleMenuItemClick(e, () => setShowDeleteDialog(true))}>
              Delete Job
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the job posting "{job.title}" and all
              associated applications.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className='bg-destructive text-destructive-foreground hover:bg-destructive/90'>
              {isDeleting && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
              Delete Job
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={showShareDialog} onOpenChange={setShowShareDialog}>
        <DialogContent className='sm:max-w-md'>
          <DialogHeader>
            <DialogTitle>Share Job Posting</DialogTitle>
            <DialogDescription>Share this job posting with others to help find the right candidate.</DialogDescription>
          </DialogHeader>

          <div className='space-y-4'>
            {/* Job Info */}
            <div className='rounded-lg border p-4 space-y-2'>
              <h4 className='font-semibold'>{job.title}</h4>
              <p className='text-sm text-muted-foreground'>
                {job.company || 'Our Company'} • {job.location}
              </p>
              {job.salary && <p className='text-sm font-medium'>{job.salary}</p>}
            </div>

            {/* Copy Link */}
            <div className='space-y-2'>
              <label className='text-sm font-medium'>Job Link</label>
              <div className='flex gap-2'>
                <Input value={getJobUrl()} readOnly className='flex-1' />
                <Button variant='outline' size='sm' onClick={handleCopyLink} className='shrink-0'>
                  {copySuccess ? <Check className='h-4 w-4' /> : <Copy className='h-4 w-4' />}
                </Button>
              </div>
              {copySuccess && <p className='text-xs text-green-600'>Link copied to clipboard!</p>}
            </div>

            {/* Social Share Buttons */}
            <div className='space-y-2'>
              <label className='text-sm font-medium'>Share on Social Media</label>
              <div className='flex gap-2'>
                <Button variant='outline' size='sm' onClick={() => handleSocialShare('twitter')} className='flex-1'>
                  <Twitter className='h-4 w-4 mr-2' />
                  Twitter
                </Button>
                <Button variant='outline' size='sm' onClick={() => handleSocialShare('linkedin')} className='flex-1'>
                  <Linkedin className='h-4 w-4 mr-2' />
                  LinkedIn
                </Button>
                <Button variant='outline' size='sm' onClick={() => handleSocialShare('facebook')} className='flex-1'>
                  <Facebook className='h-4 w-4 mr-2' />
                  Facebook
                </Button>
              </div>
            </div>

            {/* View Public Page */}
            <div className='pt-2'>
              <Button variant='outline' onClick={() => window.open(getJobUrl(), '_blank')} className='w-full'>
                <ExternalLink className='h-4 w-4 mr-2' />
                View Public Job Page
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

export const columns: ColumnDef<JobPost>[] = [
  {
    id: 'select',
    header: ({ table }) => (
      <div className='flex items-center justify-center'>
        <Checkbox
          checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && 'indeterminate')}
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label='Select all'
        />
      </div>
    ),
    cell: ({ row }) => (
      <div className='flex items-center justify-center'>
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label='Select row'
          onClick={(e) => e.stopPropagation()}
        />
      </div>
    ),
    enableSorting: false,
    enableHiding: false,
    meta: {
      className: 'w-[50px]',
    },
  },
  {
    accessorKey: 'title',
    header: ({ column }) => <DataTableColumnHeader column={column} title='Job Title' />,
    cell: ({ row }) => {
      const job = row.original
      return (
        <div className='space-y-1'>
          <div className='font-medium'>{job.title}</div>
          <div className='text-sm text-muted-foreground'>{job.department}</div>
        </div>
      )
    },
    enableSorting: true,
    enableHiding: true,
  },
  {
    accessorKey: 'location',
    header: ({ column }) => <DataTableColumnHeader column={column} title='Location' />,
    enableSorting: true,
    enableHiding: true,
  },
  {
    accessorKey: 'status',
    header: ({ column }) => <DataTableColumnHeader column={column} title='Status' />,
    cell: ({ row }) => {
      const status = row.getValue('status') as string | undefined

      if (!status) {
        return <Badge variant='secondary'>Unknown</Badge>
      }

      const statusConfig = {
        draft: { label: 'Draft', variant: 'secondary' },
        published: { label: 'Published', variant: 'default' },
        archived: { label: 'Archived', variant: 'warning' },
        closed: { label: 'Closed', variant: 'destructive' },
      } as const

      const config = statusConfig[status.toLowerCase() as keyof typeof statusConfig] || {
        label: status,
        variant: 'secondary',
      }

      return <Badge variant={config.variant}>{config.label}</Badge>
    },
    enableSorting: true,
    meta: {
      className: 'w-[120px]',
    },
  },
  {
    accessorKey: 'datePosted',
    header: ({ column }) => <DataTableColumnHeader column={column} title='Date Posted' />,
    cell: ({ row }) => {
      const date = row.getValue('datePosted') as string
      return <div className='text-sm'>{new Date(date).toLocaleDateString()}</div>
    },
    enableSorting: true,
    enableHiding: true,
    meta: {
      className: 'w-[120px]',
    },
  },
  {
    accessorKey: 'applicants',
    header: ({ column }) => <DataTableColumnHeader column={column} title='Applicants' />,
    cell: ({ row }) => {
      const applicants = row.getValue('applicants') as number
      return <div className='text-center font-medium'>{applicants}</div>
    },
    enableSorting: true,
    enableHiding: true,
    meta: {
      className: 'w-[100px]',
    },
  },
  {
    accessorKey: 'hiringManager',
    header: ({ column }) => <DataTableColumnHeader column={column} title='Hiring Manager' />,
    cell: ({ row }) => {
      const manager = row.getValue('hiringManager') as string
      return <div className='text-sm'>{manager}</div>
    },
    enableSorting: true,
    enableHiding: true,
  },
  {
    id: 'actions',
    header: () => <div className='text-right'>Actions</div>,
    cell: ({ row }) => <ActionsCell job={row.original} />,
    enableSorting: false,
    enableHiding: false,
    meta: {
      className: 'w-[100px]',
    },
  },
]
