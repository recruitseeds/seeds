'use client'

import { DataTableColumnHeader } from '@/components/data-table/column-header'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Interview } from '@/data/interview-data'
import { ColumnDef, Row } from '@tanstack/react-table'
import { Calendar, Mail, MoreHorizontal } from 'lucide-react'
import { useState } from 'react'

export function useInterviewColumns() {
  // Shared state for the selected interview
  const [selectedInterview, setSelectedInterview] = useState<Interview | null>(
    null
  )

  // Base columns - always visible
  const baseColumns: ColumnDef<Interview>[] = [
    {
      id: 'select',
      header: ({ table }) => (
        <div className='hidden md:block'>
          <Checkbox
            checked={
              table.getIsAllPageRowsSelected() ||
              (table.getIsSomePageRowsSelected() && 'indeterminate')
            }
            onCheckedChange={(value) =>
              table.toggleAllPageRowsSelected(!!value)
            }
            aria-label='Select all'
          />
        </div>
      ),
      cell: ({ row }) => (
        <div className='hidden md:block'>
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(value) => row.toggleSelected(!!value)}
            aria-label='Select row'
          />
        </div>
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
          <Badge variant='outline' className='font-medium'>
            {type}
          </Badge>
        )
      },
      enableSorting: true,
      enableHiding: true,
      meta: {
        className: 'hidden md:table-cell',
      },
    },
    {
      accessorKey: 'role',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title='Your Role' />
      ),
      cell: ({ row }) => {
        return <div className='hidden md:block'>{row.getValue('role')}</div>
      },
      enableSorting: true,
      enableHiding: true,
      meta: {
        className: 'hidden md:table-cell',
      },
    },
    {
      accessorKey: 'status',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title='Status' />
      ),
      cell: ({ row }) => {
        const status = row.getValue('status') as string | undefined

        if (!status) return null

        const statusMap: Record<
          string,
          {
            label: string
            variant:
              | 'default'
              | 'destructive'
              | 'outline'
              | 'secondary'
              | 'success'
              | 'warning'
          }
        > = {
          scheduled: { label: 'Scheduled', variant: 'secondary' },
          completed: { label: 'Completed', variant: 'success' },
          canceled: { label: 'Canceled', variant: 'warning' },
          'no-show': { label: 'No Show', variant: 'destructive' },
        }

        const { label, variant } = statusMap[status] || {
          label: status,
          variant: 'outline',
        }

        return (
          <div>
            <Badge variant={variant}>{label}</Badge>
          </div>
        )
      },
      enableSorting: true,
      enableHiding: true,
    },
    {
      id: 'actions',
      cell: ({ row }) => {
        const interview = row.original

        return (
          <div className='hidden md:block'>
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
                      window.open(
                        `mailto:${interview.candidateEmail}`,
                        '_blank'
                      )
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
          </div>
        )
      },
      enableSorting: false,
      enableHiding: false,
      meta: {
        className: 'hidden md:table-cell',
      },
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

                  // Define the valid variant types
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

                  const defaultValue = {
                    label: status || 'Unknown',
                    variant: 'outline' as BadgeVariant,
                  }

                  const { label, variant } =
                    (status && statusMap[status as keyof typeof statusMap]) ||
                    defaultValue

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
