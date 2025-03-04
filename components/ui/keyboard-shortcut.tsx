import { useMemo } from 'react'
import { isMacOs, isMobile } from 'react-device-detect'

import { cn } from '@/lib/utils'
import { UIText } from './text'

export function getShortcutKeySymbol(key: string) {
  switch (key) {
    case 'mod':
    case 'meta':
      if (isMacOs) {
        return { text: '⌘', emoji: true }
      } else {
        return { text: 'Ctrl' }
      }
    case 'alt':
      if (isMacOs) {
        return { text: '⌥', emoji: true }
      } else {
        return { text: 'Alt' }
      }
    case 'shift':
      return { text: '⇧', emoji: true }
    case 'comma':
      return { text: ',' }
    case 'return':
    case 'enter':
      return { text: 'Enter' }
    case 'backspace':
      return { text: '⌫', emoji: true }
    default:
      return { text: key.trim().toUpperCase() }
  }
}

export function KeyboardShortcut({
  shortcut,
}: {
  shortcut: string[] | string
}) {
  const components = useMemo(() => {
    let parts: string[]

    if (typeof shortcut === 'string') {
      if (shortcut !== '+') {
        parts = shortcut.split('+')
      } else {
        parts = ['+']
      }
    } else {
      parts = shortcut
    }

    return parts.map((key) => {
      const { text, emoji } = getShortcutKeySymbol(key)

      return (
        <UIText
          secondary
          key={key}
          size='text-xs'
          weight='font-semibold'
          className={cn(
            {
              'font-[emoji]': emoji,
              'font-mono': !emoji,
            },
            'text-foreground'
          )}>
          {text}
        </UIText>
      )
    })
  }, [shortcut])

  if (isMobile) return null

  return (
    <div className='text-foreground flex items-baseline justify-center gap-1 rounded bg-secondary px-1.5 py-0.5 align-middle text-[10px] dark:shadow-[inset_0px_1px_0px_rgb(255_255_255_/_0.04),_inset_0px_0px_0px_1px_rgb(255_255_255_/_0.02),_0px_1px_2px_rgb(0_0_0_/_0.4),_0px_2px_4px_rgb(0_0_0_/_0.08),_0px_0px_0px_0.5px_rgb(0_0_0_/_0.24)] shadow-[inset_0px_0px_0px_0.5px_rgb(255_255_255_/_0.02),inset_0px_0.5px_0px_rgb(255_255_255_/_0.04),_inset_0px_0px_0px_1px_rgb(255_255_255_/_0.02),_0px_0px_0px_0.5px_rgb(0_0_0_/_0.24)]'>
      {components}
    </div>
  )
}
