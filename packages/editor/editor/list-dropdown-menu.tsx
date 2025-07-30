import { type Editor, isNodeSelection } from '@tiptap/react'
import * as React from 'react'

import { useTiptapEditor } from '../hooks/use-tiptap-editor'

import { ChevronDown, ListIcon } from 'lucide-react'

import { isNodeInSchema } from '../lib/tiptap-utils'

import { ListButton, type ListType, canToggleList, isListActive, listOptions } from './list-button'

import { Button, type TipTapButtonProps as ButtonProps } from './button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './dropdown-menu'

export interface ListDropdownMenuProps extends Omit<ButtonProps, 'type'> {
  editor?: Editor
  types?: ListType[]
  hideWhenUnavailable?: boolean
  onOpenChange?: (isOpen: boolean) => void
}

export function canToggleAnyList(editor: Editor | null, listTypes: ListType[]): boolean {
  if (!editor) return false
  return listTypes.some((type) => canToggleList(editor, type))
}

export function isAnyListActive(editor: Editor | null, listTypes: ListType[]): boolean {
  if (!editor) return false
  return listTypes.some((type) => isListActive(editor, type))
}

export function getFilteredListOptions(availableTypes: ListType[]): typeof listOptions {
  return listOptions.filter((option) => !option.type || availableTypes.includes(option.type))
}

export function shouldShowListDropdown(params: {
  editor: Editor | null
  listTypes: ListType[]
  hideWhenUnavailable: boolean
  listInSchema: boolean
  canToggleAny: boolean
}): boolean {
  const { editor, hideWhenUnavailable, listInSchema, canToggleAny } = params

  if (!listInSchema || !editor) {
    return false
  }

  if (hideWhenUnavailable) {
    if (isNodeSelection(editor.state.selection) || !canToggleAny) {
      return false
    }
  }

  return true
}

export function useListDropdownState(editor: Editor | null, availableTypes: ListType[]) {
  const [isOpen, setIsOpen] = React.useState(false)

  const listInSchema = availableTypes.some((type) => isNodeInSchema(type, editor))

  const filteredLists = React.useMemo(() => getFilteredListOptions(availableTypes), [availableTypes])

  const canToggleAny = canToggleAnyList(editor, availableTypes)
  const isAnyActive = isAnyListActive(editor, availableTypes)

  const handleOpenChange = React.useCallback((open: boolean, callback?: (isOpen: boolean) => void) => {
    setIsOpen(open)
    callback?.(open)
  }, [])

  return {
    isOpen,
    setIsOpen,
    listInSchema,
    filteredLists,
    canToggleAny,
    isAnyActive,
    handleOpenChange,
  }
}

export function useActiveListIcon(editor: Editor | null, filteredLists: typeof listOptions) {
  return React.useCallback(() => {
    const activeOption = filteredLists.find((option) => isListActive(editor, option.type))

    return activeOption ? (
      <activeOption.icon className='tiptap-button-icon' />
    ) : (
      <ListIcon className='tiptap-button-icon' />
    )
  }, [editor, filteredLists])
}

export function ListDropdownMenu({
  editor: providedEditor,
  types = ['bulletList', 'orderedList', 'taskList'],
  hideWhenUnavailable = false,
  onOpenChange,
  ...props
}: ListDropdownMenuProps) {
  const editor = useTiptapEditor(providedEditor)

  const { isOpen, listInSchema, filteredLists, canToggleAny, isAnyActive, handleOpenChange } = useListDropdownState(
    editor,
    types
  )

  const getActiveIcon = useActiveListIcon(editor, filteredLists)

  const show = React.useMemo(() => {
    return shouldShowListDropdown({
      editor,
      listTypes: types,
      hideWhenUnavailable,
      listInSchema,
      canToggleAny,
    })
  }, [editor, types, hideWhenUnavailable, listInSchema, canToggleAny])

  const handleOnOpenChange = React.useCallback(
    (open: boolean) => handleOpenChange(open, onOpenChange),
    [handleOpenChange, onOpenChange]
  )

  if (!show || !editor || !editor.isEditable) {
    return null
  }

  return (
    <DropdownMenu open={isOpen} onOpenChange={handleOnOpenChange}>
      <DropdownMenuTrigger asChild>
        <Button
          type='button'
          data-style='ghost'
          variant='ghost'
          className='h-9'
          data-active-state={isAnyActive ? 'on' : 'off'}
          role='button'
          tabIndex={-1}
          aria-label='List options'
          tooltip='List'
          {...props}>
          {getActiveIcon()}
          <ChevronDown className='tiptap-button-dropdown-small' />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent>
        <DropdownMenuGroup className='space-y-1'>
          {filteredLists.map((option) => (
            <DropdownMenuItem key={option.type} asChild>
              <ListButton
                editor={editor}
                type={option.type}
                text={option.label}
                variant='ghost'
                hideWhenUnavailable={hideWhenUnavailable}
                // @ts-expect-error - We don't want to display a tooltip for the list button
                tooltip={''}
                unstyled={true}
                showShortcut={true}
                className='flex w-full justify-between hover:bg-accent focus:bg-accent !border-0 after:!hidden before:!hidden rounded-md focus:shadow-[inset_0px_0px_0px_0.5px_rgb(255_255_255_/_0.02),inset_0px_0.5px_0px_rgb(255_255_255_/_0.04),_inset_0px_0px_0px_1px_rgb(255_255_255_/_0.02),_0px_0px_0px_0.5px_rgb(0_0_0_/_0.24)]'
              />
            </DropdownMenuItem>
          ))}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export default ListDropdownMenu
