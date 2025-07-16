// hooks/use-table-scroll.ts
'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useHotkeys } from 'react-hotkeys-hook'

interface UseTableScrollOptions {
  scrollAmount?: number
  useColumnWidths?: boolean
  startFromColumn?: number
}

export function useTableScroll(options: UseTableScrollOptions = {}) {
  const { scrollAmount = 120, useColumnWidths = false, startFromColumn = 0 } = options
  const containerRef = useRef<HTMLDivElement>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)
  const [isScrollable, setIsScrollable] = useState(false)
  const currentColumnIndex = useRef(startFromColumn)
  const isScrollingProgrammatically = useRef(false)
  const scrollTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined)

  const getColumnPositions = useCallback(() => {
    const container = containerRef.current
    if (!container) return []

    const table = container.querySelector('table')
    if (!table) return []

    const headerRow = table.querySelector('thead tr')
    if (!headerRow) return []

    const columns = Array.from(headerRow.querySelectorAll('th'))
    const positions: number[] = []
    let currentPosition = 0

    for (const column of columns) {
      positions.push(currentPosition)
      currentPosition += (column as HTMLElement).offsetWidth
    }

    return positions
  }, [])

  const checkScrollability = useCallback(() => {
    const container = containerRef.current
    if (!container) return

    const { scrollWidth, clientWidth, scrollLeft } = container
    const isScrollableTable = scrollWidth > clientWidth

    setIsScrollable(isScrollableTable)
    setCanScrollLeft(scrollLeft > 0)
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 1)
  }, [])

  const scrollLeft = useCallback(() => {
    const container = containerRef.current
    if (!container) return

    container.scrollBy({
      left: -scrollAmount,
      behavior: 'smooth',
    })
  }, [scrollAmount])

  const scrollRight = useCallback(() => {
    const container = containerRef.current
    if (!container) return

    container.scrollBy({
      left: scrollAmount,
      behavior: 'smooth',
    })
  }, [scrollAmount])

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const handleScroll = () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current)
      }

      scrollTimeoutRef.current = setTimeout(() => {
        checkScrollability()
      }, 100)
    }

    const handleResize = () => {
      checkScrollability()
    }

    container.addEventListener('scroll', handleScroll)
    window.addEventListener('resize', handleResize)

    const resizeObserver = new ResizeObserver(() => {
      checkScrollability()
    })

    resizeObserver.observe(container)
    checkScrollability()

    return () => {
      container.removeEventListener('scroll', handleScroll)
      window.removeEventListener('resize', handleResize)
      resizeObserver.disconnect()

      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current)
      }
    }
  }, [checkScrollability])

  useHotkeys(
    'ArrowLeft, ArrowRight',
    (event) => {
      if (event.key === 'ArrowLeft' && canScrollLeft) {
        scrollLeft()
      }
      if (event.key === 'ArrowRight' && canScrollRight) {
        scrollRight()
      }
    },
    {
      enabled: isScrollable,
      preventDefault: true,
    }
  )

  return {
    containerRef,
    canScrollLeft,
    canScrollRight,
    isScrollable,
    scrollLeft,
    scrollRight,
  }
}
