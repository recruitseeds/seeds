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

// Type for job posting data - matches your actual database structure
export type JobPost = {
  id: string
  title: string
  department: string | null
  job_type: 'full_time' | 'part_time' | 'contract' | 'internship' | 'temporary'
  status: 'draft' | 'published' | 'archived' | 'closed'
  created_at: string
  experience_level: 'entry' | 'mid' | 'senior' | 'lead' | 'executive' | null
  hiring_manager_id: string | null
  salary_min: number | null
  salary_max: number | null
}

export const columns: ColumnDef<JobPost>[] = [
  {
    id: 'select',
    header: ({ table }) => (
      <div className='flex items-center justify-center w-12'>
        <Checkbox
          checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && 'indeterminate')}
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label='Select all'
        />
      </div>
    ),
    cell: ({ row }) => (
      <div className='flex items-center justify-center w-12'>
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label='Select row'
          onClick={(e) => e.stopPropagation()} // Prevent row click when clicking checkbox
        />
      </div>
    ),
    enableSorting: false,
    enableHiding: false,
    meta: {
      className: 'w-12 px-3', // Fixed width and centered padding for checkbox column
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
    accessorKey: 'job_type',
    header: ({ column }) => (
      <Button
        variant='ghost'
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        className='h-8 px-2 lg:px-3 hover:bg-muted'>
        Job Type
        <ArrowUpDown className='ml-2 h-4 w-4' />
      </Button>
    ),
    cell: ({ row }) => {
      const jobType = row.getValue('job_type') as string
      const formatted = jobType?.replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase()) || 'Not specified'
      return <div className='capitalize'>{formatted}</div>
    },
    enableSorting: true,
    enableHiding: true,
    meta: {
      className: 'min-w-[120px]',
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
    accessorKey: 'created_at',
    header: ({ column }) => (
      <Button
        variant='ghost'
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        className='h-8 px-2 lg:px-3 hover:bg-muted'>
        Date Created
        <ArrowUpDown className='ml-2 h-4 w-4' />
      </Button>
    ),
    cell: ({ row }) => {
      const date = new Date(row.getValue('created_at'))
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
    accessorKey: 'experience_level',
    header: ({ column }) => (
      <Button
        variant='ghost'
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        className='h-8 px-2 lg:px-3 hover:bg-muted'>
        Experience
        <ArrowUpDown className='ml-2 h-4 w-4' />
      </Button>
    ),
    cell: ({ row }) => {
      const level = row.getValue('experience_level') as string
      return <div className='capitalize'>{level || 'Not specified'}</div>
    },
    enableSorting: true,
    enableHiding: true,
    meta: {
      className: 'w-[100px]',
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
