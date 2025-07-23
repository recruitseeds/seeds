'use client'

import { Container } from '@/components/container'
import {
  type ColumnFiltersState,
  type SortingState,
  type VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table'
import { ChevronDown, Plus, Search } from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useMemo, useState } from 'react'

import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useTRPC } from '@/trpc/client'
import type { RouterOutputs } from '@/trpc/routers/_app'
import { useMutation, useQuery } from '@tanstack/react-query'

import { columns } from './columns'
import { DataTablePagination } from './pagination'

interface JobsTablePropsWithData {
  initialJobsData: RouterOutputs['organization']['listJobPostings']
  initialStatus?: 'draft' | 'published' | 'archived' | 'closed'
  initialSort?: [string, string]
}

interface JobsTablePropsWithoutData {
  initialStatus?: 'draft' | 'published' | 'archived' | 'closed'
  initialSort?: [string, string]
}

type JobsTableProps = JobsTablePropsWithData | JobsTablePropsWithoutData

function hasData(props: JobsTableProps): props is JobsTablePropsWithData {
  return 'initialJobsData' in props
}

export function JobsTable(props: JobsTableProps) {
  const { initialStatus, initialSort } = props
  const router = useRouter()
  const searchParams = useSearchParams()
  const trpc = useTRPC()

  // Using tRPC query for jobs data - this will use initial data if provided
  const queryInput = {
    status: initialStatus,
    page: 1,
    pageSize: 50,
  }

  const queryOptionsObj = trpc.organization.listJobPostings.queryOptions(
    queryInput,
    hasData(props) ? { initialData: props.initialJobsData } : undefined
  )

  const { data, isLoading } = useQuery(queryOptionsObj)

  // Create job mutation for the "Create Job" button
  const createJobMutation = useMutation(
    trpc.organization.createJobPosting.mutationOptions({
      onSuccess: (newJob) => {
        // Redirect to the edit page for the newly created job
        router.push(`/jobs/create/${newJob.id}`)
      },
      onError: (error) => {
        console.error('Failed to create job:', error)
        // You could add a toast notification here
      },
    })
  )

  const jobs = useMemo(() => {
    return data?.data ?? []
  }, [data])

  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = useState({})
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState(initialStatus || 'all')

  const table = useReactTable({
    data: jobs,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
      globalFilter: searchTerm,
    },
    onGlobalFilterChange: setSearchTerm,
  })

  const updateURL = (params: Record<string, string | null>) => {
    const current = new URLSearchParams(Array.from(searchParams.entries()))

    Object.entries(params).forEach(([key, value]) => {
      if (value === null || value === '') {
        current.delete(key)
      } else {
        current.set(key, value)
      }
    })

    router.push(`?${current.toString()}`, { scroll: false })
  }

  const handleSearch = (value: string) => {
    setSearchTerm(value)
    updateURL({ search: value || null, page: '1' })
  }

  const handleStatusFilter = (value: string) => {
    setStatusFilter(value)
    updateURL({ status: value === 'all' ? null : value, page: '1' })
  }

  const handleCreateJob = () => {
    router.push('/jobs/create')
  }

  const hasJobs = jobs.length > 0
  const isLoadingContent = isLoading || createJobMutation.isPending

  if (isLoadingContent) {
    return <div>Loading...</div>
  }

  return (
    <Container>
      <div className='space-y-4'>
        {/* Search and filter controls */}
        <div className='flex flex-col sm:flex-row gap-4'>
          <div className='flex-1'>
            <div className='relative'>
              <Search className='absolute left-2 top-2.5 h-4 w-4 text-muted-foreground' />
              <Input
                placeholder='Search jobs...'
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                className='pl-8'
              />
            </div>
          </div>

          <div className='flex flex-col sm:flex-row gap-2'>
            <Select value={statusFilter} onValueChange={handleStatusFilter}>
              <SelectTrigger className='w-full sm:w-[180px]'>
                <SelectValue placeholder='Filter by status' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='all'>All statuses</SelectItem>
                <SelectItem value='draft'>Draft</SelectItem>
                <SelectItem value='published'>Published</SelectItem>
                <SelectItem value='archived'>Archived</SelectItem>
                <SelectItem value='closed'>Closed</SelectItem>
              </SelectContent>
            </Select>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant='outline' className='w-full sm:w-auto'>
                  Columns <ChevronDown className='ml-2 h-4 w-4' />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align='end'>
                {table
                  .getAllColumns()
                  .filter((column) => column.getCanHide())
                  .map((column) => {
                    return (
                      <DropdownMenuCheckboxItem
                        key={column.id}
                        className='capitalize'
                        checked={column.getIsVisible()}
                        onCheckedChange={(value) => column.toggleVisibility(!!value)}>
                        {column.id}
                      </DropdownMenuCheckboxItem>
                    )
                  })}
              </DropdownMenuContent>
            </DropdownMenu>

            <Button onClick={handleCreateJob} className='w-full sm:w-auto'>
              <Plus className='mr-2 h-4 w-4' />
              Create Job
            </Button>
          </div>
        </div>

        {/* Table */}
        <div className='rounded-lg border overflow-hidden'>
          {hasJobs ? (
            <div className='w-full overflow-x-auto'>
              <Table className='w-full min-w-[800px]'>
                <TableHeader>
                  {table.getHeaderGroups().map((headerGroup) => (
                    <TableRow key={headerGroup.id} className='hover:bg-transparent'>
                      {headerGroup.headers.map((header, index) => (
                        <TableHead
                          key={header.id}
                          className={`
                            bg-muted/50 px-4 py-3
                            ${index === 0 ? 'rounded-tl-lg' : ''}
                            ${index === headerGroup.headers.length - 1 ? 'rounded-tr-lg' : ''}
                            ${header.column.columnDef.meta?.className || ''}
                          `}>
                          {header.isPlaceholder
                            ? null
                            : flexRender(header.column.columnDef.header, header.getContext())}
                        </TableHead>
                      ))}
                    </TableRow>
                  ))}
                </TableHeader>
                <TableBody>
                  {table.getRowModel().rows?.length ? (
                    table.getRowModel().rows.map((row, rowIndex) => (
                      <TableRow
                        key={row.id}
                        data-state={row.getIsSelected() && 'selected'}
                        className='cursor-pointer hover:bg-muted/50'
                        onClick={() => router.push(`/jobs/create/${row.original.id}`)}>
                        {row.getVisibleCells().map((cell, cellIndex) => (
                          <TableCell
                            key={cell.id}
                            className={`
                              px-4 py-3
                              ${
                                rowIndex === table.getRowModel().rows.length - 1 && cellIndex === 0
                                  ? 'rounded-bl-lg'
                                  : ''
                              }
                              ${
                                rowIndex === table.getRowModel().rows.length - 1 &&
                                cellIndex === row.getVisibleCells().length - 1
                                  ? 'rounded-br-lg'
                                  : ''
                              }
                              ${cell.column.columnDef.meta?.className || ''}
                            `}>
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={columns.length} className='h-24 text-center rounded-b-lg'>
                        No jobs found.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className='flex flex-col items-center justify-center py-12 text-center'>
              <h3 className='text-lg font-semibold'>No jobs yet</h3>
              <p className='text-sm text-muted-foreground mb-4'>Get started by creating your first job posting.</p>
              <Button onClick={handleCreateJob}>
                <Plus className='mr-2 h-4 w-4' />
                Create Job
              </Button>
            </div>
          )}
        </div>

        {/* Pagination */}
        {hasJobs && <DataTablePagination table={table} />}
      </div>
    </Container>
  )
}
