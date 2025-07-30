import * as React from 'react'

interface CursorVisibilityOptions {
  rootElement?: HTMLElement | null
  offset?: number
}

/**
 * Hook to track cursor visibility and position
 */
export function useCursorVisibility({ rootElement, offset = 0 }: CursorVisibilityOptions = {}) {
  const [bodyRect, setBodyRect] = React.useState({ y: 0, height: 0 })

  React.useEffect(() => {
    if (!rootElement) return

    const updateBodyRect = () => {
      const rect = rootElement.getBoundingClientRect()
      setBodyRect({ y: rect.y + offset, height: rect.height })
    }

    updateBodyRect()
    window.addEventListener('resize', updateBodyRect)
    window.addEventListener('scroll', updateBodyRect)

    return () => {
      window.removeEventListener('resize', updateBodyRect)
      window.removeEventListener('scroll', updateBodyRect)
    }
  }, [rootElement, offset])

  return { bodyRect }
}