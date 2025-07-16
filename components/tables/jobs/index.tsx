// components/tables/jobs/index.tsx
"use client"

import { Table, TableBody } from "@/components/ui/table"
import { useStickyColumns } from "@/hooks/use-sticky-columns"
import { useTableScroll } from "@/hooks/use-table-scroll"
import { cn } from "@/lib/utils"
import { useTRPC } from "@/trpc/client"
import { useQueryClient, useSuspenseInfiniteQuery } from "@tanstack/react-query"
import {
  type SortingState,
  type VisibilityState,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table"
import { useRouter, useSearchParams } from "next/navigation"
import { useEffect, useMemo, useState } from "react"
import { useInView } from "react-intersection-observer"
import { columns } from "./c"
import { DataTableHeader } from "./data-table-header"
import { DataTableRow } from "./data-table-row"
import { EmptyState, NoResults } from "./empty-states"
import { Loading } from "./loading"

interface JobsTableProps {
  initialSearch?: string
  initialStatus?: "draft" | "published" | "archived" | "closed"
  initialSort?: [string, string]
}

export function JobsTable({ initialSearch, initialStatus, initialSort }: JobsTableProps) {
  const trpc = useTRPC()
  const queryClient = useQueryClient()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { ref, inView } = useInView()

  // Table state
  const [rowSelection, setRowSelection] = useState({})
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const [sorting, setSorting] = useState<SortingState>(
    initialSort ? [{ id: initialSort[0], desc: initialSort[1] === "desc" }] : []
  )

  // Search state
  const [search, setSearch] = useState(initialSearch || "")
  const [status, setStatus] = useState<string | undefined>(initialStatus)

  // Table scroll hook with sticky columns
  const tableScroll = useTableScroll({
    useColumnWidths: true,
    startFromColumn: 2, // Skip select and title columns
  })

  // Convert sorting state to API format
  const sortParam = sorting.length > 0 
    ? [sorting[0]!.id, sorting[0]!.desc ? "desc" : "asc"] as [string, string]
    : undefined

  // Infinite query for jobs
  const infiniteQueryOptions = trpc.organization.listJobs.infiniteQueryOptions(
    {
      search: search || undefined,
      status: status as "draft" | "published" | "archived" | "closed" | undefined,
      sort: sortParam,
      limit: 50,
    },
    {
      getNextPageParam: ({ meta }) => meta?.cursor,
    }
  )

  const { data, fetchNextPage, hasNextPage, isFetching, isLoading } =
    useSuspenseInfiniteQuery(infiniteQueryOptions)

  // Flatten data for table
  const tableData = useMemo(() => {
    return data?.pages.flatMap((page) => page?.data ?? []) ?? []
  }, [data])

  // Update URL when filters change
  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString())
    
    if (search) {
      params.set("search", search)
    } else {
      params.delete("search")
    }
    
    if (status) {
      params.set("status", status)
    } else {
      params.delete("status")
    }
    
    if (sortParam) {
      params.set("sort", sortParam.join(","))
    } else {
      params.delete("sort")
    }

    const newUrl = `${window.location.pathname}?${params.toString()}`
    router.replace(newUrl, { scroll: false })
  }, [search, status, sortParam, router, searchParams])

  // Table setup
  const table = useReactTable({
    getRowId: (row) => row.id,
    data: tableData,
    columns,
    getCoreRowModel: getCoreRowModel(),
    onRowSelectionChange: setRowSelection,
    onColumnVisibilityChange: setColumnVisibility,
    onSortingChange: setSorting,
    state: {
      rowSelection,
      columnVisibility,
      sorting,
    },
    meta: {
      onDeleteJob: (jobId: string) => {
        // Handle job deletion
        console.log("Delete job:", jobId)
        // Invalidate queries to refetch data
        queryClient.invalidateQueries({
          queryKey: [["organization", "listJobs"]],
        })
      },
    },
  })

  // Sticky columns hook
  const { getStickyStyle, getStickyClassName } = useStickyColumns({
    columnVisibility,
    table,
  })

  // Auto-fetch next page when scrolling
  useEffect(() => {
    if (inView && hasNextPage && !isFetching) {
      fetchNextPage()
    }
  }, [inView, fetchNextPage, hasNextPage, isFetching])

  // Show loading state only on initial load
  if (isLoading) {
    return <Loading />
  }

  // Show empty state if no data and no search/filters
  if (tableData.length === 0 && !search && !status) {
    return <EmptyState />
  }

  // Show no results if filtered but no data
  if (tableData.length === 0 && (search || status)) {
    return (
      <NoResults 
        search={search}
        onClearFilters={() => {
          setSearch("")
          setStatus(undefined)
        }}
      />
    )
  }

  return (
    <div className="space-y-4">
// components/tables/jobs/index.tsx
"use client"

import { useStickyColumns } from "@/hooks/use-sticky-columns"
import { useTableScroll } from "@/hooks/use-table-scroll"
import { useTRPC } from "@/trpc/client"
import { cn } from "@/lib/utils"
import { Table, TableBody } from "@/components/ui/table"
import { useSuspenseInfiniteQuery, useQueryClient } from "@tanstack/react-query"
import {
  type VisibilityState,
  type SortingState,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table"
import { useState, useEffect, useMemo } from "react"
import { useInView } from "react-intersection-observer"
import { useRouter, useSearchParams } from "next/navigation"
import { columns } from "./columns"
import { DataTableHeader } from "./data-table-header"
import { DataTableRow } from "./data-table-row"
import { EmptyState, NoResults } from "./empty-states"
import { Loading } from "./loading"

interface JobsTableProps {
  initialSearch?: string
  initialStatus?: "draft" | "published" | "archived" | "closed"
  initialSort?: [string, string]
}

export function JobsTable({ initialSearch, initialStatus, initialSort }: JobsTableProps) {
  const trpc = useTRPC()
  const queryClient = useQueryClient()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { ref, inView } = useInView()

  // Table state
  const [rowSelection, setRowSelection] = useState({})
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({
    // Hide some columns by default on mobile
    updated_at: false,
    experience_level: false,
  })
  const [sorting, setSorting] = useState<SortingState>(
    initialSort ? [{ id: initialSort[0], desc: initialSort[1] === "desc" }] : []
  )

  // Search state
  const [search, setSearch] = useState(initialSearch || "")
  const [status, setStatus] = useState<string | undefined>(initialStatus)

  // Table scroll hook with sticky columns
  const tableScroll = useTableScroll({
    useColumnWidths: true,
    startFromColumn: 2, // Skip select and title columns
  })

  // Convert sorting state to API format
  const sortParam = sorting.length > 0 
    ? [sorting[0]!.id, sorting[0]!.desc ? "desc" : "asc"] as [string, string]
    : undefined

  // Infinite query for jobs
  const infiniteQueryOptions = trpc.organization.listJobs.infiniteQueryOptions(
    {
      search: search || undefined,
      status: status as "draft" | "published" | "archived" | "closed" | undefined,
      sort: sortParam,
      limit: 50,
    },
    {
      getNextPageParam: ({ meta }) => meta?.cursor,
    }
  )

  const { data, fetchNextPage, hasNextPage, isFetching, isLoading } =
    useSuspenseInfiniteQuery(infiniteQueryOptions)

  // Flatten data for table
  const tableData = useMemo(() => {
    return data?.pages.flatMap((page) => page?.data ?? []) ?? []
  }, [data])

  // Update URL when filters change
  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString())
    
    if (search) {
      params.set("search", search)
    } else {
      params.delete("search")
    }
    
    if (status) {
      params.set("status", status)
    } else {
      params.delete("status")
    }
    
    if (sortParam) {
      params.set("sort", sortParam.join(","))
    } else {
      params.delete("sort")
    }

    const newUrl = `${window.location.pathname}?${params.toString()}`
    router.replace(newUrl, { scroll: false })
  }, [search, status, sortParam, router, searchParams])

  // Table setup
  const table = useReactTable({
    getRowId: (row) => row.id,
    data: tableData,
    columns,
    getCoreRowModel: getCoreRowModel(),
    onRowSelectionChange: setRowSelection,
    onColumnVisibilityChange: setColumnVisibility,
    onSortingChange: setSorting,
    state: {
      rowSelection,
      columnVisibility,
      sorting,
    },
    meta: {
      onDeleteJob: (jobId: string) => {
        // Handle job deletion
        console.log("Delete job:", jobId)
        // Invalidate queries to refetch data
        queryClient.invalidateQueries({
          queryKey: [["organization", "listJobs"]],
        })
      },
    },
  })

  // Sticky columns hook
  const { getStickyStyle, getStickyClassName } = useStickyColumns({
    columnVisibility,
    table,
  })

  // Auto-fetch next page when scrolling
  useEffect(() => {
    if (inView && hasNextPage && !isFetching) {
      fetchNextPage()
    }
  }, [inView, fetchNextPage, hasNextPage, isFetching])

  // Show loading state only on initial load
  if (isLoading) {
    return <Loading />
  }

  // Show empty state if no data and no search/filters
  if (tableData.length === 0 && !search && !status) {
    return <EmptyState />
  }

  // Show no results if filtered but no data
  if (tableData.length === 0 && (search || status)) {
    return (
      <NoResults 
        search={search}
        onClearFilters={() => {
          setSearch("")
          setStatus(undefined)
        }}
      />
    )
  }

  return (
    <div className="w-full max-w-full">
      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6 px-1">
        <div className="flex-1 min-w-0">
          <input
            type="text"
            placeholder="Search jobs..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-3 py-2 border border-border rounded-md bg-background"
          />
        </div>
        <div className="w-full sm:w-auto">
          <select
            value={status || ""}
            onChange={(e) => setStatus(e.target.value || undefined)}
            className="w-full sm:w-auto px-3 py-2 border border-border rounded-md bg-background"
          >
            <option value="">All Status</option>
            <option value="draft">Draft</option>
            <option value="published">Published</option>
            <option value="archived">Archived</option>
            <option value="closed">Closed</option>
          </select>
        </div>
      </div>

      {/* Table Container with proper mobile handling */}
      <div className="w-full">
        <div
          ref={tableScroll.containerRef}
          className="relative w-full overflow-auto border rounded-lg bg-background"
          style={{
            // Remove blur effect and add clean shadows
            maxWidth: '100vw',
          }}
        >
          <Table className="relative">
            <DataTableHeader 
              table={table} 
              tableScroll={tableScroll}
              getStickyStyle={getStickyStyle}
              getStickyClassName={getStickyClassName}
            />
            <TableBody>
              {table.getRowModel().rows.map((row) => (
                <DataTableRow
                  key={row.id}
                  row={row}
                  getStickyStyle={getStickyStyle}
                  getStickyClassName={getStickyClassName}
                />
              ))}
            </TableBody>
          </Table>

          {/* Loading indicator for infinite scroll */}
          {hasNextPage && (
            <div ref={ref} className="flex justify-center p-4 border-t">
              {isFetching ? (
                <div className="text-sm text-muted-foreground">Loading more jobs...</div>
              ) : (
                <div className="text-sm text-muted-foreground">Scroll to load more</div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Selected items info */}
      {Object.keys(rowSelection).length > 0 && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 mt-4 bg-muted rounded-lg gap-4">
          <span className="text-sm">
            {Object.keys(rowSelection).length} job(s) selected
          </span>
          <div className="flex gap-2 w-full sm:w-auto">
            <button
              onClick={() => setRowSelection({})}
              className="flex-1 sm:flex-none px-3 py-1 text-sm border rounded hover:bg-background transition-colors"
            >
              Clear selection
            </button>
            <button
              onClick={() => {
                // Handle bulk actions
                console.log("Bulk action for:", Object.keys(rowSelection))
              }}
              className="flex-1 sm:flex-none px-3 py-1 text-sm bg-primary text-primary-foreground rounded hover:bg-primary/90 transition-colors"
            >
              Bulk Actions
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
    </div>
  )
}