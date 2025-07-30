import * as React from 'react'

export interface UseMenuNavigationOptions {
  items: any[]
  isOpen?: boolean
  loop?: boolean
  initialIndex?: number
}

export function useMenuNavigation({
  items,
  isOpen = true,
  loop = true,
  initialIndex = -1,
}: UseMenuNavigationOptions) {
  const [selectedIndex, setSelectedIndex] = React.useState(initialIndex)

  React.useEffect(() => {
    if (!isOpen) {
      setSelectedIndex(initialIndex)
    }
  }, [isOpen, initialIndex])

  React.useEffect(() => {
    if (!isOpen || items.length === 0) return

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault()
          setSelectedIndex((prev) => {
            if (prev >= items.length - 1) {
              return loop ? 0 : prev
            }
            return prev + 1
          })
          break
        case 'ArrowUp':
          e.preventDefault()
          setSelectedIndex((prev) => {
            if (prev <= 0) {
              return loop ? items.length - 1 : 0
            }
            return prev - 1
          })
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, items.length, loop])

  return {
    selectedIndex,
    setSelectedIndex,
  }
}