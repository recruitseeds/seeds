'use client'

import type { ColumnDef } from '@tanstack/react-table'
import { ArrowUpDown, MoreHorizontal } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
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

// Type for job posting data
export type JobPost = {
  id: string
  title: string
  department: string
  location: string
  status: 'draft' | 'published' | 'archived' | 'closed'
  datePosted: string
  applicants: number
  hiringManager: string
}

export const columns: ColumnDef<JobPost>[] = [
  {
    id: 'select',
    header: ({ table }) => (
      <div className='flex items-center justify-center w-10'>
        <Checkbox
          checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && 'indeterminate')}
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label='Select all'
          className='mx-auto'
        />
      </div>
    ),
    cell: ({ row }) => (
      <div className='flex items-center justify-center w-10'>
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label='Select row'
          className='mx-auto'
          onClick={(e) => e.stopPropagation()} // Prevent row click when clicking checkbox
        />
      </div>
    ),
    enableSorting: false,
    enableHiding: false,
    meta: {
      className: 'w-10 px-2', // Fixed width and proper padding for checkbox column
    },
  },
  {
    accessorKey: 'title',
    header: ({ column }) => (
      <Button
        variant='ghost'
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        className='h-8 px-2 lg:px-3 hover:bg-muted'>
        Job Title
        <ArrowUpDown className='ml-2 h-4 w-4' />
      </Button>
    ),
    cell: ({ row }) => <div className='font-medium'>{row.getValue('title')}</div>,
    enableSorting: true,
    enableHiding: true,
    meta: {
      className: 'min-w-[200px]', // Ensure title has enough space
    },
  },
  {
    accessorKey: 'department',
    header: ({ column }) => (
      <Button
        variant='ghost'
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        className='h-8 px-2 lg:px-3 hover:bg-muted'>
        Department
        <ArrowUpDown className='ml-2 h-4 w-4' />
      </Button>
    ),
    cell: ({ row }) => <div className='capitalize'>{row.getValue('department')}</div>,
    enableSorting: true,
    enableHiding: true,
    meta: {
      className: 'min-w-[120px]',
    },
  },
  {
    accessorKey: 'location',
    header: ({ column }) => (
      <Button
        variant='ghost'
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        className='h-8 px-2 lg:px-3 hover:bg-muted'>
        Location
        <ArrowUpDown className='ml-2 h-4 w-4' />
      </Button>
    ),
    cell: ({ row }) => <div>{row.getValue('location')}</div>,
    enableSorting: true,
    enableHiding: true,
    meta: {
      className: 'min-w-[150px]',
    },
  },
  {
    accessorKey: 'status',
    header: ({ column }) => (
      <Button
        variant='ghost'
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        className='h-8 px-2 lg:px-3 hover:bg-muted'>
        Status
        <ArrowUpDown className='ml-2 h-4 w-4' />
      </Button>
    ),
    cell: ({ row }) => {
      const status = row.getValue('status') as string

      const statusConfig = {
        draft: { variant: 'secondary' as const, label: 'Draft' },
        published: { variant: 'default' as const, label: 'Published' },
        archived: { variant: 'outline' as const, label: 'Archived' },
        closed: { variant: 'destructive' as const, label: 'Closed' },
      }

      const config = statusConfig[status as keyof typeof statusConfig] || {
        variant: 'secondary' as const,
        label: status,
      }

      return (
        <Badge variant={config.variant} className='capitalize'>
          {config.label}
        </Badge>
      )
    },
    enableSorting: true,
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id))
    },
    meta: {
      className: 'w-[100px]',
    },
  },
  {
    accessorKey: 'datePosted',
    header: ({ column }) => (
      <Button
        variant='ghost'
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        className='h-8 px-2 lg:px-3 hover:bg-muted'>
        Date Posted
        <ArrowUpDown className='ml-2 h-4 w-4' />
      </Button>
    ),
    cell: ({ row }) => {
      const date = new Date(row.getValue('datePosted'))
      return (
        <div className='text-sm'>
          {date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          })}
        </div>
      )
    },
    enableSorting: true,
    enableHiding: true,
    meta: {
      className: 'w-[120px]',
    },
  },
  {
    accessorKey: 'applicants',
    header: ({ column }) => (
      <Button
        variant='ghost'
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        className='h-8 px-2 lg:px-3 hover:bg-muted'>
        Applicants
        <ArrowUpDown className='ml-2 h-4 w-4' />
      </Button>
    ),
    cell: ({ row }) => {
      const count = row.getValue('applicants') as number
      return <div className='text-center font-medium'>{count}</div>
    },
    enableSorting: true,
    enableHiding: true,
    meta: {
      className: 'w-[100px] text-center',
    },
  },
  {
    accessorKey: 'hiringManager',
    header: ({ column }) => (
      <Button
        variant='ghost'
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        className='h-8 px-2 lg:px-3 hover:bg-muted'>
        Hiring Manager
        <ArrowUpDown className='ml-2 h-4 w-4' />
      </Button>
    ),
    cell: ({ row }) => <div>{row.getValue('hiringManager')}</div>,
    enableSorting: true,
    enableHiding: true,
    meta: {
      className: 'min-w-[150px]',
    },
  },
  {
    id: 'actions',
    header: () => <div className='text-center'>Actions</div>,
    cell: ({ row }) => {
      const job = row.original

      return (
        <div className='flex justify-center'>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant='ghost'
                className='h-8 w-8 p-0'
                onClick={(e) => e.stopPropagation()} // Prevent row click
              >
                <span className='sr-only'>Open menu</span>
                <MoreHorizontal className='h-4 w-4' />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align='end'>
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation()
                  console.log(`Edit job: ${job.id}`)
                }}>
                Edit Job
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation()
                  console.log(`View applicants for job: ${job.id}`)
                }}>
                View Applicants
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation()
                  console.log(`View job posting: ${job.id}`)
                }}>
                View Posting
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation()
                  console.log(`Duplicate job: ${job.id}`)
                }}>
                Duplicate Job
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation()
                  console.log(`Archive job: ${job.id}`)
                }}>
                Archive Job
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className='text-destructive'
                onClick={(e) => {
                  e.stopPropagation()
                  console.log(`Delete job: ${job.id}`)
                }}>
                Delete Job
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )
    },
    enableSorting: false,
    enableHiding: false,
    meta: {
      className: 'w-[70px]',
    },
  },
]
