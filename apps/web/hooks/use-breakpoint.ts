import { useIsomorphicLayoutEffect } from 'framer-motion'
import { useState } from 'react'

const BREAKPOINTS = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
}

function matchesBreakpoint(
  size: keyof typeof BREAKPOINTS,
  minMax: 'max' | 'min'
) {
  if (typeof window === 'undefined') {
    return false
  }

  if (minMax === 'max') {
    return window.innerWidth <= BREAKPOINTS[size]
  } else {
    return window.innerWidth >= BREAKPOINTS[size]
  }
}

export function useBreakpoint(
  size: keyof typeof BREAKPOINTS,
  minMax: 'min' | 'max' = 'min'
) {
  const [isBreakpoint, setIsBreakpoint] = useState(() =>
    matchesBreakpoint(size, minMax)
  )

  useIsomorphicLayoutEffect(() => {
    const handleResize = () => {
      setIsBreakpoint(matchesBreakpoint(size, minMax))
    }

    window.addEventListener('resize', handleResize)
    handleResize() 

    return () => {
      window.removeEventListener('resize', handleResize)
    }
  }, [size, minMax])

  return isBreakpoint
}
