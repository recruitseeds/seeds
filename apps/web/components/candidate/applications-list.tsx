'use client'

import { Button } from '../ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Input } from '../ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table'
import { useTRPC } from '@/trpc/client'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { type SortingState, flexRender, getCoreRowModel, useReactTable } from '@tanstack/react-table'
import { FilterX } from 'lucide-react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import * as React from 'react'
import { type ApplicationStatus, type ApplicationsListProps, STATUS_OPTIONS } from './applications-badge'
import { columns } from './applications-table-columns'
import { CandidateApplicationActionsDropdown } from './candidate-application-actions-dropdown'

export function ApplicationsList({ initialApplicationsData }: ApplicationsListProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const trpc = useTRPC()
  const pageIndex = searchParams.get('page') ? Number.parseInt(searchParams.get('page') as string, 10) - 1 : 0
  const pageSize = searchParams.get('pageSize') ? Number.parseInt(searchParams.get('pageSize') as string, 10) : 10
  const globalFilter = searchParams.get('search') || ''
  const statusFilter = (searchParams.get('status') as ApplicationStatus | 'all') || 'all'
  const isTypingRef = React.useRef(false)
  const [searchInput, setSearchInput] = React.useState(globalFilter)

  if (!isTypingRef.current && searchInput !== globalFilter) {
    setSearchInput(globalFilter)
  }

  const queryInput = React.useMemo(
    () => ({
      page: pageIndex + 1,
      pageSize: pageSize,
      search: globalFilter || undefined,
      status: statusFilter === 'all' ? undefined : statusFilter,
    }),
    [pageIndex, pageSize, globalFilter, statusFilter]
  )

  const queryOptionsObj = trpc.candidate.listApplications.queryOptions(
    queryInput,
    initialApplicationsData ? { initialData: initialApplicationsData } : undefined
  )

  const { data: applicationsQueryResult, isFetching } = useQuery({
    ...queryOptionsObj,
    placeholderData: keepPreviousData,
  })

  const applications = applicationsQueryResult?.data || []
  const totalApplicationsCount = applicationsQueryResult?.count ?? 0
  const pageCount = React.useMemo(
    () => (totalApplicationsCount > 0 ? Math.ceil(totalApplicationsCount / pageSize) : 0),
    [totalApplicationsCount, pageSize]
  )

  const [sorting, setSorting] = React.useState<SortingState>([{ id: 'application_date', desc: true }])

  const table = useReactTable({
    data: applications,
    columns,
    state: {
      sorting,
      pagination: {
        pageIndex,
        pageSize,
      },
    },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    manualFiltering: true,
    pageCount: pageCount,
  })

  const updateURL = React.useCallback(
    (updates: Record<string, string | null>) => {
      const current = new URLSearchParams(Array.from(searchParams.entries()))

      for (const [key, value] of Object.entries(updates)) {
        if (value === null || value === '') {
          current.delete(key)
        } else {
          current.set(key, value)
        }
      }

      router.push(`${pathname}?${current.toString()}`, { scroll: false })
    },
    [pathname, router, searchParams]
  )

  const debouncedSearchUpdate = React.useMemo(() => {
    let timeoutId: NodeJS.Timeout
    return (value: string) => {
      clearTimeout(timeoutId)
      timeoutId = setTimeout(() => {
        isTypingRef.current = false
        updateURL({
          search: value || null,
          page: '1',
        })
      }, 300)
    }
  }, [updateURL])

  const handleGlobalFilterChange = React.useCallback(
    (value: string) => {
      isTypingRef.current = true
      setSearchInput(value)
      debouncedSearchUpdate(value)
    },
    [debouncedSearchUpdate]
  )

  const handleStatusFilterChange = React.useCallback(
    (value: string) => {
      updateURL({
        status: value === 'all' ? null : value,
        page: '1',
      })
    },
    [updateURL]
  )

  const handlePaginationChange = React.useCallback(
    (newPageIndex: number) => {
      updateURL({ page: (newPageIndex + 1).toString() })
    },
    [updateURL]
  )

  const handleClearFilters = React.useCallback(() => {
    isTypingRef.current = false
    setSearchInput('')
    updateURL({
      search: null,
      status: null,
      page: '1',
    })
  }, [updateURL])

  const hasActiveFilters = globalFilter !== '' || statusFilter !== 'all'

  if (!applicationsQueryResult && !initialApplicationsData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Job Applications</CardTitle>
        </CardHeader>
        <CardContent>
          <div className='p-6 text-center'>Loading applications...</div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className='border-none gap-3 pt-0'>
      <CardHeader className='px-0'>
        <div className='flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4'>
          <div>
            <CardTitle>Job Applications</CardTitle>
            <CardDescription>Track and filter your job applications.</CardDescription>
          </div>
          <CandidateApplicationActionsDropdown />
        </div>
        <div className='mt-6 flex flex-col sm:flex-row gap-3 items-end'>
          <div className='flex-grow w-full sm:w-auto'>
            <Input
              placeholder='Search applications...'
              value={searchInput}
              onChange={(e) => handleGlobalFilterChange(e.target.value)}
              className='max-w-xs w-full'
            />
          </div>
          <div className='w-full sm:w-auto'>
            <Select value={statusFilter} onValueChange={handleStatusFilterChange}>
              <SelectTrigger className='w-full sm:w-[180px]'>
                <SelectValue placeholder='Filter by status' />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {hasActiveFilters && (
            <Button
              variant='ghost'
              size='default'
              onClick={handleClearFilters}
              className='flex items-center gap-1.5 h-9'>
              <FilterX className='size-4' />
              Clear Filters
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className='px-0'>
        {isFetching && <div className='text-center py-2 text-sm text-muted-foreground'>Updating...</div>}
        <div className='rounded-md border'>
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <TableHead key={header.id}>
                      {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow key={row.id}>
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={columns.length} className='h-24 text-center'>
                    <p className='text-lg font-medium text-muted-foreground'>
                      No applications found
                      {hasActiveFilters ? ' matching your filters.' : '.'}
                    </p>
                    {hasActiveFilters && (
                      <Button variant='link' onClick={handleClearFilters} className='mt-2'>
                        Clear all filters
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        <div className='flex items-center justify-between py-4 flex-col sm:flex-row'>
          <div className='text-sm text-muted-foreground mb-2 sm:mb-0'>
            {totalApplicationsCount} application
            {totalApplicationsCount !== 1 ? 's' : ''}
          </div>
          <div className='flex items-center space-x-2'>
            <Button
              variant='outline'
              size='sm'
              onClick={() => handlePaginationChange(pageIndex - 1)}
              disabled={pageIndex === 0}>
              Previous
            </Button>
            <span className='text-sm text-muted-foreground'>
              Page {pageIndex + 1} of {pageCount || 1}
            </span>
            <Button
              variant='outline'
              size='sm'
              onClick={() => handlePaginationChange(pageIndex + 1)}
              disabled={pageIndex >= pageCount - 1}>
              Next
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
