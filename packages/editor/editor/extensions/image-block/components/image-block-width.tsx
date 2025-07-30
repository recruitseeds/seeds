import { Button } from '@seeds/ui/button'
import { Icon } from '@seeds/ui/icon'
import { getRenderContainer } from '../lib/get-render-container'
import type { Editor } from '@tiptap/react'
import { BubbleMenu as BaseBubbleMenu, useEditorState } from '@tiptap/react'
import { type JSX, useCallback, useRef } from 'react'
import { type Instance, sticky } from 'tippy.js'
import { v4 as uuid } from 'uuid'

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
}

export const ImageBlockMenu = ({ editor, appendTo }: MenuProps): JSX.Element => {
  const menuRef = useRef<HTMLDivElement>(null)
  const tippyInstance = useRef<Instance | null>(null)

  const getReferenceClientRect = useCallback(() => {
    const renderContainer = getRenderContainer(editor, 'node-imageBlock')
    const rect = renderContainer?.getBoundingClientRect() || new DOMRect(-1000, -1000, 0, 0)
    return rect
  }, [editor])

  const shouldShow = useCallback(() => {
    const isActive = editor.isActive('imageBlock')
    return isActive
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

  const { isImageCenter, isImageLeft, isImageRight, width, isFullWidth } = useEditorState({
    editor,
    selector: (ctx) => {
      const attrs = ctx.editor.getAttributes('imageBlock')
      const currentWidth = Number.parseInt(attrs?.width || '100')
      return {
        isImageLeft: ctx.editor.isActive('imageBlock', { align: 'left' }),
        isImageCenter: ctx.editor.isActive('imageBlock', { align: 'center' }),
        isImageRight: ctx.editor.isActive('imageBlock', { align: 'right' }),
        width: currentWidth,
        isFullWidth: currentWidth === 100,
      }
    },
  })

  return (
    <BaseBubbleMenu
      editor={editor}
      pluginKey={`imageBlockMenu-${uuid()}`}
      shouldShow={shouldShow}
      updateDelay={0}
      tippyOptions={{
        offset: [0, 8],
        popperOptions: {
          modifiers: [{ name: 'flip', enabled: false }],
        },
        getReferenceClientRect,
        onCreate: (instance: Instance) => {
          tippyInstance.current = instance
        },
        onShow: (instance: Instance) => {},
        onHide: (instance: Instance) => {},
        appendTo: () => {
          return appendTo?.current || document.body
        },
        plugins: [sticky],
        sticky: 'popper',
      }}>
      <div
        ref={menuRef}
        className='text-foreground bg-background flex cursor-default items-center gap-1 rounded-lg p-1 shadow-lg border dark:border-none dark:shadow-[inset_0px_1px_0px_rgb(255_255_255_/_0.04),_inset_0px_0px_0px_1px_rgb(255_255_255_/_0.02),_0px_1px_2px_rgb(0_0_0_/_0.4),_0px_2px_4px_rgb(0_0_0_/_0.08),_0px_0px_0px_0.5px_rgb(0_0_0_/_0.24)]'>
        <Button
          variant='ghost'
          size='sm'
          tooltip={isFullWidth ? 'Align image left (resize to see effect)' : 'Align image left'}
          data-active-state={isImageLeft && !isFullWidth ? 'on' : 'off'}
          onClick={onAlignImageLeft}
          disabled={false}>
          <Icon name='AlignHorizontalDistributeStart' />
        </Button>
        <Button
          variant='ghost'
          size='sm'
          tooltip={isFullWidth ? 'Align image center (resize to see effect)' : 'Align image center'}
          data-active-state={isImageCenter && !isFullWidth ? 'on' : 'off'}
          onClick={onAlignImageCenter}
          disabled={false}>
          <Icon name='AlignHorizontalDistributeCenter' />
        </Button>
        <Button
          variant='ghost'
          size='sm'
          tooltip={isFullWidth ? 'Align image right (resize to see effect)' : 'Align image right'}
          data-active-state={isImageRight && !isFullWidth ? 'on' : 'off'}
          onClick={onAlignImageRight}
          disabled={false}>
          <Icon name='AlignHorizontalDistributeEnd' />
        </Button>
        <div className='w-px h-6 bg-border mx-1' />
        <ImageBlockWidth onChange={onWidthChange} value={width} />
      </div>
    </BaseBubbleMenu>
  )
}

export default ImageBlockMenu
