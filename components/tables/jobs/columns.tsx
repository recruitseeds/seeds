'use client'

import type { JobPost } from '@/data/jobs-posts'
import type { ColumnDef } from '@tanstack/react-table'
import { MoreHorizontal } from 'lucide-react'
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
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

import { DataTableColumnHeader } from '@/components/data-table/column-header'

// Create a cell component for actions that manages its own state
function ActionsCell({ job, onDelete }: { job: JobPost; onDelete?: (id: string) => void }) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    setIsDeleting(true)

    try {
      // Call the delete handler passed from parent
      if (onDelete) {
        await onDelete(job.id)
      } else {
        // Fallback to console.log if no handler provided
        console.log(`Deleting job: ${job.id}`)
        // Simulate API delay
        await new Promise((resolve) => setTimeout(resolve, 500))
      }

      // Close the dialog after successful deletion
      setShowDeleteDialog(false)
    } catch (error) {
      console.error('Failed to delete job:', error)
      // Handle error - you might want to show a toast notification here
    } finally {
      setIsDeleting(false)
    }
  }

  const handleMenuItemClick = (e: React.MouseEvent, action: () => void) => {
    e.preventDefault()
    e.stopPropagation()
    action()
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant='ghost'
            className='h-8 w-8 p-0'
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
            }}>
            <span className='sr-only'>Open menu</span>
            <MoreHorizontal className='h-4 w-4' />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align='end' onClick={(e) => e.stopPropagation()}>
          <DropdownMenuLabel>Actions</DropdownMenuLabel>
          <DropdownMenuItem onClick={(e) => handleMenuItemClick(e, () => console.log(`Edit job: ${job.id}`))}>
            Edit Job
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={(e) => handleMenuItemClick(e, () => console.log(`View applicants for job: ${job.id}`))}>
            View Applicants
          </DropdownMenuItem>
          <DropdownMenuItem onClick={(e) => handleMenuItemClick(e, () => console.log(`Close job: ${job.id}`))}>
            Close Job
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={(e) => handleMenuItemClick(e, () => console.log(`Duplicate job: ${job.id}`))}>
            Duplicate Job
          </DropdownMenuItem>
          <DropdownMenuItem onClick={(e) => handleMenuItemClick(e, () => console.log(`Share job: ${job.id}`))}>
            Share Job
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className='text-destructive focus:text-destructive'
            onClick={(e) => handleMenuItemClick(e, () => setShowDeleteDialog(true))}>
            Delete Job
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent onClick={(e) => e.stopPropagation()}>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the job posting "{job.title}".
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={isDeleting}>
              {isDeleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

export const columns: ColumnDef<JobPost>[] = [
  {
    id: 'select',
    header: ({ table }) => (
      <Checkbox
        checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && 'indeterminate')}
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label='Select all'
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label='Select row'
        onClick={(e) => e.stopPropagation()}
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: 'title',
    header: ({ column }) => <DataTableColumnHeader column={column} title='Job Title' />,
    enableSorting: true,
    enableHiding: true,
  },
  {
    accessorKey: 'department',
    header: ({ column }) => <DataTableColumnHeader column={column} title='Department' />,
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
        return <span className='status-badge unknown'>Unknown</span>
      }

      return <span className={`status-badge ${status.toLowerCase()}`}>{status}</span>
    },
    enableSorting: true,
    meta: {
      className: 'w-[100px]',
    },
  },
  {
    accessorKey: 'datePosted',
    header: ({ column }) => <DataTableColumnHeader column={column} title='Date Posted' />,
    enableSorting: true,
    enableHiding: true,
  },
  {
    accessorKey: 'applicants',
    header: ({ column }) => <DataTableColumnHeader column={column} title='Applicants' />,
    cell: ({ row }) => {
      const applicants = row.getValue('applicants') as number
      return <div>{applicants}</div>
    },
    enableSorting: true,
    enableHiding: true,
  },
  {
    accessorKey: 'hiringManager',
    header: ({ column }) => <DataTableColumnHeader column={column} title='Hiring Manager' />,
    enableSorting: true,
    enableHiding: true,
  },
  {
    id: 'actions',
    cell: ({ row, table }) => {
      // Get the onDelete handler from table meta if available
      const onDelete = (table.options.meta as any)?.onDelete
      return <ActionsCell job={row.original} onDelete={onDelete} />
    },
    enableSorting: false,
    enableHiding: false,
  },
]
