import { Icon } from '@/components/ui/icon'
import { Surface } from '@/components/ui/surface'
import { Toolbar } from '@/components/ui/toolbar'
import * as Popover from '@radix-ui/react-popover'
import { BubbleMenu, Editor } from '@tiptap/react'
import { memo, useEffect, useState } from 'react'
import { ColorPicker } from '../../panels/color-picker'
import { ContentTypePicker } from './components/content-type-picker'
import { EditLinkPopover } from './components/edit-link-popover'
import { FontFamilyPicker } from './components/font-family-picker'
import { FontSizePicker } from './components/font-size-picker'
import { useTextmenuCommands } from './hooks/use-text-menu-commands'
import { useTextmenuContentTypes } from './hooks/use-text-menu-content-types'
import { useTextmenuStates } from './hooks/use-text-menu-states'

// We memorize the button so each button is not rerendered
// on every editor state change
const MemoButton = memo(Toolbar.Button)
const MemoColorPicker = memo(ColorPicker)
const MemoFontFamilyPicker = memo(FontFamilyPicker)
const MemoFontSizePicker = memo(FontSizePicker)
const MemoContentTypePicker = memo(ContentTypePicker)

export type TextMenuProps = {
  editor: Editor
}

export const TextMenu = ({ editor }: TextMenuProps) => {
  const [selecting, setSelecting] = useState(false)
  const commands = useTextmenuCommands(editor)
  const states = useTextmenuStates(editor)
  const blockOptions = useTextmenuContentTypes(editor)

  useEffect(() => {
    const controller = new AbortController()
    let selectionTimeout: number

    document.addEventListener(
      'selectionchange',
      () => {
        setSelecting(true)

        if (selectionTimeout) {
          window.clearTimeout(selectionTimeout)
        }

        selectionTimeout = window.setTimeout(() => {
          setSelecting(false)
        }, 500)
      },
      { signal: controller.signal }
    )

    return () => {
      controller.abort()
    }
  }, [])

  return (
    <BubbleMenu
      // TODO: Figure out a way to make the menu less jumpy
      // className={selecting ? 'hidden' : ''}
      tippyOptions={{
        popperOptions: {
          placement: 'top-start',
          modifiers: [
            {
              name: 'preventOverflow',
              options: {
                boundary: 'viewport',
                padding: 8,
              },
            },
          ],
        },
        offset: [0, 8],
        maxWidth: 'calc(100vw - 16px)',
      }}
      editor={editor}
      pluginKey='textMenu'
      shouldShow={states.shouldShow}
      updateDelay={0}>
      <Toolbar.Wrapper>
        <MemoContentTypePicker options={blockOptions} />
        <MemoFontFamilyPicker
          onChange={commands.onSetFont}
          value={states.currentFont || ''}
        />
        <MemoFontSizePicker
          onChange={commands.onSetFontSize}
          value={states.currentSize || ''}
        />
        <Toolbar.Divider />
        <MemoButton
          tooltip='Bold'
          tooltipShortcut={['Mod', 'B']}
          onClick={commands.onBold}
          active={states.isBold}>
          <Icon name='Bold' />
        </MemoButton>
        <MemoButton
          tooltip='Italic'
          tooltipShortcut={['Mod', 'I']}
          onClick={commands.onItalic}
          active={states.isItalic}>
          <Icon name='Italic' />
        </MemoButton>
        <MemoButton
          tooltip='Underline'
          tooltipShortcut={['Mod', 'U']}
          onClick={commands.onUnderline}
          active={states.isUnderline}>
          <Icon name='Underline' />
        </MemoButton>
        <MemoButton
          tooltip='Strikethrough'
          tooltipShortcut={['Mod', 'Shift', 'S']}
          onClick={commands.onStrike}
          active={states.isStrike}>
          <Icon name='Strikethrough' />
        </MemoButton>
        <MemoButton
          tooltip='Code'
          tooltipShortcut={['Mod', 'E']}
          onClick={commands.onCode}
          active={states.isCode}>
          <Icon name='Code' />
        </MemoButton>
        <MemoButton tooltip='Code block' onClick={commands.onCodeBlock}>
          <Icon name='FileCode' />
        </MemoButton>
        <EditLinkPopover onSetLink={commands.onLink} />
        <Popover.Root>
          <Popover.Trigger asChild>
            <MemoButton
              active={!!states.currentHighlight}
              tooltip='Highlight text'>
              <Icon name='Highlighter' />
            </MemoButton>
          </Popover.Trigger>
          <Popover.Content side='top' sideOffset={8} asChild>
            <Surface className='p-1'>
              <MemoColorPicker
                color={states.currentHighlight}
                onChange={commands.onChangeHighlight}
                onClear={commands.onClearHighlight}
              />
            </Surface>
          </Popover.Content>
        </Popover.Root>
        <Popover.Root>
          <Popover.Trigger asChild>
            <MemoButton active={!!states.currentColor} tooltip='Text color'>
              <Icon name='Palette' />
            </MemoButton>
          </Popover.Trigger>
          <Popover.Content side='top' sideOffset={8} asChild>
            <Surface className='p-1'>
              <MemoColorPicker
                color={states.currentColor}
                onChange={commands.onChangeColor}
                onClear={commands.onClearColor}
              />
            </Surface>
          </Popover.Content>
        </Popover.Root>
        <Popover.Root>
          <Popover.Trigger asChild>
            <MemoButton tooltip='More options'>
              <Icon name='EllipsisVertical' />
            </MemoButton>
          </Popover.Trigger>
          <Popover.Content side='top' asChild>
            <Toolbar.Wrapper>
              <MemoButton
                tooltip='Subscript'
                tooltipShortcut={['Mod', '.']}
                onClick={commands.onSubscript}
                active={states.isSubscript}>
                <Icon name='Subscript' />
              </MemoButton>
              <MemoButton
                tooltip='Superscript'
                tooltipShortcut={['Mod', ',']}
                onClick={commands.onSuperscript}
                active={states.isSuperscript}>
                <Icon name='Superscript' />
              </MemoButton>
              <Toolbar.Divider />
              <MemoButton
                tooltip='Align left'
                tooltipShortcut={['Shift', 'Mod', 'L']}
                onClick={commands.onAlignLeft}
                active={states.isAlignLeft}>
                <Icon name='AlignLeft' />
              </MemoButton>
              <MemoButton
                tooltip='Align center'
                tooltipShortcut={['Shift', 'Mod', 'E']}
                onClick={commands.onAlignCenter}
                active={states.isAlignCenter}>
                <Icon name='AlignCenter' />
              </MemoButton>
              <MemoButton
                tooltip='Align right'
                tooltipShortcut={['Shift', 'Mod', 'R']}
                onClick={commands.onAlignRight}
                active={states.isAlignRight}>
                <Icon name='AlignRight' />
              </MemoButton>
              <MemoButton
                tooltip='Justify'
                tooltipShortcut={['Shift', 'Mod', 'J']}
                onClick={commands.onAlignJustify}
                active={states.isAlignJustify}>
                <Icon name='AlignJustify' />
              </MemoButton>
            </Toolbar.Wrapper>
          </Popover.Content>
        </Popover.Root>
      </Toolbar.Wrapper>
    </BubbleMenu>
  )
}
