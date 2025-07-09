import { Button } from '@/components/ui/editor/button'
import type { Editor } from '@tiptap/react'
import { BubbleMenu as BaseBubbleMenu, useEditorState } from '@tiptap/react'
import { AlignCenter, AlignLeft, AlignRight } from 'lucide-react'
import { type JSX, memo, useCallback, useRef } from 'react'

interface MenuProps {
  editor: Editor
  appendTo?: React.RefObject<HTMLElement>
}

export const ImageBlockWidth = memo(({ onChange, value }: { onChange: (value: number) => void; value: number }) => {
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const nextValue = Number.parseInt(e.target.value)
      onChange(nextValue)
    },
    [onChange]
  )

  return (
    <div className='flex items-center gap-2'>
      <input
        className='h-2 bg-muted border-0 rounded appearance-none'
        type='range'
        min='25'
        max='100'
        step='25'
        onChange={handleChange}
        value={value}
      />
      <span className='text-xs font-semibold text-muted-foreground select-none min-w-[3ch]'>{value}%</span>
    </div>
  )
})

ImageBlockWidth.displayName = 'ImageBlockWidth'

export const ImageBlockMenu = ({ editor, appendTo }: MenuProps): JSX.Element => {
  const menuRef = useRef<HTMLDivElement>(null)

  const shouldShow = useCallback(() => {
    if (!editor) return false
    return editor.isActive('imageBlock')
  }, [editor])

  const onAlignImageLeft = useCallback(() => {
    editor.chain().focus(undefined, { scrollIntoView: false }).setImageBlockAlign('left').run()
  }, [editor])

  const onAlignImageCenter = useCallback(() => {
    editor.chain().focus(undefined, { scrollIntoView: false }).setImageBlockAlign('center').run()
  }, [editor])

  const onAlignImageRight = useCallback(() => {
    editor.chain().focus(undefined, { scrollIntoView: false }).setImageBlockAlign('right').run()
  }, [editor])

  const onWidthChange = useCallback(
    (value: number) => {
      editor.chain().focus(undefined, { scrollIntoView: false }).setImageBlockWidth(value).run()
    },
    [editor]
  )

  const { isImageCenter, isImageLeft, isImageRight, width } = useEditorState({
    editor,
    selector: (ctx) => {
      return {
        isImageLeft: ctx.editor.isActive('imageBlock', { align: 'left' }),
        isImageCenter: ctx.editor.isActive('imageBlock', { align: 'center' }),
        isImageRight: ctx.editor.isActive('imageBlock', { align: 'right' }),
        width: Number.parseInt(ctx.editor.getAttributes('imageBlock')?.width?.replace('%', '') || '100'),
      }
    },
  })

  if (!editor) return <></>

  return (
    <BaseBubbleMenu
      editor={editor}
      shouldShow={shouldShow}
      updateDelay={0}
      tippyOptions={{
        duration: 100,
        offset: [0, 8],
        placement: 'top',
        appendTo: () => appendTo?.current || document.body,
      }}>
      <div
        ref={menuRef}
        className='flex items-center gap-1 p-2 bg-background border border-border rounded-lg shadow-lg'>
        <Button
          variant='ghost'
          size='sm'
          tooltip='Align image left'
          data-active-state={isImageLeft ? 'on' : 'off'}
          onClick={onAlignImageLeft}>
          <AlignLeft className='h-4 w-4' />
        </Button>
        <Button
          variant='ghost'
          size='sm'
          tooltip='Align image center'
          data-active-state={isImageCenter ? 'on' : 'off'}
          onClick={onAlignImageCenter}>
          <AlignCenter className='h-4 w-4' />
        </Button>
        <Button
          variant='ghost'
          size='sm'
          tooltip='Align image right'
          data-active-state={isImageRight ? 'on' : 'off'}
          onClick={onAlignImageRight}>
          <AlignRight className='h-4 w-4' />
        </Button>
        <div className='w-px h-6 bg-border mx-1' />
        <ImageBlockWidth onChange={onWidthChange} value={width} />
      </div>
    </BaseBubbleMenu>
  )
}

export default ImageBlockMenu
