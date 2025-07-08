import { useUploader } from '@/editor/extensions/image-upload/view/hooks'
import type { Editor } from '@tiptap/react'
import { Ellipsis, Heading1, Heading2, Heading3, Loader2, Type } from 'lucide-react'
import { type ChangeEvent, memo, useRef } from 'react'
import { isMobile } from 'react-device-detect'
import { BubbleMenuButton } from '../bubble-menu/bubble-menu-button'
import { Button } from '../ui/button'
import { DropdownMenu } from '../ui/desktop-dropdown'
import { Icon } from '../ui/icon'
import { Toolbar } from '../ui/toolbar'
import { useTextmenuCommands } from './menus/text-menu/hooks/use-text-menu-commands'
import { useTextmenuStates } from './menus/text-menu/hooks/use-text-menu-states'

const MemoButton = memo(Toolbar.Button)

function paragraphIcon(editor: Editor) {
  if (editor.isActive('heading', { level: 1 })) return <Heading1 size={20} />
  if (editor.isActive('heading', { level: 2 })) return <Heading2 />
  if (editor.isActive('heading', { level: 3 })) return <Heading3 />
  return <Type />
}

function alignmentIcon(editor: Editor) {
  if (editor.isActive({ textAlign: 'left' })) return <Icon name='AlignLeft' />
  if (editor.isActive({ textAlign: 'center' })) return <Icon name='AlignCenter' />
  if (editor.isActive({ textAlign: 'right' })) return <Icon name='AlignRight' />
  return <Icon name='AlignLeft' />
}

const EditorMenuBarDivider = () => <div className='h-full min-h-[1.5rem] w-[1px] mx-1 first:ml-0 last:mr-0 bg-border' />

function isTruthy<T>(value: T | null | undefined | false | 0 | ''): value is T {
  return Boolean(value)
}

function buildMenuItems(items?: any): any {
  if (!items) return []
  return items?.filter(isTruthy) ?? []
}

interface EditorMenuBarProps {
  editor: Editor
  onSave?: (status: 'draft' | 'published') => void
  onDiscard?: () => void
  hasJobData?: boolean
  isLoading?: boolean
}

export const EditorMenuBar = ({
  editor,
  onSave,
  onDiscard,
  hasJobData = false,
  isLoading = false,
}: EditorMenuBarProps) => {
  const containerRef = useRef<HTMLDivElement>(null)
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

  function blurEditor() {
    if (isMobile && document.activeElement instanceof HTMLElement) {
      document.activeElement.blur()
    }
  }

  // Check if editor has meaningful content
  const hasEditorContent = () => {
    const content = editor?.getJSON()
    if (!content || !content.content || content.content.length === 0) return false

    return content.content.some((node: any) => {
      if (node.content && node.content.length > 0) {
        return node.content.some((child: any) => child.text && child.text.trim().length > 0)
      }
      return false
    })
  }

  const paragraphItems = buildMenuItems([
    {
      type: 'item',
      label: 'Regular text',
      onSelect: (e) => {
        e.stopPropagation()
        editor.chain().setParagraph().focus().run()
      },
      className: 'font-normal',
      kbd: 'mod+alt+0',
    },
    {
      type: 'item',
      label: 'Heading 1',
      onSelect: (e) => {
        e.stopPropagation()
        editor.chain().splitNearHardBreaks().setHeading({ level: 1 }).focus().run()
      },
      className: 'font-bold !text-lg',
      kbd: 'mod+alt+1',
    },
    {
      type: 'item',
      label: 'Heading 2',
      onSelect: (e) => {
        e.stopPropagation()
        editor.chain().splitNearHardBreaks().setHeading({ level: 2 }).focus().run()
      },
      className: 'font-bold',
      kbd: 'mod+alt+2',
    },
    {
      type: 'item',
      label: 'Heading 3',
      onSelect: (e) => {
        e.stopPropagation()
        editor.chain().splitNearHardBreaks().setHeading({ level: 3 }).focus().run()
      },
      className: 'font-semibold',
      kbd: 'mod+alt+3',
    },
  ])

  const alignmentItems = buildMenuItems([
    {
      type: 'item',
      label: 'Align Left',
      onSelect: (e) => {
        e.stopPropagation()
        editor.chain().setTextAlign('left').focus().run()
      },
      className: 'font-normal',
    },
    {
      type: 'item',
      label: 'Align Center',
      onSelect: (e) => {
        e.stopPropagation()
        editor.chain().setTextAlign('center').focus().run()
      },
      className: 'font-normal',
    },
    {
      type: 'item',
      label: 'Align Right',
      onSelect: (e) => {
        e.stopPropagation()
        editor.chain().setTextAlign('right').focus().run()
      },
      className: 'font-normal',
    },
  ])

  const actionItems = buildMenuItems([
    {
      type: 'item',
      label: 'Save',
      onSelect: (e) => {
        e.stopPropagation()
        onSave?.(hasJobData ? 'published' : 'draft')
      },
      disabled: !hasEditorContent() || isLoading,
    },
    {
      type: 'item',
      label: 'Discard',
      onSelect: (e) => {
        e.stopPropagation()
        onDiscard?.()
      },
      className: 'font-normal',
      disabled: isLoading,
    },
  ])

  return (
    <div className='h-14 border-b-1 border-dashed flex items-center xl:px-4 px-2 mx-auto justify-between'>
      <div className='flex items-center border rounded-[9px] px-[3px] py-[3px]'>
        <div className='flex items-center flex-1 gap-[2px]'>
          <DropdownMenu
            align='start'
            items={paragraphItems}
            trigger={
              <BubbleMenuButton onClick={blurEditor} icon={paragraphIcon(editor)} tooltip='Paragraph' dropdown />
            }
            desktop={{
              container: containerRef.current,
              width: 'w-50',
            }}
          />
          <div className='flex items-center gap-[2px]'>
            <MemoButton
              tooltip='Bold'
              tooltipShortcut={['Mod', 'B']}
              onClick={commands.onBold}
              active={states.isBold}
              className={
                states.isBold ? 'bg-important hover:bg-important-hover active:bg-important-active !text-white' : ''
              }>
              <Icon name='Bold' />
            </MemoButton>
            <MemoButton
              tooltip='Italic'
              tooltipShortcut={['Mod', 'I']}
              onClick={commands.onItalic}
              active={states.isItalic}
              className={
                states.isItalic ? 'bg-important hover:bg-important-hover active:bg-important-active !text-white' : ''
              }>
              <Icon name='Italic' />
            </MemoButton>
            <MemoButton
              tooltip='Underline'
              tooltipShortcut={['Mod', 'U']}
              onClick={commands.onUnderline}
              active={states.isUnderline}
              className={
                states.isUnderline ? 'bg-important hover:bg-important-hover active:bg-important-active !text-white' : ''
              }>
              <Icon name='Underline' />
            </MemoButton>
            <MemoButton
              tooltip='Strikethrough'
              tooltipShortcut={['Mod', 'Shift', 'S']}
              onClick={commands.onStrike}
              active={states.isStrike}
              className={
                states.isStrike ? 'bg-important hover:bg-important-hover active:bg-important-active !text-white' : ''
              }>
              <Icon name='Strikethrough' />
            </MemoButton>
          </div>
          <div className='flex items-center gap-[2px]'>
            <MemoButton
              tooltip='Code'
              tooltipShortcut={['Mod', 'E']}
              onClick={commands.onCode}
              active={states.isCode}
              className={
                states.isCode ? 'bg-important hover:bg-important-hover active:bg-important-active !text-white' : ''
              }>
              <Icon name='Code' />
            </MemoButton>
            <MemoButton
              tooltip='Code block'
              tooltipShortcut={['Mod', 'Alt', 'C']}
              onClick={commands.onCodeBlock}
              active={states.isCodeBlock}
              className={
                states.isCodeBlock ? 'bg-important hover:bg-important-hover active:bg-important-active !text-white' : ''
              }>
              <Icon name='FileCode' />
            </MemoButton>
          </div>
          <EditorMenuBarDivider />
          <DropdownMenu
            align='start'
            items={alignmentItems}
            trigger={
              <BubbleMenuButton onClick={blurEditor} icon={alignmentIcon(editor)} tooltip='Alignment' dropdown />
            }
            desktop={{
              container: containerRef.current,
              width: 'w-50',
            }}
          />
          <EditorMenuBarDivider />
          <MemoButton tooltip='Upload image' onClick={() => fileInputRef.current?.click()}>
            <Icon name='Image' />
          </MemoButton>
          <input type='file' accept='image/*' ref={fileInputRef} className='hidden' onChange={handleImageUpload} />
        </div>
      </div>

      <div className='flex items-center gap-2 ml-1 justify-end'>
        <div className='menu-bar:hidden'>
          <DropdownMenu
            align='end'
            items={actionItems}
            trigger={
              <Button variant='ghost' size='icon' disabled={isLoading}>
                <Ellipsis className='size-4' />
              </Button>
            }
            desktop={{
              container: containerRef.current,
              width: 'w-32',
            }}
          />
        </div>
        <div className='hidden menu-bar:flex items-center gap-2'>
          <Button variant='ghost' size='sm' onClick={onDiscard} disabled={isLoading}>
            Discard
          </Button>
          <Button
            variant='brand'
            size='sm'
            onClick={() => onSave?.(hasJobData ? 'published' : 'draft')}
            disabled={!hasEditorContent() || isLoading}>
            {isLoading && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
            Save
          </Button>
        </div>
      </div>
    </div>
  )
}
