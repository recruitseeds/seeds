'use client'

import { Tooltip as SeedsTooltip } from '@seeds/ui/tooltip'
import React from 'react'

interface TippyProps {
  children: React.ReactNode
  label?: string
  shortcut?: string
  sideOffset?: number
}

export function Tooltip({ children, label, shortcut, sideOffset }: TippyProps) {
  return (
    <SeedsTooltip title={label} shortcut={shortcut ? [shortcut] : undefined} delayDuration={500}>
      {children}
    </SeedsTooltip>
  )
}