import { useUploader } from '@/editor/extensions/image-upload/view/hooks'
import { Editor } from '@tiptap/react'
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Bold,
  Code,
  Image as ImageIcon,
  Italic,
  Strikethrough,
  Underline,
} from 'lucide-react'
import { ChangeEvent, useRef } from 'react'
import { Button } from '../ui/button'
import { useTextmenuCommands } from './menus/text-menu/hooks/use-text-menu-commands'
import { useTextmenuStates } from './menus/text-menu/hooks/use-text-menu-states'

export const EditorMenuBar = ({ editor }: { editor: Editor }) => {
  const commands = useTextmenuCommands(editor)
  const states = useTextmenuStates(editor)

  const { uploadFile, loading } = useUploader({
    onUpload: (url) => {
      editor.chain().focus().setImageBlock({ src: url }).run()
    },
  })

  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleImageUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    uploadFile(file)
  }

  return (
    <div className='h-12 border-y-1 flex items-center px-4 justify-between'>
      <div className='flex items-center flex-1 md:flex-none  border rounded-[7px]'>
        <Button
          size='icon'
          variant='ghost'
          onClick={commands.onBold}
          active={states.isBold}
          className='size-[35px] md:size-[30px] flex-1 md:flex-none rounded-r-none'>
          <Bold className='size-4' />
        </Button>
        <Button
          size='icon'
          variant='ghost'
          onClick={commands.onItalic}
          active={states.isItalic}
          className='size-[35px] md:size-[30px] flex-1 md:flex-none rounded-none'>
          <Italic className='size-4' />
        </Button>
        <Button
          size='icon'
          variant='ghost'
          onClick={commands.onUnderline}
          active={states.isUnderline}
          className='size-[35px] md:size-[30px] flex-1 md:flex-none rounded-none'>
          <Underline className='size-4' />
        </Button>
        <Button
          size='icon'
          variant='ghost'
          onClick={commands.onStrike}
          active={states.isStrike}
          className='size-[35px] md:size-[30px] flex-1 md:flex-none rounded-none'>
          <Strikethrough className='size-4' />
        </Button>
        <Button
          size='icon'
          variant='ghost'
          onClick={commands.onCode}
          active={states.isCode}
          className='size-[35px] md:size-[30px] flex-1 md:flex-none border-r rounded-none'>
          <Code className='size-4' />
        </Button>
        <Button
          size='icon'
          variant='ghost'
          onClick={commands.onAlignLeft}
          active={states.isAlignLeft}
          className='size-[35px] md:size-[30px] flex-1 md:flex-none rounded-none'>
          <AlignLeft className='size-4' />
        </Button>
        <Button
          size='icon'
          variant='ghost'
          onClick={commands.onAlignCenter}
          active={states.isAlignCenter}
          className='size-[35px] md:size-[30px] flex-1 md:flex-none rounded-none'>
          <AlignCenter className='size-4' />
        </Button>
        <Button
          size='icon'
          variant='ghost'
          onClick={commands.onAlignRight}
          active={states.isAlignRight}
          className='size-[35px] md:size-[30px] flex-1 md:flex-none rounded-none border-r'>
          <AlignRight className='size-4' />
        </Button>

        <Button
          size='icon'
          variant='ghost'
          className='size-[35px] md:size-[30px] flex-1 md:flex-none rounded-none rounded-r-md'
          onClick={() => fileInputRef.current?.click()}
          disabled={loading}>
          <ImageIcon className='size-4' />
        </Button>

        <input
          type='file'
          accept='image/*'
          ref={fileInputRef}
          className='hidden'
          onChange={handleImageUpload}
        />
      </div>

      <div className='hidden md:flex items-center gap-2 justify-end'>
        <Button variant='ghost' size='sm'>
          Cancel
        </Button>
        <Button variant='brand' size='sm'>
          Save
        </Button>
      </div>
    </div>
  )
}
