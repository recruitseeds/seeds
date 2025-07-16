'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback } from 'react'

type SortColumn = 'title' | 'department' | 'status' | 'created_at' | 'job_type' | 'experience_level'
type SortDirection = 'asc' | 'desc'
type SortParams = [SortColumn, SortDirection] | null

export function useSortParams() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const sortParam = searchParams.get('sort')
  const sort: SortParams = sortParam ? (sortParam.split(',') as [SortColumn, SortDirection]) : null

  const params = {
    sort,
  }

  const setParams = useCallback(
    (newParams: { sort: SortParams }) => {
      const urlParams = new URLSearchParams(searchParams.toString())

      if (newParams.sort) {
        urlParams.set('sort', newParams.sort.join(','))
      } else {
        urlParams.delete('sort')
      }

      router.push(`?${urlParams.toString()}`)
    },
    [router, searchParams]
  )

  return {
    params,
    setParams,
  }
}
