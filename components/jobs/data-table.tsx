'use client'

import { DataTableViewOptions } from '@/components/data-table/column-toggle'
import { DataTablePagination } from '@/components/data-table/pagination'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  ColumnDef,
  ColumnFiltersState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  Row,
  SortingState,
  useReactTable,
  VisibilityState,
} from '@tanstack/react-table'
import { useState } from 'react'
import { Input } from '../ui/input'

// Add types for the column meta
declare module '@tanstack/table-core' {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
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
}

export function DataTable<TData, TValue>({
  columns,
  data,
  filterField = 'email',
  filterPlaceholder = 'Filter emails...',
  onRowClick,
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

  return (
    <div className='space-y-4'>
      <div className='flex items-center justify-between'>
        {filterField && table.getColumn(filterField) && (
          <Input
            placeholder={filterPlaceholder}
            value={
              (table.getColumn(filterField)?.getFilterValue() as string) ?? ''
            }
            onChange={(event) =>
              table.getColumn(filterField)?.setFilterValue(event.target.value)
            }
            className='max-w-sm'
          />
        )}
        <DataTableViewOptions table={table} />
      </div>
      <div className='rounded-md border overflow-x-auto'>
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    className={`whitespace-nowrap px-4 py-2 ${
                      header.column.columnDef.meta?.className || ''
                    }`}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && 'selected'}
                  onClick={() => onRowClick && onRowClick(row)}
                  className={
                    onRowClick ? 'cursor-pointer hover:bg-muted/20' : ''
                  }>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell
                      key={cell.id}
                      className={`whitespace-nowrap px-4 py-2 ${
                        cell.column.columnDef.meta?.className || ''
                      }`}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className='h-24 text-center'>
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <DataTablePagination table={table} />
    </div>
  )
}
