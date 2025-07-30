'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback } from 'react'

export function useJobParams() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const setParams = useCallback(
    (params: { create?: boolean; update?: boolean; jobId?: string | null }) => {
      const urlParams = new URLSearchParams(searchParams.toString())

      if (params.create) {
        urlParams.set('create', 'true')
      } else {
        urlParams.delete('create')
      }

      if (params.update && params.jobId) {
        urlParams.set('update', 'true')
        urlParams.set('jobId', params.jobId)
      } else {
        urlParams.delete('update')
        urlParams.delete('jobId')
      }

      router.push(`?${urlParams.toString()}`)
    },
    [router, searchParams]
  )

  return {
    setParams,
  }
}
