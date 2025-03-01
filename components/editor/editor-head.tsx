'use client'

import { Icon } from '@/components/ui/icon'
import { Toolbar } from '@/components/ui/toolbar'
import { WebSocketStatus } from '@hocuspocus/provider'
import { Editor } from '@tiptap/core'
import { useCallback } from 'react'
import { EditorUser } from './types'

export type EditorHeaderProps = {
  isSidebarOpen?: boolean
  toggleSidebar?: () => void
  editor: Editor
  collabState: WebSocketStatus
  users: EditorUser[]
}

export const EditorHeader = ({
  editor,
  collabState,
  users,
  isSidebarOpen,
  toggleSidebar,
}: EditorHeaderProps) => {
  const toggleEditable = useCallback(() => {
    editor.setOptions({ editable: !editor.isEditable })
    editor.view.dispatch(editor.view.state.tr)
  }, [editor])

  return (
    <div className='flex flex-row items-center justify-between flex-none py-2 pl-6 pr-3 text-black bg-white border-b border-neutral-200 dark:bg-black dark:text-white dark:border-neutral-800'>
      <div className='flex flex-row gap-x-1.5 items-center'>
        <div className='flex items-center gap-x-1.5'>
          <Toolbar.Button
            tooltip={isSidebarOpen ? 'Close sidebar' : 'Open sidebar'}
            onClick={toggleSidebar}
            active={isSidebarOpen}
            className={isSidebarOpen ? 'bg-transparent' : ''}>
            <Icon name={isSidebarOpen ? 'PanelLeftClose' : 'PanelLeft'} />
          </Toolbar.Button>
          <Toolbar.Button
            tooltip={editor.isEditable ? 'Disable editing' : 'Enable editing'}
            onClick={toggleEditable}>
            <Icon name={editor.isEditable ? 'PenOff' : 'Pen'} />
          </Toolbar.Button>
        </div>
      </div>
    </div>
  )
}
