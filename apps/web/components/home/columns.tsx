'use client'

import { DataTableColumnHeader } from '@/components/data-table/column-header'
import { Badge } from '@seeds/ui/badge'
import { Button } from '@seeds/ui/button'
import { Checkbox } from '@seeds/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@seeds/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@seeds/ui/dropdown-menu'
import { Interview } from '@/data/interview-data'
import { ColumnDef, Row } from '@tanstack/react-table'
import { Calendar, Mail, MoreHorizontal } from 'lucide-react'
import { useState } from 'react'

export function useInterviewColumns() {
  const [selectedInterview, setSelectedInterview] = useState<Interview | null>(
    null
  )

  const baseColumns: ColumnDef<Interview>[] = [
    {
      id: 'select',
      header: ({ table }) => (
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && 'indeterminate')
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label='Select all'
          className='border border-foreground'
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label='Select row'
          className='border border-foreground'
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: 'candidate',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title='Candidate' />
      ),
      cell: ({ row }) => {
        return <div className='font-medium'>{row.getValue('candidate')}</div>
      },
      enableSorting: true,
      enableHiding: true,
    },
    {
      accessorKey: 'date',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title='Date & Time' />
      ),
      cell: ({ row }) => {
        const date = new Date(row.getValue('date') as string)
        const formattedDate = new Intl.DateTimeFormat('en-US', {
          dateStyle: 'medium',
          timeStyle: 'short',
        }).format(date)

        return (
          <div className='flex items-center'>
            <Calendar className='mr-2 h-4 w-4 text-muted-foreground' />
            <span>{formattedDate}</span>
          </div>
        )
      },
      enableSorting: true,
      enableHiding: true,
    },
  ]

  const desktopColumns: ColumnDef<Interview>[] = [
    {
      accessorKey: 'type',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title='Interview Type' />
      ),
      cell: ({ row }) => {
        const type = row.getValue('type') as string

        return (
          <Badge
            variant='outline'
            className='font-medium dark:shadow-[inset_0px_1px_0px_rgb(255_255_255_/_0.04),_inset_0px_0px_0px_1px_rgb(255_255_255_/_0.02),_0px_1px_2px_rgb(0_0_0_/_0.4),_0px_2px_4px_rgb(0_0_0_/_0.08),_0px_0px_0px_0.5px_rgb(0_0_0_/_0.24)] shadow-[inset_0px_0px_0px_0.5px_rgb(255_255_255_/_0.02),inset_0px_0.5px_0px_rgb(255_255_255_/_0.04),_inset_0px_0px_0px_1px_rgb(255_255_255_/_0.02),_0px_0px_0px_0.5px_rgb(0_0_0_/_0.24) border-none bg-secondary'>
            {type}
          </Badge>
        )
      },
      enableSorting: true,
      enableHiding: true,
    },
    {
      accessorKey: 'role',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title='Your Role' />
      ),
      cell: ({ row }) => {
        return <div>{row.getValue('role')}</div>
      },
      enableSorting: true,
      enableHiding: true,
    },
    {
      accessorKey: 'status',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title='Status' />
      ),
      cell: ({ row }) => {
        const status = row.getValue('status') as string | undefined

        if (!status) return null

        type BadgeVariant =
          | 'default'
          | 'destructive'
          | 'outline'
          | 'secondary'
          | 'success'
          | 'warning'
          | 'info'

        const statusMap: Record<
          string,
          { label: string; variant: BadgeVariant }
        > = {
          scheduled: { label: 'Scheduled', variant: 'info' },
          completed: { label: 'Completed', variant: 'success' },
          canceled: { label: 'Canceled', variant: 'warning' },
          'no-show': { label: 'No Show', variant: 'destructive' },
        }

        const { label, variant } = (status &&
          statusMap[status as keyof typeof statusMap]) || {
          label: status || 'Unknown',
          variant: 'outline',
        }

        return <Badge variant={variant}>{label}</Badge>
      },
      enableSorting: true,
      enableHiding: true,
    },
    {
      id: 'actions',
      cell: ({ row }) => {
        const interview = row.original

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant='ghost' className='h-8 w-8 p-0'>
                <span className='sr-only'>Open menu</span>
                <MoreHorizontal className='h-4 w-4' />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align='end'>
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation()
                  if (interview.candidateEmail) {
                    window.open(`mailto:${interview.candidateEmail}`, '_blank')
                  }
                }}
                disabled={!interview.candidateEmail}>
                <Mail className='mr-2 h-4 w-4' />
                Email candidate
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation()
                  setSelectedInterview(interview)
                }}>
                View details
              </DropdownMenuItem>
              <DropdownMenuItem onClick={(e) => e.stopPropagation()}>
                Reschedule
              </DropdownMenuItem>
              <DropdownMenuItem onClick={(e) => e.stopPropagation()}>
                Cancel interview
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
      enableSorting: false,
      enableHiding: false,
    },
  ]

  const allColumns = [...baseColumns, ...desktopColumns]

  return {
    columns: allColumns,
    dialogComponent: (
      <Dialog
        open={!!selectedInterview}
        onOpenChange={(open) => !open && setSelectedInterview(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Interview Details</DialogTitle>
          </DialogHeader>
          {selectedInterview && (
            <div className='space-y-4'>
              <p>
                <strong>Candidate:</strong> {selectedInterview.candidate}
              </p>
              <p>
                <strong>Type:</strong> {selectedInterview.type}
              </p>
              <p>
                <strong>Date & Time:</strong>{' '}
                <span className='flex items-center'>
                  <Calendar className='mr-2 h-4 w-4 text-muted-foreground' />
                  {new Intl.DateTimeFormat('en-US', {
                    dateStyle: 'medium',
                    timeStyle: 'short',
                  }).format(new Date(selectedInterview.date))}
                </span>
              </p>
              <p>
                <strong>Your Role:</strong> {selectedInterview.role}
              </p>
              <p>
                <strong>Status:</strong>{' '}
                {(() => {
                  const status = selectedInterview.status

                  type BadgeVariant =
                    | 'default'
                    | 'secondary'
                    | 'destructive'
                    | 'outline'
                    | 'success'
                    | 'warning'

                  const statusMap: Record<
                    string,
                    { label: string; variant: BadgeVariant }
                  > = {
                    scheduled: { label: 'Scheduled', variant: 'secondary' },
                    completed: { label: 'Completed', variant: 'success' },
                    canceled: { label: 'Canceled', variant: 'warning' },
                    'no-show': { label: 'No Show', variant: 'destructive' },
                  }

                  const { label, variant } = (status &&
                    statusMap[status as keyof typeof statusMap]) || {
                    label: status || 'Unknown',
                    variant: 'outline',
                  }

                  return <Badge variant={variant}>{label}</Badge>
                })()}
              </p>
              {selectedInterview.candidateEmail && (
                <p>
                  <strong>Email:</strong> {selectedInterview.candidateEmail}
                </p>
              )}
              <div className='flex justify-end'>
                <Button
                  onClick={() => setSelectedInterview(null)}
                  variant='outline'>
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    ),
    handleRowClick: (row: Row<Interview>) => {
      const interview = row.original
      if (window.innerWidth < 768) {
        setSelectedInterview(interview)
      }
    },
  }
}
