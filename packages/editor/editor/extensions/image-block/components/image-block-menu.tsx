import { Button } from '@seeds/ui/button'
import { Icon } from '@seeds/ui/icon'
import type { Editor } from '@tiptap/react'
import { BubbleMenu as BaseBubbleMenu, useEditorState } from '@tiptap/react'
import { type JSX, useCallback, useRef } from 'react'

interface MenuProps {
  editor: Editor
  appendTo?: React.RefObject<HTMLElement>
}

const ImageBlockWidth = ({ onChange, value }: { onChange: (value: number) => void; value: number }) => {
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
        className='h-2 bg-muted border-0 rounded appearance-none cursor-pointer'
        style={{
          WebkitAppearance: 'none',
        }}
        type='range'
        min='25'
        max='100'
        step='25'
        onChange={handleChange}
        value={value}
      />
      <span className='text-xs font-semibold text-muted-foreground select-none min-w-[3ch] pr-2'>{value}%</span>
    </div>
  )
}

export const ImageBlockMenu = ({ editor, appendTo }: MenuProps): JSX.Element => {
  const menuRef = useRef<HTMLDivElement>(null)

  const shouldShow = useCallback(() => {
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
        width: Number.parseInt(ctx.editor.getAttributes('imageBlock')?.width || '100'),
      }
    },
  })

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
        className='text-foreground bg-background flex cursor-default items-center gap-1 rounded-lg p-1 shadow-lg border dark:border-none dark:shadow-[inset_0px_1px_0px_rgb(255_255_255_/_0.04),_inset_0px_0px_0px_1px_rgb(255_255_255_/_0.02),_0px_1px_2px_rgb(0_0_0_/_0.4),_0px_2px_4px_rgb(0_0_0_/_0.08),_0px_0px_0px_0.5px_rgb(0_0_0_/_0.24)]'>
        <Button
          variant='ghost'
          size='sm'
          tooltip='Align image left'
          data-active-state={isImageLeft ? 'on' : 'off'}
          onClick={onAlignImageLeft}>
          <Icon name='AlignHorizontalDistributeStart' />
        </Button>
        <Button
          variant='ghost'
          size='sm'
          tooltip='Align image center'
          data-active-state={isImageCenter ? 'on' : 'off'}
          onClick={onAlignImageCenter}>
          <Icon name='AlignHorizontalDistributeCenter' />
        </Button>
        <Button
          variant='ghost'
          size='sm'
          tooltip='Align image right'
          data-active-state={isImageRight ? 'on' : 'off'}
          onClick={onAlignImageRight}>
          <Icon name='AlignHorizontalDistributeEnd' />
        </Button>
        <div className='w-px h-6 bg-border mx-1' />
        <ImageBlockWidth onChange={onWidthChange} value={width} />
      </div>
    </BaseBubbleMenu>
  )
}

export default ImageBlockMenu
