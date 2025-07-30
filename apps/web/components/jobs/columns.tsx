'use client'

import type { JobPost } from '@/data/jobs-posts'
import type { ColumnDef } from '@tanstack/react-table'
import { MoreHorizontal } from 'lucide-react'

import { Button } from '@seeds/ui/button'
import { Checkbox } from '@seeds/ui/checkbox'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@seeds/ui/dropdown-menu'

import { DataTableColumnHeader } from '@/components/data-table/column-header'

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

      // Check if status exists before trying to use toLowerCase()
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
    cell: ({ row }) => {
      const job = row.original

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
              onClick={() => console.log(`Edit job: ${job.id}`)} // Placeholder for Edit Job action
            >
              Edit Job
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => console.log(`View applicants for job: ${job.id}`)} // Placeholder for View Applicants action
            >
              View Applicants
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => console.log(`Close job: ${job.id}`)} // Placeholder for Close Job action
            >
              Close Job
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => console.log(`Duplicate job: ${job.id}`)} // Placeholder for Duplicate Job action
            >
              Duplicate Job
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => console.log(`Share job: ${job.id}`)} // Placeholder for Share Job action
            >
              Share Job
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant='destructive' onClick={() => console.log(`Delete job: ${job.id}`)}>
              Delete Job
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
    enableSorting: false,
    enableHiding: false,
  },
]
