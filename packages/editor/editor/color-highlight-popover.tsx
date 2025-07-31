import { type Editor, isNodeSelection } from '@tiptap/react'
import { Ban, Highlighter } from 'lucide-react'
import * as React from 'react'
import { useMenuNavigation } from '../hooks/use-menu-navigation'
import { useTiptapEditor } from '../hooks/use-tiptap-editor'
import { isMarkInSchema } from '../lib/tiptap-utils'
import { Button, type TipTapButtonProps as ButtonProps } from './button'
import { canToggleHighlight } from './color-highlight-button'
import { Popover, PopoverContent, PopoverTrigger } from './popover'
import { Separator } from './separator'

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
    value: 'var(--tt-color-highlight-green, #dcfce7)',
    border: 'var(--tt-color-highlight-green-contrast, #16a34a)',
  },
  {
    label: 'Blue',
    value: 'var(--tt-color-highlight-blue, #dbeafe)',
    border: 'var(--tt-color-highlight-blue-contrast, #2563eb)',
  },
  {
    label: 'Red',
    value: 'var(--tt-color-highlight-red, #fee2e2)',
    border: 'var(--tt-color-highlight-red-contrast, #dc2626)',
  },
  {
    label: 'Purple',
    value: 'var(--tt-color-highlight-purple, #f3e8ff)',
    border: 'var(--tt-color-highlight-purple-contrast, #9333ea)',
  },
  {
    label: 'Yellow',
    value: 'var(--tt-color-highlight-yellow, #fef3c7)',
    border: 'var(--tt-color-highlight-yellow-contrast, #d97706)',
  },
]

export const ColorHighlightPopoverButton = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, children, active, ...props }, ref) => (
    <Button
      type='button'
      className={`${className || ''} ${active ? 'bg-important hover:bg-important-hover active:bg-important-active' : ''}`}
      variant='ghost'
      size='icon'
      role='button'
      tabIndex={-1}
      aria-label='Highlight text'
      tooltip='Highlight'
      ref={ref}
      {...props}>
      {children || <Highlighter className={active ? 'text-background dark:text-foreground' : ''} />}
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
    <div
      ref={containerRef}
      className='flex items-center gap-1 sm:gap-2 outline-none bg-background border border-border rounded-xl p-2 h-12 max-h-12'>
      <div className='flex flex-row items-center gap-1 flex-nowrap overflow-x-auto'>
        {colors.map((color, index) => {
          const isActive = editor?.isActive('highlight', { color: color.value }) ?? false

          return (
            <Button
              key={color.value}
              type='button'
              className='flex-shrink-0 p-0 rounded-full w-8 h-8 sm:w-10 sm:h-10 hover:bg-transparent'
              style={isActive ? ({ '--tw-ring-color': color.border || color.value } as React.CSSProperties) : {}}
              variant='ghost'
              size='icon'
              aria-label={`${color.label} highlight color`}
              tabIndex={index === selectedIndex ? 0 : -1}
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()

                // Ensure we can toggle highlight
                if (!editor || !canToggleHighlight(editor)) return

                if (isActive) {
                  editor.chain().focus().unsetMark('highlight').run()
                } else {
                  editor.chain().focus().setMark('highlight', { color: color.value }).run()
                }
                onClose?.()
              }}>
              <span
                className='w-6 h-6 rounded-full border'
                style={{
                  backgroundColor: color.value,
                  borderColor: color.border || color.value,
                }}
              />
            </Button>
          )
        })}
      </div>
      <Separator orientation='vertical' className='mx-1 h-6' />
      <div className='flex flex-row items-center gap-1'>
        <Button
          onClick={removeHighlight}
          aria-label='Remove highlight'
          tabIndex={selectedIndex === colors.length ? 0 : -1}
          type='button'
          role='menuitem'
          variant='ghost'
          size='icon'
          className='h-8 w-8'
          active={selectedIndex === colors.length}>
          <Ban className='h-4 w-4' />
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

      // Check if we can actually toggle highlight
      if (!canToggleHighlight(editor)) {
        isDisabled = true
      }

      setIsDisabled(isDisabled)
    }

    editor.on('selectionUpdate', updateIsDisabled)
    editor.on('update', updateIsDisabled)
    updateIsDisabled() // Initial check

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
      <PopoverContent aria-label='Highlight colors' className='z-[9999] p-0 w-auto' align='start' sideOffset={5}>
        <ColorHighlightPopoverContent editor={editor} colors={colors} onClose={() => setIsOpen(false)} />
      </PopoverContent>
    </Popover>
  )
}

export default ColorHighlightPopover
