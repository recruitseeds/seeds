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
import { useQuery } from '@tanstack/react-query'

import { columns } from './columns'
import { DataTablePagination } from './pagination'

interface JobsTableProps {
  initialSearch?: string
  initialStatus?: 'draft' | 'published' | 'archived' | 'closed'
  initialSort?: [string, string]
}

export function JobsTable({ initialSearch, initialStatus, initialSort }: JobsTableProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const trpc = useTRPC()

  // Using tRPC query for jobs data - adjusted to match your actual router
  const { data, isLoading } = useQuery(
    trpc.organization.listJobPostings.queryOptions({
      status: initialStatus,
      page: 1,
      pageSize: 50,
    })
  )

  const jobs = useMemo(() => {
    return data?.data ?? []
  }, [data])

  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = useState({})
  const [searchTerm, setSearchTerm] = useState(initialSearch || '')
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

  if (isLoading) {
    return (
      <div className='w-full space-y-4'>
        <div className='flex items-center justify-between'>
          <div className='h-10 w-64 bg-muted animate-pulse rounded-md' />
          <div className='h-10 w-32 bg-muted animate-pulse rounded-md' />
        </div>
        <div className='border rounded-lg'>
          <div className='h-12 bg-muted animate-pulse' />
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className='h-16 border-t bg-muted/50 animate-pulse' />
          ))}
        </div>
      </div>
    )
  }

  const hasJobs = jobs.length > 0

  return (
    <Container>
      <div className='w-full space-y-4'>
        {/* Header with search and filters */}
        <div className='flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0'>
          <div className='flex flex-1 flex-col space-y-2 sm:flex-row sm:items-center sm:space-x-2 sm:space-y-0'>
            <div className='relative flex-1 max-w-sm'>
              <Search className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground' />
              <Input
                placeholder='Search jobs...'
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                className='pl-9'
              />
            </div>

            <Select value={statusFilter} onValueChange={handleStatusFilter}>
              <SelectTrigger className='w-full sm:w-[180px]'>
                <SelectValue placeholder='All Statuses' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='all'>All Statuses</SelectItem>
                <SelectItem value='draft'>Draft</SelectItem>
                <SelectItem value='published'>Published</SelectItem>
                <SelectItem value='archived'>Archived</SelectItem>
                <SelectItem value='closed'>Closed</SelectItem>
              </SelectContent>
            </Select>

            {/* Column visibility dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant='outline' className='ml-auto sm:ml-0'>
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
          </div>

          <Button onClick={handleCreateJob} className='w-full sm:w-auto'>
            <Plus className='mr-2 h-4 w-4' />
            Create Job
          </Button>
        </div>

        {/* Table */}
        <div className='rounded-md border'>
          {hasJobs ? (
            <div className='relative w-full'>
              {/* Mobile responsive table container - NO BLUR */}
              <div className='w-full overflow-x-auto scrollbar-hide'>
                <Table className='jobs-table'>
                  <TableHeader>
                    {table.getHeaderGroups().map((headerGroup) => (
                      <TableRow key={headerGroup.id}>
                        {headerGroup.headers.map((header) => {
                          return (
                            <TableHead key={header.id} className={header.column.columnDef.meta?.className || ''}>
                              {header.isPlaceholder
                                ? null
                                : flexRender(header.column.columnDef.header, header.getContext())}
                            </TableHead>
                          )
                        })}
                      </TableRow>
                    ))}
                  </TableHeader>
                  <TableBody>
                    {table.getRowModel().rows?.length ? (
                      table.getRowModel().rows.map((row) => (
                        <TableRow
                          key={row.id}
                          data-state={row.getIsSelected() && 'selected'}
                          className='cursor-pointer hover:bg-muted/50'
                          onClick={() => router.push(`/jobs/${row.original.id}`)}>
                          {row.getVisibleCells().map((cell) => (
                            <TableCell
                              key={cell.id}
                              className={`table-cell-mobile ${cell.column.columnDef.meta?.className || ''}`}>
                              {flexRender(cell.column.columnDef.cell, cell.getContext())}
                            </TableCell>
                          ))}
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={columns.length} className='h-24 text-center'>
                          No jobs found.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          ) : (
            /* Empty state for no jobs */
            <div className='flex flex-col items-center justify-center py-12 text-center'>
              <div className='mx-auto max-w-md'>
                <h3 className='text-lg font-semibold'>No job postings yet</h3>
                <p className='mt-2 text-sm text-muted-foreground'>Get started by creating your first job posting.</p>
                <Button onClick={handleCreateJob} className='mt-4'>
                  <Plus className='mr-2 h-4 w-4' />
                  Create your first job
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Pagination */}
        {hasJobs && <DataTablePagination table={table} />}

        {/* Add custom styles to remove blur and improve mobile */}
        <style jsx>{`
          .scrollbar-hide {
            -ms-overflow-style: none;
            scrollbar-width: none;
          }
          .scrollbar-hide::-webkit-scrollbar {
            display: none;
          }
          .jobs-table {
            min-width: 800px;
          }
          @media (max-width: 768px) {
            .table-cell-mobile {
              padding-left: 0.5rem;
              padding-right: 0.5rem;
            }
          }
        `}</style>
      </div>
    </Container>
  )
}
