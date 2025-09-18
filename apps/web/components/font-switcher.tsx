'use client'

import { useEffect } from 'react'
import { useTRPC } from '@/trpc/client'
import { useQuery } from '@tanstack/react-query'

/**
 * Real-time font switcher for settings page
 * Only handles immediate updates when font preference changes
 */
export function FontSwitcher() {
  const trpc = useTRPC()
  const { data: settings } = useQuery(trpc.organization.getUserSettings.queryOptions())

  useEffect(() => {
    if (settings) {
      const appearance = settings.appearance as Record<string, unknown>
      const selectedFont = appearance?.font as string || 'inter'
      
      
      localStorage.setItem('font-preference', selectedFont)
      
      
      const fontClass = getFontClassName(selectedFont)
      
      
      document.body.className = document.body.className
        .replace(/font-\w+/g, '') 
        .replace(/\s+/g, ' ') 
        .trim()
      
      document.body.classList.add(fontClass)
    }
  }, [settings])

  return null
}

function getFontClassName(font: string): string {
  switch (font) {
    case 'geist':
      return 'font-geist'
    case 'poppins':
      return 'font-poppins'
    case 'roboto':
      return 'font-roboto'
    case 'opensans':
      return 'font-opensans'
    case 'inter':
    default:
      return 'font-inter'
  }
}