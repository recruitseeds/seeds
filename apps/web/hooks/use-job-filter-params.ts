'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback } from 'react'

type JobStatus = 'draft' | 'published' | 'archived' | 'closed'
type JobType = 'full_time' | 'part_time' | 'contract' | 'internship' | 'temporary'

export interface JobFilter {
  q?: string | null
  status?: JobStatus | null
  department?: string | null
  job_type?: JobType | null
}

export function useJobFilterParams() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const filter: JobFilter = {
    q: searchParams.get('q'),
    status: searchParams.get('status') as JobStatus | null,
    department: searchParams.get('department'),
    job_type: searchParams.get('job_type') as JobType | null,
  }

  const hasFilters = Object.values(filter).some((value) => Boolean(value))

  const setFilter = useCallback(
    (newFilter: JobFilter | null) => {
      const params = new URLSearchParams(searchParams.toString())

      if (!newFilter) {
        
        params.delete('q')
        params.delete('status')
        params.delete('department')
        params.delete('job_type')
      } else {
        
        Object.entries(newFilter).forEach(([key, value]) => {
          if (value) {
            params.set(key, value)
          } else {
            params.delete(key)
          }
        })
      }

      router.push(`?${params.toString()}`)
    },
    [router, searchParams]
  )

  const updateFilter = useCallback(
    (key: keyof JobFilter, value: string | null) => {
      setFilter({ ...filter, [key]: value })
    },
    [filter, setFilter]
  )

  return {
    filter,
    hasFilters,
    setFilter,
    updateFilter,
  }
}
