import { Button as CoreButton, type ButtonProps as CoreButtonProps } from '@seeds/ui/button'
import * as React from 'react'
import { Tooltip, TooltipContent, TooltipTrigger } from './tooltip'

type PlatformShortcuts = Record<string, string>

export const MAC_SYMBOLS: PlatformShortcuts = {
  ctrl: '⌘',
  alt: '⌥',
  shift: '⇧',
} as const

export const formatShortcutKey = (key: string, isMac: boolean) => {
  if (isMac) {
    const lowerKey = key.toLowerCase()
    return MAC_SYMBOLS[lowerKey] || key.toUpperCase()
  }
  return key.charAt(0).toUpperCase() + key.slice(1)
}

export const parseShortcutKeys = (shortcutKeys: string | undefined, isMac: boolean) => {
  if (!shortcutKeys) return []

  return shortcutKeys
    .split('-')
    .map((key) => key.trim())
    .map((key) => formatShortcutKey(key, isMac))
}

export const ShortcutDisplay: React.FC<{ shortcuts: string[] }> = ({ shortcuts }) => {
  if (shortcuts.length === 0) return null

  const elements: React.ReactNode[] = []

  shortcuts.forEach((key, index) => {
    if (index > 0) {
      elements.push(
        <kbd
          key={`separator-${key}`}
          className='inline-block text-center align-baseline font-sans capitalize text-muted-foreground'>
          +
        </kbd>
      )
    }
    elements.push(
      <kbd
        key={`key-${key}`}
        className='inline-flex bg-foreground items-center justify-center w-5 h-5 p-1 text-[0.625rem] rounded font-semibold leading-none text-background shadow-[inset_0px_0px_0px_0.5px_rgb(255_255_255_/_0.02),inset_0px_0.5px_0px_rgb(255_255_255_/_0.30),_inset_0px_0px_0px_1px_rgb(255_255_255_/_0.08),_0px_0px_0px_0.5px_rgb(0_0_0_/_0.24)]'>
        {key}
      </kbd>
    )
  })

  return <div className='flex items-center gap-0.5'>{elements}</div>
}

export interface TipTapButtonProps extends CoreButtonProps {
  showTooltip?: boolean
  tooltip?: React.ReactNode
  shortcutKeys?: string
}

export const Button = React.forwardRef<HTMLButtonElement, TipTapButtonProps>(
  ({ children, tooltip, showTooltip = true, shortcutKeys, ...props }, ref) => {
    const isMac = React.useMemo(
      () => typeof navigator !== 'undefined' && navigator.platform.toLowerCase().includes('mac'),
      []
    )

    const shortcuts = React.useMemo(() => parseShortcutKeys(shortcutKeys, isMac), [shortcutKeys, isMac])

    if (!tooltip || !showTooltip) {
      return (
        <CoreButton ref={ref} {...props}>
          {children}
        </CoreButton>
      )
    }

    return (
      <Tooltip delay={200}>
        <CoreButton asChild {...props}>
          <TooltipTrigger ref={ref}>{children}</TooltipTrigger>
        </CoreButton>
        <TooltipContent>
          <div className='flex items-center gap-2'>
            {tooltip}
            <ShortcutDisplay shortcuts={shortcuts} />
          </div>
        </TooltipContent>
      </Tooltip>
    )
  }
)

Button.displayName = 'Button'

export default Button
