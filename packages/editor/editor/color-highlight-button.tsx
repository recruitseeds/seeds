import type { Node } from '@tiptap/pm/model'
import { type Editor, isNodeSelection } from '@tiptap/react'
import * as React from 'react'

import { cn } from '@seeds/ui'
import { useTiptapEditor } from '../hooks/use-tiptap-editor'
import { findNodePosition, isMarkInSchema } from '../lib/tiptap-utils'
import { Button, type TipTapButtonProps as ButtonProps } from './button'

export const HIGHLIGHT_COLORS = [
  {
    label: 'Default background',
    value: 'var(--tt-bg-color)',
    border: 'var(--tt-bg-color-contrast)',
  },
  {
    label: 'Gray background',
    value: 'var(--tt-color-highlight-gray)',
    border: 'var(--tt-color-highlight-gray-contrast)',
  },
  {
    label: 'Brown background',
    value: 'var(--tt-color-highlight-brown)',
    border: 'var(--tt-color-highlight-brown-contrast)',
  },
  {
    label: 'Orange background',
    value: 'var(--tt-color-highlight-orange)',
    border: 'var(--tt-color-highlight-orange-contrast)',
  },
  {
    label: 'Yellow background',
    value: 'var(--tt-color-highlight-yellow)',
    border: 'var(--tt-color-highlight-yellow-contrast)',
  },
  {
    label: 'Green background',
    value: 'var(--tt-color-highlight-green)',
    border: 'var(--tt-color-highlight-green-contrast)',
  },
  {
    label: 'Blue background',
    value: 'var(--tt-color-highlight-blue)',
    border: 'var(--tt-color-highlight-blue-contrast)',
  },
  {
    label: 'Purple background',
    value: 'var(--tt-color-highlight-purple)',
    border: 'var(--tt-color-highlight-purple-contrast)',
  },
  {
    label: 'Pink background',
    value: 'var(--tt-color-highlight-pink)',
    border: 'var(--tt-color-highlight-pink-contrast)',
  },
  {
    label: 'Red background',
    value: 'var(--tt-color-highlight-red)',
    border: 'var(--tt-color-highlight-red-contrast)',
  },
]

export interface ColorHighlightButtonProps extends Omit<ButtonProps, 'type'> {
  editor?: Editor | null
  node?: Node | null
  nodePos?: number | null
  color: string
  text?: string
  hideWhenUnavailable?: boolean
  onApplied?: (color: string) => void
}

export function canToggleHighlight(editor: Editor | null): boolean {
  if (!editor) return false
  try {
    return editor.can().setMark('highlight')
  } catch {
    return false
  }
}

export function isHighlightActive(editor: Editor | null, color: string): boolean {
  if (!editor) return false
  return editor.isActive('highlight', { color })
}

export function toggleHighlight(
  editor: Editor | null,
  color: string,
  node?: Node | null,
  nodePos?: number | null
): void {
  if (!editor) return
  try {
    const chain = editor.chain().focus()
    if (isEmptyNode(node)) {
      chain.toggleMark('highlight', { color }).run()
    } else if (nodePos !== undefined && nodePos !== null && nodePos !== -1) {
      chain.setNodeSelection(nodePos).toggleMark('highlight', { color }).run()
    } else if (node) {
      const foundPos = findNodePosition({ editor, node })
      if (foundPos) {
        chain.setNodeSelection(foundPos.pos).toggleMark('highlight', { color }).run()
      } else {
        chain.toggleMark('highlight', { color }).run()
      }
    } else {
      chain.toggleMark('highlight', { color }).run()
    }
    editor.chain().setMeta('hideDragHandle', true).run()
  } catch (error) {
    console.error('Failed to apply highlight:', error)
  }
}

export function isColorHighlightButtonDisabled(editor: Editor | null, userDisabled = false): boolean {
  if (!editor || userDisabled) return true
  const isIncompatibleContext =
    editor.isActive('code') || editor.isActive('codeBlock') || editor.isActive('imageUpload')
  return isIncompatibleContext || !canToggleHighlight(editor)
}

export function shouldShowColorHighlightButton(
  editor: Editor | null,
  hideWhenUnavailable: boolean,
  highlightInSchema: boolean
): boolean {
  if (!highlightInSchema || !editor) return false
  if (hideWhenUnavailable) {
    if (isNodeSelection(editor.state.selection) || !canToggleHighlight(editor)) {
      return false
    }
  }
  return true
}

export function useHighlightState(editor: Editor | null, color: string, disabled = false, hideWhenUnavailable = false) {
  const highlightInSchema = isMarkInSchema('highlight', editor)
  const isDisabled = isColorHighlightButtonDisabled(editor, disabled)
  const isActive = isHighlightActive(editor, color)
  const shouldShow = React.useMemo(
    () => shouldShowColorHighlightButton(editor, hideWhenUnavailable, highlightInSchema),
    [editor, hideWhenUnavailable, highlightInSchema]
  )
  return {
    highlightInSchema,
    isDisabled,
    isActive,
    shouldShow,
  }
}

export const ColorHighlightButton = React.forwardRef<HTMLButtonElement, ColorHighlightButtonProps>(
  (
    {
      editor: providedEditor,
      node,
      nodePos,
      color,
      text,
      hideWhenUnavailable = false,
      className = '',
      disabled,
      onClick,
      onApplied,
      children,
      ...buttonProps
    },
    ref
  ) => {
    const editor = useTiptapEditor(providedEditor)
    const { isDisabled, isActive, shouldShow } = useHighlightState(editor, color, disabled, hideWhenUnavailable)

    const handleClick = React.useCallback(
      (e: React.MouseEvent<HTMLButtonElement>) => {
        onClick?.(e)
        if (!e.defaultPrevented && !isDisabled && editor) {
          toggleHighlight(editor, color, node, nodePos)
          onApplied?.(color)
        }
      },
      [color, editor, isDisabled, node, nodePos, onClick, onApplied]
    )

    // For mobile popover content, always show buttons if editor exists
    if (!editor) {
      return null
    }

    if (!shouldShow && editor.isEditable) {
      return null
    }

    return (
      <Button
        type='button'
        className={`${className.trim()} ${
          isActive ? 'bg-secondary hover:bg-secondary-hover active:bg-secondary-active' : ''
        } p-2 rounded-full min-w-[40px] min-h-[40px]`}
        disabled={isDisabled}
        variant='ghost'
        size='icon'
        active={isActive}
        activeClassName='!bg-transparent ring-2 ring-brand ring-offset-1 ring-offset-background'
        aria-label={`${color} highlight color`}
        onClick={handleClick}
        {...buttonProps}
        ref={ref}>
        {children || (
          <>
            <span
              className='relative size-6 rounded-xl transition-transform duration-200 ease-in-out mx-1 flex border min-w-[24px] min-h-[24px]'
              style={{ backgroundColor: color }}>
              <span
                className={cn(
                  'absolute left-0 top-0 h-full w-full rounded-inherit border mix-blend-multiply dark:mix-blend-lighten rounded-full',
                  isActive ? 'brightness-80 dark:brightness-[1.8]' : 'brightness-95 dark:brightness-140'
                )}
                style={{ borderColor: color }}
              />
            </span>
            {text && <span className='flex-grow text-left'>{text}</span>}
          </>
        )}
      </Button>
    )
  }
)

ColorHighlightButton.displayName = 'ColorHighlightButton'

export default ColorHighlightButton
