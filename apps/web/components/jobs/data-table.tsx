'use client'
import { DataTableViewOptions } from '@/components/data-table/column-toggle'
import { DataTablePagination } from '@/components/data-table/pagination'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@seeds/ui/table'
import type { JobTemplate } from '@/data/job-templates'
import {
  type ColumnDef,
  type ColumnFiltersState,
  type Row,
  type SortingState,
  type VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table'
import { ChevronRightIcon } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'

declare module '@tanstack/table-core' {
  interface ColumnMeta<TData, TValue> {
    className?: string
  }
}

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  filterField?: string
  filterPlaceholder?: string
  onRowClick?: (row: Row<TData>) => void
  onCreateNew?: () => void
  templates?: JobTemplate[]
}

export function DataTable<TData, TValue>({
  columns,
  data,
  filterField = 'title',
  filterPlaceholder = 'Filter by job title...',
  onRowClick,
  onCreateNew,
  templates = [],
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = useState({})

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    onColumnFiltersChange: setColumnFilters,
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
  })

  const hasData = data.length > 0

  return (
    <div className='space-y-4 min-w-full'>
      {hasData && (
        <div className='flex items-center justify-between mt-1'>
          <div className='flex items-center gap-4'>
            {filterField && table.getColumn(filterField) && (
              <div className='w-64'>
                <Input
                  placeholder={filterPlaceholder}
                  value={(table.getColumn(filterField)?.getFilterValue() as string) ?? ''}
                  onChange={(event) => table.getColumn(filterField)?.setFilterValue(event.target.value)}
                />
              </div>
            )}
            {table.getColumn('department') && (
              <div className='w-48'>
                <Select
                  onValueChange={(value) => table.getColumn('department')?.setFilterValue(value === 'all' ? '' : value)}
                  defaultValue=''>
                  <SelectTrigger>
                    <SelectValue placeholder='All Departments' />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='all'>All Departments</SelectItem>
                    <SelectItem value='Engineering'>Engineering</SelectItem>
                    <SelectItem value='Product'>Product</SelectItem>
                    <SelectItem value='Design'>Design</SelectItem>
                    <SelectItem value='Analytics'>Analytics</SelectItem>
                    <SelectItem value='Marketing'>Marketing</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
            {table.getColumn('status') && (
              <div className='w-40'>
                <Select
                  onValueChange={(value) => table.getColumn('status')?.setFilterValue(value === 'all' ? '' : value)}
                  defaultValue=''>
                  <SelectTrigger>
                    <SelectValue placeholder='All Statuses' />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='all'>All Statuses</SelectItem>
                    <SelectItem value='Open'>Open</SelectItem>
                    <SelectItem value='Closed'>Closed</SelectItem>
                    <SelectItem value='Draft'>Draft</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <DataTableViewOptions table={table} />
        </div>
      )}

      {hasData ? (
        <div className='rounded-md w-full overflow-x-auto'>
          <Table className='w-full min-w-[800px]'>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <TableHead
                      key={header.id}
                      className={`whitespace-nowrap px-4 py-2 ${header.column.columnDef.meta?.className || ''}`}>
                      {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows.length > 0 ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && 'selected'}
                    onClick={() => onRowClick && onRowClick(row)}
                    className={onRowClick ? 'cursor-pointer hover:bg-muted/50' : ''}>
                    {row.getVisibleCells().map((cell) => (
                      <TableCell
                        key={cell.id}
                        className={`whitespace-nowrap px-4 py-2 ${cell.column.columnDef.meta?.className || ''}`}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={columns.length} className='h-24 text-center'>
                    No results found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className='mx-auto max-w-lg py-6 h-[calc(100vh-6rem)] flex flex-col justify-center'>
          <h2 className='text-base font-semibold'>Create a job posting</h2>
          <p className='text-sm text-muted-foreground'>
            Get started by selecting a template or create a job from scratch.
          </p>
          {templates.length > 0 ? (
            <ul role='list' className='mt-6 divide-y divide-border border-y'>
              {templates.slice(0, 3).map((template, idx) => (
                <li key={idx}>
                  <Link href={`/jobs/create?template=${template.id}`} prefetch>
                    <div className='group relative flex items-start space-x-3 py-4'>
                      <div className='shrink-0'>
                        <span className='inline-flex size-10 items-center justify-center rounded-lg bg-brand-subtle'>
                          <template.icon className='size-6 text-brand-subtle-foreground' aria-hidden='true' />
                        </span>
                      </div>
                      <div className='min-w-0 flex-1'>
                        <div className='text-sm font-medium'>
                          <span aria-hidden='true' className='absolute inset-0' />
                          {template.title}
                        </div>
                        <p className='text-xs text-muted-foreground'>{template.department}</p>
                      </div>
                      <div className='shrink-0 self-center'>
                        <ChevronRightIcon
                          className='size-5 text-muted-foreground group-hover:text-foreground'
                          aria-hidden='true'
                        />
                      </div>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          ) : null}
          <div className='mt-6 flex justify-between items-center'>
            <Button variant='link' className='pl-0'>
              <Link href='/jobs/create' prefetch className='text-sm font-medium'>
                Create a job without a template
                <span aria-hidden='true'> →</span>
              </Link>
            </Button>
            <Link href='#' className='text-xs text-muted-foreground'>
              Not hiring? Learn more!
            </Link>
          </div>
        </div>
      )}

      {hasData && <DataTablePagination table={table} />}
    </div>
  )
}
