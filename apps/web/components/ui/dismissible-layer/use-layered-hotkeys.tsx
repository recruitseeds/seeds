import { DependencyList } from 'react'
import { useShortcut } from '@shopify/react-shortcuts'

import { Options, useHotkeys } from 'react-hotkeys-hook'
import { HotkeyCallback, Keys } from 'react-hotkeys-hook/dist/types'

import { useIsTopLayer } from '.'

export interface LayeredHotkeysProps {
  keys: Keys
  callback: HotkeyCallback
  options?: Options & { repeat?: boolean; skipEscapeWhenDisabled?: boolean }
  dependencies?: DependencyList
}

/**
 * Wraps useHotkeys and automatically disables the hotkey if the layer is not the top layer.
 * Use this hook for hotkeys that should only work when the view layer is open, e.g. list navigation.
 * Do not use it for global hotkeys that should work regardless of the layer.
 */
export function useLayeredHotkeys({
  keys,
  callback,
  options: { repeat, skipEscapeWhenDisabled, ...options } = {},
  dependencies,
}: LayeredHotkeysProps) {
  const isTopLayer = useIsTopLayer()

  useHotkeys(
    keys,
    (keyboardEvent, hotkeysEvent) => {
      /**
       * Ignore repeated keydown events by default. This helps prevent re-submitting forms
       * and aggresively re-running callbacks for users with short key repeat delay settings.
       *
       * @see https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/repeat
       */
      if (!repeat && keyboardEvent.repeat) return

      
      
      
      if (
        skipEscapeWhenDisabled &&
        keyboardEvent.key === 'Escape' &&
        keyboardEvent.target &&
        keyboardEvent.target instanceof HTMLElement &&
        keyboardEvent.target.closest('[disable-escape-layered-hotkeys]')
      ) {
        return
      }

      callback(keyboardEvent, hotkeysEvent)
    },
    {
      ...options,
      
      
      enabled: isTopLayer ? options.enabled : false,
    },
    dependencies
  )
}

export function useOrderedLayeredHotkeys({
  keys,
  callback,
  options = {},
}: {
  keys: Parameters<typeof useShortcut>[0]
  callback: Parameters<typeof useShortcut>[1]
  options?: Parameters<typeof useShortcut>[2]
}) {
  const isTopLayer = useIsTopLayer()

  
  
  if (!isTopLayer) {
    options.ignoreInput = false
  }

  useShortcut(keys, callback, options)
}
