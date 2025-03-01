import ImageBlockMenu from '@/editor/extensions/image-block/components/image-block-menu'
import { ColumnsMenu } from '@/editor/extensions/multi-column/menus/columns-menu'
import { useBlockEditor } from '@/hooks/use-editor'
import { EditorContent } from '@tiptap/react'
import { useRef, useState } from 'react'
// import { EditorHeader } from './editor-head'
import { Button } from '../ui/button'
import { EditorMenuBar } from './editor-menu-bar'
import { ContentItemMenu } from './menus'
// import { LinkMenu } from './menus/link-menu'
// import { TextMenu } from './menus/text-menu/text-menu'
import { EditorBubbleMenu } from '../bubble-menu/bubble-menu'

export const BlockEditor = () => {
  const [isEditable, setIsEditable] = useState(true)
  const menuContainerRef = useRef(null)

  const { editor, users } = useBlockEditor({
    onTransaction: ({ editor }) => {
      setIsEditable(editor.isEditable)
    },
  })

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
      <ContentItemMenu editor={editor} isEditable={isEditable} />
      {/* <SlashCommand editor={editor} /> */}
      {/* <LinkMenu editor={editor} appendTo={menuContainerRef} /> */}
      {/* <TextMenu editor={editor} /> */}
      <EditorBubbleMenu editor={editor} />
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
