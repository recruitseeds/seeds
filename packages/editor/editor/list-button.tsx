import { type Editor, isNodeSelection } from '@tiptap/react'
import * as React from 'react'

import { useTiptapEditor } from '../hooks/use-tiptap-editor'

import { ListIcon, ListOrderedIcon, ListTodoIcon } from 'lucide-react'

import { cn, isNodeInSchema } from '../lib/tiptap-utils'

import { Button, type TipTapButtonProps as ButtonProps } from './button'

export type ListType = 'bulletList' | 'orderedList' | 'taskList'

export interface ListOption {
  label: string
  type: ListType
  icon: React.ElementType
}

export interface ListButtonProps extends Omit<ButtonProps, 'type'> {
  editor?: Editor | null
  type: ListType
  text?: string
  hideWhenUnavailable?: boolean
  showShortcut?: boolean
  unstyled?: boolean
}

const isMac =
  typeof window !== 'undefined' ? /macintosh|mac os x|mac_powerpc/i.test(navigator.userAgent.toLowerCase()) : false

const ShortcutKey = ({ children }: { children: string }) => {
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

export const listOptions: ListOption[] = [
  {
    label: 'Bullet List',
    type: 'bulletList',
    icon: ListIcon,
  },
  {
    label: 'Ordered List',
    type: 'orderedList',
    icon: ListOrderedIcon,
  },
  {
    label: 'Task List',
    type: 'taskList',
    icon: ListTodoIcon,
  },
]

export const listShortcutKeys: Record<ListType, string> = {
  bulletList: 'Ctrl-Shift-8',
  orderedList: 'Ctrl-Shift-7',
  taskList: 'Ctrl-Shift-9',
}

export function canToggleList(editor: Editor | null, type: ListType): boolean {
  if (!editor) {
    return false
  }

  switch (type) {
    case 'bulletList':
      return editor.can().toggleBulletList()
    case 'orderedList':
      return editor.can().toggleOrderedList()
    case 'taskList':
      return editor.can().toggleList('taskList', 'taskItem')
    default:
      return false
  }
}

export function isListActive(editor: Editor | null, type: ListType): boolean {
  if (!editor) return false

  switch (type) {
    case 'bulletList':
      return editor.isActive('bulletList')
    case 'orderedList':
      return editor.isActive('orderedList')
    case 'taskList':
      return editor.isActive('taskList')
    default:
      return false
  }
}

export function toggleList(editor: Editor | null, type: ListType): void {
  if (!editor) return

  switch (type) {
    case 'bulletList':
      editor.chain().focus().toggleBulletList().run()
      break
    case 'orderedList':
      editor.chain().focus().toggleOrderedList().run()
      break
    case 'taskList':
      editor.chain().focus().toggleList('taskList', 'taskItem').run()
      break
  }
}

export function getListOption(type: ListType): ListOption | undefined {
  return listOptions.find((option) => option.type === type)
}

export function shouldShowListButton(params: {
  editor: Editor | null
  type: ListType
  hideWhenUnavailable: boolean
  listInSchema: boolean
}): boolean {
  const { editor, type, hideWhenUnavailable, listInSchema } = params

  if (!listInSchema || !editor) {
    return false
  }

  if (hideWhenUnavailable) {
    if (isNodeSelection(editor.state.selection) || !canToggleList(editor, type)) {
      return false
    }
  }

  return true
}

export function useListState(editor: Editor | null, type: ListType) {
  const listInSchema = isNodeInSchema(type, editor)
  const listOption = getListOption(type)
  const isActive = isListActive(editor, type)
  const shortcutKey = listShortcutKeys[type]

  return {
    listInSchema,
    listOption,
    isActive,
    shortcutKey,
  }
}

export const ListButton = React.forwardRef<HTMLButtonElement, ListButtonProps>(
  (
    {
      editor: providedEditor,
      type,
      hideWhenUnavailable = false,
      showShortcut = false,
      className = '',
      onClick,
      text,
      children,
      unstyled = false,
      ...buttonProps
    },
    ref
  ) => {
    const editor = useTiptapEditor(providedEditor)
    const { listInSchema, listOption, isActive, shortcutKey } = useListState(editor, type)

    const Icon = listOption?.icon || ListIcon

    const handleClick = React.useCallback(
      (e: React.MouseEvent<HTMLButtonElement>) => {
        onClick?.(e)

        if (!e.defaultPrevented && editor) {
          toggleList(editor, type)
        }
      },
      [onClick, editor, type]
    )

    const show = React.useMemo(() => {
      return shouldShowListButton({
        editor,
        type,
        hideWhenUnavailable,
        listInSchema,
      })
    }, [editor, type, hideWhenUnavailable, listInSchema])

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
        data-style='ghost'
        variant='ghost'
        data-active-state={isActive ? 'on' : 'off'}
        role='button'
        tabIndex={-1}
        aria-label={listOption?.label || type}
        aria-pressed={isActive}
        tooltip={listOption?.label || type}
        shortcutKeys={shortcutKey}
        onClick={handleClick}
        {...buttonProps}
        ref={ref}>
        {content}
      </Button>
    )
  }
)

ListButton.displayName = 'ListButton'

export default ListButton
