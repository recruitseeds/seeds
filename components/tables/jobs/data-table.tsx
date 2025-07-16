'use client'

import { LoadMore } from '@/components/load-more'
import { Table, TableBody } from '@/components/ui/table'
import { useJobFilterParams } from '@/hooks/use-job-filter-params'
import { useSortParams } from '@/hooks/use-sort-params'
import { useTableScroll } from '@/hooks/use-table-scroll'
import { useTRPC } from '@/trpc/client'
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useDeferredValue, useEffect, useState } from 'react'
import { useInView } from 'react-intersection-observer'
import { JobTableHeader } from './data-table-header'
import { JobTableRow } from './data-table-row'
import { EmptyState, NoResults } from './empty-states'

export function JobDataTable() {
  const { ref, inView } = useInView()
  const { params } = useSortParams()
  const { hasFilters, filter } = useJobFilterParams()
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set())
  const deferredSearch = useDeferredValue(filter.q)
  const trpc = useTRPC()
  const queryClient = useQueryClient()

  const tableScroll = useTableScroll({
    useColumnWidths: true,
    startFromColumn: 1,
  })

  const queryInput = {
    ...filter,
    q: deferredSearch ?? null,
    sort: params.sort,
    limit: 20,
  }

  // Use useInfiniteQuery with a simpler approach
  const { data, fetchNextPage, hasNextPage, refetch, isFetching } = useInfiniteQuery({
    queryKey: ['organization.getJobPostings', queryInput],
    queryFn: async ({ pageParam }) => {
      return await trpc.organization.getJobPostings.({
        ...queryInput,
        cursor: pageParam,
      })
    },
    getNextPageParam: (lastPage) => lastPage.meta?.cursor,
    initialPageParam: undefined as string | undefined,
  })

  const deleteJobPostingMutation = useMutation({
    mutationFn: async (input: { id: string }) => {
      return await trpc.organization.deleteJobPosting.mutate(input)
    },
    onSuccess: () => {
      // Invalidate and refetch the job postings query
      queryClient.invalidateQueries({
        queryKey: ['organization.getJobPostings'],
      })
    },
  })

  const pageData = data?.pages.flatMap((page) => page.data)

  useEffect(() => {
    if (inView) {
      fetchNextPage()
    }
  }, [inView, fetchNextPage])

  const handleSelectRow = (jobId: string, selected: boolean) => {
    const newSelected = new Set(selectedRows)
    if (selected) {
      newSelected.add(jobId)
    } else {
      newSelected.delete(jobId)
    }
    setSelectedRows(newSelected)
  }

  const handleSelectAll = (selected: boolean) => {
    if (selected && pageData) {
      setSelectedRows(new Set(pageData.map((job) => job.id)))
    } else {
      setSelectedRows(new Set())
    }
  }

  if (!isFetching && !pageData?.length && !hasFilters) {
    return <EmptyState />
  }

  if (!pageData?.length && hasFilters) {
    return <NoResults />
  }

  return (
    <div className='w-full'>
      <div
        ref={tableScroll.containerRef}
        className='overflow-x-auto overscroll-x-none md:border-l md:border-r border-border scrollbar-hide'>
        <Table>
          <JobTableHeader tableScroll={tableScroll} />
          <TableBody className='border-l-0 border-r-0'>
            {pageData?.map((row) => (
              <JobTableRow
                row={row}
                key={row.id}
                onDelete={deleteJobPostingMutation.mutate}
                isSelected={selectedRows.has(row.id)}
                onSelect={(selected) => handleSelectRow(row.id, selected)}
              />
            ))}
          </TableBody>
        </Table>
      </div>
      <LoadMore ref={ref} hasNextPage={hasNextPage} />
    </div>
  )
}
