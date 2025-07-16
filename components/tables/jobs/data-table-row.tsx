'use client'

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { TableCell, TableRow } from '@/components/ui/table'
import { useJobParams } from '@/hooks/use-job-params'
import { formatAmount } from '@/lib/format'
import type { AppRouter } from '@/trpc/routers/_app'
import type { inferRouterOutputs } from '@trpc/server'
import { formatDistanceToNow } from 'date-fns'
import { MoreHorizontal } from 'lucide-react'
import Link from 'next/link'

type DataTableCellProps = {
  children: React.ReactNode
  className?: string
  onClick?: () => void
}

export function DataTableCell({ children, className, onClick }: DataTableCellProps) {
  return (
    <TableCell className={className} onClick={onClick}>
      {children}
    </TableCell>
  )
}

type RowProps = {
  children: React.ReactNode
}

export function Row({ children }: RowProps) {
  return <TableRow className='group h-[45px] hover:bg-[#F2F1EF] hover:dark:bg-secondary'>{children}</TableRow>
}

type RouterOutputs = inferRouterOutputs<AppRouter>
type JobPostingRow = RouterOutputs['organization']['getJobPostings']['data'][number]

type JobTableRowProps = {
  row: JobPostingRow
  onDelete: ({ id }: { id: string }) => void
  isSelected?: boolean
  onSelect?: (selected: boolean) => void
}

const statusColors = {
  draft: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
  published: 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-300',
  archived: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-300',
  closed: 'bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-300',
}

const jobTypeLabels = {
  full_time: 'Full Time',
  part_time: 'Part Time',
  contract: 'Contract',
  internship: 'Internship',
  temporary: 'Temporary',
}

const experienceLevelLabels = {
  entry: 'Entry',
  mid: 'Mid',
  senior: 'Senior',
  lead: 'Lead',
  executive: 'Executive',
}

export function JobTableRow({ row, onDelete, isSelected, onSelect }: JobTableRowProps) {
  const { setParams } = useJobParams()

  const onClick = () => {
    setParams({
      update: true,
      jobId: row.id,
    })
  }

  const formatSalaryRange = () => {
    if (!row.salary_min && !row.salary_max) return '-'

    const currency = 'USD' // You might want to get this from organization settings
    const locale = 'en-US' // You might want to get this from user settings

    if (row.salary_min && row.salary_max) {
      const min = formatAmount({
        currency,
        amount: row.salary_min,
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
        locale,
      })
      const max = formatAmount({
        currency,
        amount: row.salary_max,
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
        locale,
      })
      return `${min} - ${max}`
    }

    if (row.salary_min) {
      return `${formatAmount({
        currency,
        amount: row.salary_min,
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
        locale,
      })}+`
    }

    return `Up to ${formatAmount({
      currency,
      amount: row.salary_max!,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
      locale,
    })}`
  }

  return (
    <AlertDialog>
      <DropdownMenu>
        <Row>
          <DataTableCell className='w-[40px] min-w-[40px] md:sticky md:left-0 bg-background group-hover:bg-[#F2F1EF] group-hover:dark:bg-secondary z-20 border-r border-border'>
            <Checkbox checked={isSelected} onCheckedChange={onSelect} aria-label='Select job' />
          </DataTableCell>

          <DataTableCell
            onClick={onClick}
            className='w-[280px] min-w-[280px] cursor-pointer md:sticky md:left-[40px] bg-background group-hover:bg-[#F2F1EF] group-hover:dark:bg-secondary z-20 border-r border-border before:absolute before:right-0 before:top-0 before:bottom-0 before:w-px before:bg-border after:absolute after:right-[-24px] after:top-0 after:bottom-0 after:w-6 after:bg-gradient-to-l after:from-transparent after:to-background group-hover:after:to-muted after:z-[-1]'>
            <div className='flex flex-col'>
              <span className='font-medium truncate'>{row.title}</span>
              {row.department && <span className='text-xs text-muted-foreground truncate'>{row.department}</span>}
            </div>
          </DataTableCell>

          <DataTableCell onClick={onClick} className='cursor-pointer'>
            {row.department || '-'}
          </DataTableCell>

          <DataTableCell onClick={onClick} className='cursor-pointer'>
            <Badge variant='secondary' className='text-xs'>
              {jobTypeLabels[row.job_type as keyof typeof jobTypeLabels]}
            </Badge>
          </DataTableCell>

          <DataTableCell onClick={onClick} className='cursor-pointer'>
            {row.experience_level ? (
              <Badge variant='outline' className='text-xs'>
                {experienceLevelLabels[row.experience_level as keyof typeof experienceLevelLabels]}
              </Badge>
            ) : (
              '-'
            )}
          </DataTableCell>

          <DataTableCell onClick={onClick} className='cursor-pointer'>
            <Badge variant='secondary' className={`text-xs ${statusColors[row.status as keyof typeof statusColors]}`}>
              {row.status.charAt(0).toUpperCase() + row.status.slice(1)}
            </Badge>
          </DataTableCell>

          <DataTableCell onClick={onClick} className='cursor-pointer'>
            {row.hiring_manager?.user ? (
              <div className='flex items-center space-x-2'>
                <Avatar className='size-6'>
                  <AvatarFallback className='text-xs'>
                    {row.hiring_manager.user.full_name?.[0]?.toUpperCase() || '?'}
                  </AvatarFallback>
                </Avatar>
                <span className='truncate text-sm'>
                  {row.hiring_manager.user.full_name || row.hiring_manager.user.email}
                </span>
              </div>
            ) : (
              '-'
            )}
          </DataTableCell>

          <DataTableCell onClick={onClick} className='cursor-pointer'>
            <span className='text-sm'>{formatSalaryRange()}</span>
          </DataTableCell>

          <DataTableCell onClick={onClick} className='cursor-pointer'>
            <span className='text-sm text-muted-foreground'>
              {formatDistanceToNow(new Date(row.created_at!), { addSuffix: true })}
            </span>
          </DataTableCell>

          <DataTableCell className='md:sticky md:right-0 bg-background group-hover:bg-[#F2F1EF] group-hover:dark:bg-secondary z-30 before:absolute before:left-0 before:top-0 before:bottom-0 before:w-px before:bg-border after:absolute after:left-[-24px] after:top-0 after:bottom-0 after:w-6 after:bg-gradient-to-r after:from-transparent after:to-background group-hover:after:to-muted after:z-[-1]'>
            <div className='flex justify-center'>
              <DropdownMenuTrigger>
                <MoreHorizontal className='h-4 w-4' />
              </DropdownMenuTrigger>
            </div>
          </DataTableCell>
        </Row>

        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete this job posting.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => onDelete({ id: row.id })}>Continue</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>

        <DropdownMenuContent className='w-42' sideOffset={10} align='end'>
          <DropdownMenuItem onClick={() => setParams({ update: true, jobId: row.id })}>Edit Job</DropdownMenuItem>

          <DropdownMenuItem asChild>
            <Link href={`/jobs/${row.id}`}>View Details</Link>
          </DropdownMenuItem>

          <DropdownMenuItem
            onClick={() => {
              // TODO: Implement duplicate functionality
              console.log('Duplicate job:', row.id)
            }}>
            Duplicate
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          <AlertDialogTrigger asChild>
            <DropdownMenuItem className='text-destructive'>Delete Job</DropdownMenuItem>
          </AlertDialogTrigger>
        </DropdownMenuContent>
      </DropdownMenu>
    </AlertDialog>
  )
}
