import { Icon } from '@/components/ui/icon'
import { Toolbar } from '@/components/ui/toolbar'
import DragHandle from '@tiptap-pro/extension-drag-handle-react'
import { Editor } from '@tiptap/react'

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useEffect, useState } from 'react'
import useContentItemActions from './hooks/use-content-item-actions'
import { useData } from './hooks/use-data'

export type ContentItemMenuProps = {
  editor: Editor
  isEditable?: boolean
}

export const ContentItemMenu = ({
  editor,
  isEditable = true,
}: ContentItemMenuProps) => {
  const [menuOpen, setMenuOpen] = useState(false)
  const data = useData()
  const actions = useContentItemActions(
    editor,
    data.currentNode,
    data.currentNodePos
  )

  useEffect(() => {
    if (menuOpen) {
      editor.commands.setMeta('lockDragHandle', true)
    } else {
      editor.commands.setMeta('lockDragHandle', false)
    }
  }, [editor, menuOpen])

  return (
    <DragHandle
      pluginKey='ContentItemMenu'
      editor={editor}
      onNodeChange={data.handleNodeChange}
      tippyOptions={{
        offset: [-2, 0],
        zIndex: 99,
      }}>
      {isEditable ? (
        <div className='flex items-center gap-0.5'>
          <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
            <DropdownMenuTrigger asChild>
              <Toolbar.Button className='hover:bg-transparent text-muted-foreground hover:text-foreground'>
                <Icon name='GripVertical' />
              </Toolbar.Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              side='bottom'
              align='start'
              sideOffset={8}
              className='p-2 min-w-[16rem]'>
              <DropdownMenuItem onClick={actions.resetTextFormatting}>
                <Icon name='RemoveFormatting' />
                Clear formatting
              </DropdownMenuItem>
              <DropdownMenuItem onClick={actions.copyNodeToClipboard}>
                <Icon name='Clipboard' />
                Copy to clipboard
              </DropdownMenuItem>
              <DropdownMenuItem onClick={actions.duplicateNode}>
                <Icon name='Copy' />
                Duplicate
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                variant='destructive'
                onClick={actions.deleteNode}>
                <Icon name='Trash2' />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ) : null}
    </DragHandle>
  )
}
