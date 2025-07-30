import { Button, type TipTapButtonProps as ButtonProps } from './button'
import { useTiptapEditor } from '../hooks/use-tiptap-editor'
import { cn, isNodeInSchema } from '../lib/tiptap-utils'
import { type Editor, isNodeSelection } from '@tiptap/react'
import { Heading1, Heading2, Heading3, Heading4, Heading5, Heading6 } from 'lucide-react'
import * as React from 'react'

export type Level = 1 | 2 | 3 | 4 | 5 | 6

export interface HeadingButtonProps extends Omit<ButtonProps, 'type'> {
  editor?: Editor | null
  level: Level
  text?: string
  hideWhenUnavailable?: boolean
  showShortcut?: boolean
  /**
   * When true, the component will render without the default focus ring style.
   * This is useful when nesting inside another component that provides its own focus styling, like a DropdownMenuItem.
   * @default false
   */
  unstyled?: boolean
}

const isMac =
  typeof window !== 'undefined' ? /macintosh|mac os x|mac_powerpc/i.test(navigator.userAgent.toLowerCase()) : false

export const ShortcutKey = ({ children }: { children: string }) => {
  const className =
    'inline-flex bg-background items-center justify-center w-5 h-5 p-1 text-[0.625rem] rounded font-semibold leading-none text-foreground shadow-[inset_0px_0px_0px_0.5px_rgb(255_255_255_/_0.02),inset_0px_0.5px_0px_rgb(255_255_255_/_0.30),_inset_0px_0px_0px_1px_rgb(255_255_255_/_0.08),_0px_0px_0px_0.5px_rgb(0_0_0_/_0.24)]'
  if (children === 'Mod' || children === 'Ctrl') {
    return <kbd className={className}>{isMac ? '⌘' : 'Ctrl'}</kbd>
  }
  if (children === 'Shift') {
    return <kbd className={className}>⇧</kbd>
  }
  if (children === 'Alt') {
    return <kbd className={className}>{isMac ? '⌥' : 'Alt'}</kbd>
  }
  return <kbd className={className}>{children}</kbd>
}

export const headingIcons = {
  1: Heading1,
  2: Heading2,
  3: Heading3,
  4: Heading4,
  5: Heading5,
  6: Heading6,
}

export const headingShortcutKeys: Partial<Record<Level, string>> = {
  1: 'Ctrl-Alt-1',
  2: 'Ctrl-Alt-2',
  3: 'Ctrl-Alt-3',
  4: 'Ctrl-Alt-4',
  5: 'Ctrl-Alt-5',
  6: 'Ctrl-Alt-6',
}

export function canToggleHeading(editor: Editor | null, level: Level): boolean {
  if (!editor) return false

  try {
    return editor.can().toggleNode('heading', 'paragraph', { level })
  } catch {
    return false
  }
}

export function isHeadingActive(editor: Editor | null, level: Level): boolean {
  if (!editor) return false
  return editor.isActive('heading', { level })
}

export function toggleHeading(editor: Editor | null, level: Level): void {
  if (!editor) return

  if (editor.isActive('heading', { level })) {
    editor.chain().focus().setNode('paragraph').run()
  } else {
    editor.chain().focus().toggleNode('heading', 'paragraph', { level }).run()
  }
}

export function isHeadingButtonDisabled(editor: Editor | null, level: Level, userDisabled = false): boolean {
  if (!editor) return true
  if (userDisabled) return true
  if (!canToggleHeading(editor, level)) return true
  return false
}

export function shouldShowHeadingButton(params: {
  editor: Editor | null
  level: Level
  hideWhenUnavailable: boolean
  headingInSchema: boolean
}): boolean {
  const { editor, hideWhenUnavailable, headingInSchema } = params

  if (!headingInSchema || !editor) {
    return false
  }

  if (hideWhenUnavailable) {
    if (isNodeSelection(editor.state.selection)) {
      return false
    }
  }

  return true
}

export function getFormattedHeadingName(level: Level): string {
  return `Heading ${level}`
}

export function useHeadingState(editor: Editor | null, level: Level, disabled = false) {
  const headingInSchema = isNodeInSchema('heading', editor)
  const isDisabled = isHeadingButtonDisabled(editor, level, disabled)
  const isActive = isHeadingActive(editor, level)

  const Icon = headingIcons[level]
  const shortcutKey = headingShortcutKeys[level]
  const formattedName = getFormattedHeadingName(level)

  return {
    headingInSchema,
    isDisabled,
    isActive,
    Icon,
    shortcutKey,
    formattedName,
  }
}

export const HeadingButton = React.forwardRef<HTMLButtonElement, HeadingButtonProps>(
  (
    {
      editor: providedEditor,
      level,
      text,
      hideWhenUnavailable = false,
      showShortcut = false,
      className = '',
      disabled,
      onClick,
      children,
      unstyled = false,
      ...buttonProps
    },
    ref
  ) => {
    const editor = useTiptapEditor(providedEditor)

    const { headingInSchema, isDisabled, isActive, Icon, shortcutKey, formattedName } = useHeadingState(
      editor,
      level,
      disabled
    )

    const handleClick = React.useCallback(
      (e: React.MouseEvent<HTMLButtonElement>) => {
        onClick?.(e)

        if (!e.defaultPrevented && !isDisabled && editor) {
          toggleHeading(editor, level)
        }
      },
      [onClick, isDisabled, editor, level]
    )

    const show = React.useMemo(() => {
      return shouldShowHeadingButton({
        editor,
        level,
        hideWhenUnavailable,
        headingInSchema,
      })
    }, [editor, level, hideWhenUnavailable, headingInSchema])

    if (!show || !editor || !editor.isEditable) {
      return null
    }

    const parseShortcut = (shortcut: string): string[] => {
      return shortcut.split('-')
    }

    const content = children || (
      <>
        <span className='flex items-center'>
          <Icon className='tiptap-button-icon' />
          {text && <span className='tiptap-button-text ml-2'>{text}</span>}
        </span>
        {showShortcut && shortcutKey && (
          <span className='flex items-center gap-0.5 ml-2'>
            {parseShortcut(shortcutKey).map((key) => (
              <ShortcutKey key={key}>{key}</ShortcutKey>
            ))}
          </span>
        )}
      </>
    )

    const finalClassName = unstyled ? cn(className, 'focus-visible:after:!opacity-0') : className

    return (
      <Button
        type='button'
        className={finalClassName}
        disabled={isDisabled}
        variant='ghost'
        data-style='ghost'
        data-active-state={isActive ? 'on' : 'off'}
        data-disabled={isDisabled}
        role='button'
        tabIndex={-1}
        aria-label={formattedName}
        aria-pressed={isActive}
        tooltip={formattedName}
        shortcutKeys={shortcutKey}
        onClick={handleClick}
        {...buttonProps}
        ref={ref}>
        {content}
      </Button>
    )
  }
)

HeadingButton.displayName = 'HeadingButton'

export default HeadingButton
