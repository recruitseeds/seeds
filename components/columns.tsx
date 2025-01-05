'use client'

import { ColumnDef } from '@tanstack/react-table'
import { MoreHorizontal } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

export type Candidate = {
  id: string
  name: string
  email: string
  position: string
  status: 'Screening' | 'Phone Screen' | 'Interview' | 'Offer'
  dateApplied: string
  lastActivity: string
  owner: string
}

export const columns: ColumnDef<Candidate>[] = [
  {
    accessorKey: 'name',
    header: 'Name',
  },
  {
    accessorKey: 'position',
    header: 'Position Applied',
  },
  {
    accessorKey: 'status',
    header: 'Stage',
  },
  {
    accessorKey: 'dateApplied',
    header: 'Date Applied',
    cell: ({ row }) => {
      return new Date(row.getValue('dateApplied')).toLocaleDateString()
    },
  },
  {
    accessorKey: 'lastActivity',
    header: 'Last Activity',
    cell: ({ row }) => {
      return new Date(row.getValue('lastActivity')).toLocaleDateString()
    },
  },
  {
    accessorKey: 'owner',
    header: 'Recruiter',
  },
  {
    id: 'actions',
    cell: ({ row }) => {
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant='ghost' className='h-8 w-8 p-0'>
              <MoreHorizontal className='h-4 w-4' />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>View Profile</DropdownMenuItem>
            <DropdownMenuItem>Schedule Interview</DropdownMenuItem>
            <DropdownMenuItem>Send Email</DropdownMenuItem>
            <DropdownMenuItem>Move to Next Stage</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  },
]
