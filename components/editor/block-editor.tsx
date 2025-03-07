import ImageBlockMenu from '@/editor/extensions/image-block/components/image-block-menu'
import { ColumnsMenu } from '@/editor/extensions/multi-column/menus/columns-menu'
import { useBlockEditor } from '@/hooks/use-editor'
import { EditorContent } from '@tiptap/react'
import { useRef } from 'react'
import { isMobile } from 'react-device-detect'
import { EditorBubbleMenu } from '../bubble-menu/bubble-menu'
import { Button } from '../ui/button'
import { EditorMenuBar } from './editor-menu-bar'

export const BlockEditor = () => {
  const menuContainerRef = useRef(null)
  const { editor } = useBlockEditor()

  if (!editor) {
    return (
      <div className='min-h-[100dvh] flex items-center justify-center'>
        <div className='animate-pulse'>Loading Editor...</div>
      </div>
    )
  }

  return (
    <div ref={menuContainerRef}>
      <EditorMenuBar editor={editor} />
      <div className='relative flex flex-col overflow-hidden'>
        <EditorContent
          editor={editor}
          className='flex-1 overflow-y-auto mt-5 mx-2'
        />
      </div>
      {!isMobile && <EditorBubbleMenu editor={editor} />}
      <ColumnsMenu editor={editor} appendTo={menuContainerRef} />
      <ImageBlockMenu editor={editor} appendTo={menuContainerRef} />
      {editor ? (
        <div className='md:hidden flex items-center gap-2 justify-end mb-5 mr-8'>
          <Button variant='ghost' size='sm'>
            Cancel
          </Button>
          <Button variant='brand' size='sm'>
            Save
          </Button>
        </div>
      ) : null}
    </div>
  )
}
