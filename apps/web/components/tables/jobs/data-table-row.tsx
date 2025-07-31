'use client'

import { TableCell, TableRow } from '../../ui/table'
import { cn } from '../../ui/lib/utils'
import type { RouterOutputs } from '@/trpc/routers/_app'
import { type Row, flexRender } from '@tanstack/react-table'

type JobPosting = NonNullable<RouterOutputs['organization']['listJobs']['data']>[number]

interface DataTableRowProps {
  row: Row<JobPosting>
  getStickyStyle: (columnId: string) => React.CSSProperties
  getStickyClassName: (columnId: string) => string
}

export function DataTableRow({ row, getStickyStyle, getStickyClassName }: DataTableRowProps) {
  return (
    <TableRow
      data-state={row.getIsSelected() && 'selected'}
      className={cn('hover:bg-muted/50 cursor-pointer transition-colors', row.getIsSelected() && 'bg-muted')}>
      {row.getVisibleCells().map((cell) => {
        const columnId = cell.column.id

        return (
          <TableCell
            key={cell.id}
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
            {flexRender(cell.column.columnDef.cell, cell.getContext())}
          </TableCell>
        )
      })}
    </TableRow>
  )
}
