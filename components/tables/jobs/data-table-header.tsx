'use client'

import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { cn } from '@/lib/utils'
import type { RouterOutputs } from '@/trpc/routers/_app'
import type { Table } from '@tanstack/react-table'
import { ArrowDown, ArrowUp, ArrowUpDown, ChevronLeft, ChevronRight, Settings2 } from 'lucide-react'

type JobPosting = NonNullable<RouterOutputs['organization']['listJobs']['data']>[number]

interface TableScrollState {
  containerRef: React.RefObject<HTMLDivElement | null>
  canScrollLeft: boolean
  canScrollRight: boolean
  isScrollable: boolean
  scrollLeft: () => void
  scrollRight: () => void
}

interface DataTableHeaderProps {
  table: Table<JobPosting>
  tableScroll: TableScrollState
  getStickyStyle: (columnId: string) => React.CSSProperties
  getStickyClassName: (columnId: string) => string
}

export function DataTableHeader({ table, tableScroll, getStickyStyle, getStickyClassName }: DataTableHeaderProps) {
  return (
    <TableHeader className='border-l-0 border-r-0'>
      <TableRow className='h-[45px] hover:bg-transparent'>
        {table.getHeaderGroups().map((headerGroup) =>
          headerGroup.headers.map((header) => {
            const columnId = header.id
            const isSortable = header.column.getCanSort()
            const sortDirection = header.column.getIsSorted()

            return (
              <TableHead
                key={header.id}
                className={cn(
                  'px-3 md:px-4 py-2',
                  getStickyClassName(columnId),
                  // Add gradient shadow for sticky columns
                  getStickyClassName(columnId) && [
                    'before:absolute before:right-0 before:top-0 before:bottom-0 before:w-px before:bg-border',
                    'after:absolute after:right-[-24px] after:top-0 after:bottom-0 after:w-6 after:bg-gradient-to-l after:from-transparent after:to-background after:z-[-1]',
                  ]
                )}
                style={getStickyStyle(columnId)}>
                {header.isPlaceholder ? null : (
                  <div className='flex items-center space-x-2'>
                    {/* Special handling for select column */}
                    {columnId === 'select' ? (
                      <Checkbox
                        checked={
                          table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && 'indeterminate')
                        }
                        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
                        aria-label='Select all'
                      />
                    ) : (
                      <>
                        {/* Column header content */}
                        <div
                          className={cn(
                            'flex items-center space-x-1',
                            isSortable && 'cursor-pointer select-none hover:text-foreground',
                            !isSortable && 'text-muted-foreground'
                          )}
                          onClick={() => {
                            if (isSortable) {
                              header.column.toggleSorting()
                            }
                          }}>
                          <span className='font-medium'>
                            {typeof header.column.columnDef.header === 'string'
                              ? header.column.columnDef.header
                              : header.column.id}
                          </span>

                          {/* Sort indicator */}
                          {isSortable && (
                            <div className='w-4 h-4 flex items-center justify-center'>
                              {sortDirection === 'asc' ? (
                                <ArrowUp className='h-3 w-3' />
                              ) : sortDirection === 'desc' ? (
                                <ArrowDown className='h-3 w-3' />
                              ) : (
                                <ArrowUpDown className='h-3 w-3 opacity-50' />
                              )}
                            </div>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                )}
              </TableHead>
            )
          })
        )}

        {/* Table controls */}
        <TableHead className='w-[100px]'>
          <div className='flex items-center space-x-1'>
            {/* Horizontal scroll controls */}
            {tableScroll.isScrollable && (
              <>
                <Button
                  variant='ghost'
                  size='sm'
                  onClick={tableScroll.scrollLeft}
                  disabled={!tableScroll.canScrollLeft}
                  className='h-6 w-6 p-0'>
                  <ChevronLeft className='h-3 w-3' />
                </Button>
                <Button
                  variant='ghost'
                  size='sm'
                  onClick={tableScroll.scrollRight}
                  disabled={!tableScroll.canScrollRight}
                  className='h-6 w-6 p-0'>
                  <ChevronRight className='h-3 w-3' />
                </Button>
              </>
            )}

            {/* Column visibility toggle */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant='ghost' size='sm' className='h-6 w-6 p-0'>
                  <Settings2 className='h-3 w-3' />
                  <span className='sr-only'>Toggle columns</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align='end' className='w-[150px]'>
                {table
                  .getAllColumns()
                  .filter((column) => typeof column.accessorFn !== 'undefined' && column.getCanHide())
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
        </TableHead>
      </TableRow>
    </TableHeader>
  )
}
