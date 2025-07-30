import { type Editor, isNodeSelection } from '@tiptap/react'
import * as React from 'react'

import { useMenuNavigation } from '../hooks/use-menu-navigation'
import { useTiptapEditor } from '../hooks/use-tiptap-editor'

import { Ban, Highlighter } from 'lucide-react'

import { isMarkInSchema } from '../lib/tiptap-utils'

import { Button, type TipTapButtonProps as ButtonProps } from './button'
import { Popover, PopoverContent, PopoverTrigger } from './popover'
import { Separator } from './separator'

import { ColorHighlightButton, canToggleHighlight } from './color-highlight-button'

export interface ColorHighlightPopoverColor {
  label: string
  value: string
  border?: string
}

export interface ColorHighlightPopoverContentProps {
  editor?: Editor | null
  colors?: ColorHighlightPopoverColor[]
  onClose?: () => void
}

export interface ColorHighlightPopoverProps extends Omit<ButtonProps, 'type'> {
  editor?: Editor | null
  colors?: ColorHighlightPopoverColor[]
  hideWhenUnavailable?: boolean
}

export const DEFAULT_HIGHLIGHT_COLORS: ColorHighlightPopoverColor[] = [
  {
    label: 'Green',
    value: 'var(--tt-color-highlight-green)',
    border: 'var(--tt-color-highlight-green-contrast)',
  },
  {
    label: 'Blue',
    value: 'var(--tt-color-highlight-blue)',
    border: 'var(--tt-color-highlight-blue-contrast)',
  },
  {
    label: 'Red',
    value: 'var(--tt-color-highlight-red)',
    border: 'var(--tt-color-highlight-red-contrast)',
  },
  {
    label: 'Purple',
    value: 'var(--tt-color-highlight-purple)',
    border: 'var(--tt-color-highlight-purple-contrast)',
  },
  {
    label: 'Yellow',
    value: 'var(--tt-color-highlight-yellow)',
    border: 'var(--tt-color-highlight-yellow-contrast)',
  },
]

export const ColorHighlightPopoverButton = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, children, ...props }, ref) => (
    <Button
      type='button'
      className={className}
      variant='ghost'
      size='icon'
      role='button'
      tabIndex={-1}
      aria-label='Highlight text'
      tooltip='Highlight'
      ref={ref}
      {...props}>
      {children || <Highlighter />}
    </Button>
  )
)

ColorHighlightPopoverButton.displayName = 'ColorHighlightPopoverButton'

export function ColorHighlightPopoverContent({
  editor: providedEditor,
  colors = DEFAULT_HIGHLIGHT_COLORS,
  onClose,
}: ColorHighlightPopoverContentProps) {
  const editor = useTiptapEditor(providedEditor)
  const containerRef = React.useRef<HTMLDivElement>(null)

  const removeHighlight = React.useCallback(() => {
    if (!editor) return
    editor.chain().focus().unsetMark('highlight').run()
    onClose?.()
  }, [editor, onClose])

  const menuItems = React.useMemo(() => [...colors, { label: 'Remove highlight', value: 'none' }], [colors])

  const { selectedIndex } = useMenuNavigation({
    items: menuItems,
    isOpen: true,
  })

  return (
    <div ref={containerRef} className='flex items-center gap-1 outline-none'>
      <div className='flex flex-row items-center gap-0.5'>
        {colors.map((color, index) => (
          <ColorHighlightButton
            key={color.value}
            editor={editor}
            color={color.value}
            aria-label={`${color.label} highlight color`}
            tabIndex={index === selectedIndex ? 0 : -1}
            active={selectedIndex === index}
            onClick={onClose}
          />
        ))}
      </div>

      <Separator />

      <div className='flex flex-col items-center gap-0.5'>
        <Button
          onClick={removeHighlight}
          aria-label='Remove highlight'
          tabIndex={selectedIndex === colors.length ? 0 : -1}
          type='button'
          role='menuitem'
          variant='ghost'
          active={selectedIndex === colors.length}>
          <Ban />
        </Button>
      </div>
    </div>
  )
}

export function ColorHighlightPopover({
  editor: providedEditor,
  colors = DEFAULT_HIGHLIGHT_COLORS,
  hideWhenUnavailable = false,
  ...props
}: ColorHighlightPopoverProps) {
  const editor = useTiptapEditor(providedEditor)
  const [isOpen, setIsOpen] = React.useState(false)
  const [isDisabled, setIsDisabled] = React.useState(false)

  const markAvailable = isMarkInSchema('highlight', editor)

  React.useEffect(() => {
    if (!editor) return

    const updateIsDisabled = () => {
      let isDisabled = false

      if (!markAvailable || !editor) {
        isDisabled = true
      }

      const isInCompatibleContext =
        editor.isActive('code') || editor.isActive('codeBlock') || editor.isActive('imageUpload')

      if (isInCompatibleContext) {
        isDisabled = true
      }

      setIsDisabled(isDisabled)
    }

    editor.on('selectionUpdate', updateIsDisabled)
    editor.on('update', updateIsDisabled)

    return () => {
      editor.off('selectionUpdate', updateIsDisabled)
      editor.off('update', updateIsDisabled)
    }
  }, [editor, markAvailable])

  const isActive = editor?.isActive('highlight') ?? false

  const shouldShow = React.useMemo(() => {
    if (!hideWhenUnavailable || !editor) return true

    return !(isNodeSelection(editor.state.selection) || !canToggleHighlight(editor))
  }, [hideWhenUnavailable, editor])

  if (!shouldShow || !editor || !editor.isEditable) {
    return null
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <ColorHighlightPopoverButton disabled={isDisabled} active={isActive} aria-pressed={isActive} {...props} />
      </PopoverTrigger>

      <PopoverContent aria-label='Highlight colors'>
        <ColorHighlightPopoverContent editor={editor} colors={colors} onClose={() => setIsOpen(false)} />
      </PopoverContent>
    </Popover>
  )
}

export default ColorHighlightPopover
