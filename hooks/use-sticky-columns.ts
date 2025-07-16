'use client'

import type { Table } from '@tanstack/react-table'

interface UseStickyColumnsOptions<TData = unknown> {
  table?: Table<TData>
  loading?: boolean
  columnVisibility?: Record<string, boolean>
}

export function useStickyColumns<TData = unknown>(options: UseStickyColumnsOptions<TData> = {}) {
  const { table, columnVisibility } = options

  const getStickyStyle = (columnId: string) => {
    const stickyColumns = ['select', 'title'] // Define which columns are sticky
    const index = stickyColumns.indexOf(columnId)

    if (index === -1) return {}

    let leftOffset = 0
    for (let i = 0; i < index; i++) {
      const colId = stickyColumns[i]
      if (columnVisibility?.[colId] !== false) {
        leftOffset += getColumnWidth(colId)
      }
    }

    return {
      '--stick-left': `${leftOffset}px`,
    } as React.CSSProperties
  }

  const getColumnWidth = (columnId: string) => {
    const widths: Record<string, number> = {
      select: 50,
      title: 300,
    }
    return widths[columnId] || 150
  }

  const getStickyClassName = (columnId: string) => {
    const stickyColumns = ['select', 'title']
    return stickyColumns.includes(columnId)
      ? 'sticky left-[var(--stick-left)] bg-background z-10 border-r border-border'
      : ''
  }

  const isVisible = (columnId: string) => {
    return columnVisibility?.[columnId] !== false
  }

  return {
    getStickyStyle,
    getStickyClassName,
    isVisible,
  }
}
