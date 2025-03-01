import {
  BubbleMenu,
  Editor,
  findParentNode,
  isList,
  isTextSelection,
} from '@tiptap/react'
import Link from 'next/link'
import {
  memo,
  MouseEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react'
import { isMobile } from 'react-device-detect'
import { isValidUrl } from '../../lib/is-valid-url'
import { Button } from '../ui/button'
import { AnyEvent, LinkEditor } from '../ui/link-editor'
import { Tooltip } from '../ui/tippy'

// import { buildMenuItems } from '@campsite/ui/Menu'
import { DropdownMenu } from '@radix-ui/react-dropdown-menu'
import {
  Bold as BoldIcon,
  CheckSquare as ChecklistIcon,
  FileCode as CodeBlockIcon,
  Code as CodeIcon,
  ExternalLink as ExternalLinkIcon,
  Heading1 as Heading1Icon,
  Heading2 as Heading2Icon,
  Heading3 as Heading3Icon,
  Italic as ItalicIcon,
  Link as LinkIcon,
  ListOrdered as OrderedListIcon,
  Pencil as PencilIcon,
  Quote as QuoteIcon,
  Strikethrough as StrikeIcon,
  Type as TextCapitalizeIcon,
  Trash2 as TrashIcon,
  Underline as UnderlineIcon,
  List as UnorderedListIcon,
} from 'lucide-react'

import { useForceUpdate } from '../../hooks/use-force-update'
import { BubbleMenuSeparator } from './bubble-menu-separator'

import { BubbleMenuButton } from './bubble-menu-button'

function isTruthy<T>(value: T | null | undefined | false | 0 | ''): value is T {
  return Boolean(value)
}

function buildMenuItems(items?: any): any {
  if (!items) return []
  return items?.filter(isTruthy) ?? []
}

function paragraphIcon(editor: Editor) {
  if (editor.isActive('heading', { level: 1 }))
    return <Heading1Icon size={20} />
  if (editor.isActive('heading', { level: 2 })) return <Heading2Icon />
  if (editor.isActive('heading', { level: 3 })) return <Heading3Icon />
  return <TextCapitalizeIcon />
}

function listIcon(editor: Editor) {
  if (editor.isActive('orderedList')) return <OrderedListIcon />
  if (editor.isActive('taskList')) return <ChecklistIcon />
  return <UnorderedListIcon />
}

interface Props {
  editor: Editor | null
  canComment?: boolean
  enableHeaders?: boolean
  enableLists?: boolean
  enableBlockquote?: boolean
  enableUnderline?: boolean
  enableCodeBlock?: boolean
  // BubbleMenu uses Tippy under the hood. Use this to append to a different element other than the editor's parent
  tippyAppendTo?: () => HTMLElement | null
}

export const EditorBubbleMenu = memo(function EditorBubbleMemo({
  editor,
  canComment = false,
  enableHeaders = true,
  enableLists = true,
  enableBlockquote = true,
  enableUnderline = true,
  enableCodeBlock = true,
  tippyAppendTo,
}: Props) {
  const [linkEditorOpen, setLinkEditorOpen] = useState(false)
  const [url, setUrl] = useState(editor?.getAttributes('link').href ?? '')

  // force rerender when the menu is opened/closed to respond to TipTap and tippy.js changes
  const forceUpdate = useForceUpdate()

  const openLinkEditor = useCallback(
    (e?: MouseEvent) => {
      e?.stopPropagation()
      setUrl(editor?.getAttributes('link').href ?? '')
      setLinkEditorOpen(true)
    },
    [editor]
  )

  const closeLinkEditor = useCallback(() => {
    setLinkEditorOpen(false)
    editor?.chain().focus().run()
  }, [editor])

  function saveLink() {
    if (url) {
      const href = url.includes('://') ? url : `https://${url}`

      editor?.chain().focus().extendMarkRange('link').setLink({ href }).run()
    } else {
      editor?.chain().focus().extendMarkRange('link').unsetLink().run()
    }

    closeLinkEditor()
  }

  function removeLink(e: AnyEvent) {
    e.stopPropagation()
    editor?.chain().focus().extendMarkRange('link').unsetLink().run()
    closeLinkEditor()
  }

  function blurEditor() {
    // blur editor on mobile in order to hide the keyboard and show mobile dropdown
    if (isMobile && document.activeElement instanceof HTMLElement) {
      document.activeElement.blur()
    }
  }
  // Show LinkEditor when text highlighted on cmd+k
  useEffect(() => {
    const container = editor?.view.dom

    if (!container) return

    const keydown = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        if (
          !editor?.isFocused ||
          editor.view.state.selection.from === editor.view.state.selection.to
        )
          return
        e.stopPropagation()
        if (linkEditorOpen) {
          closeLinkEditor()
        } else {
          openLinkEditor()
        }
      }
    }

    // update the URL anytime the selection changes
    const updateUrl = () => setUrl(editor?.getAttributes('link').href ?? '')

    container.addEventListener('keydown', keydown, { capture: true })
    editor.on('transaction', forceUpdate)
    editor.on('selectionUpdate', updateUrl)

    return () => {
      container.removeEventListener('keydown', keydown, { capture: true })
      editor.off('transaction', forceUpdate)
      editor.off('selectionUpdate', updateUrl)
    }
  }, [closeLinkEditor, editor, linkEditorOpen, openLinkEditor, forceUpdate])

  const containerRef = useRef<HTMLDivElement>(null)

  if (!editor) return null

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
        editor
          .chain()
          .splitNearHardBreaks()
          .setHeading({ level: 1 })
          .focus()
          .run()
      },
      className: 'font-bold !text-lg',
      kbd: 'mod+alt+1',
    },
    {
      type: 'item',
      label: 'Heading 2',
      onSelect: (e) => {
        e.stopPropagation()
        editor
          .chain()
          .splitNearHardBreaks()
          .setHeading({ level: 2 })
          .focus()
          .run()
      },
      className: 'font-bold',
      kbd: 'mod+alt+2',
    },
    {
      type: 'item',
      label: 'Heading 3',
      onSelect: (e) => {
        e.stopPropagation()
        editor
          .chain()
          .splitNearHardBreaks()
          .setHeading({ level: 3 })
          .focus()
          .run()
      },
      className: 'font-semibold',
      kbd: 'mod+alt+3',
    },
  ])

  const listItems = buildMenuItems([
    {
      type: 'item',
      label: 'List',
      leftSlot: <UnorderedListIcon />,
      onSelect: (e) => {
        e.stopPropagation()
        editor.chain().toggleBulletList().focus().run()
      },
      kbd: 'mod+shift+7',
    },
    {
      type: 'item',
      label: 'Numbered',
      leftSlot: <OrderedListIcon />,
      onSelect: (e) => {
        e.stopPropagation()
        editor.chain().toggleOrderedList().focus().run()
      },
      kbd: 'mod+shift+8',
    },
    {
      type: 'item',
      label: 'Checklist',
      leftSlot: <ChecklistIcon />,
      onSelect: (e) => {
        e.stopPropagation()
        editor.chain().toggleTaskList().focus().run()
      },
      kbd: 'mod+shift+9',
    },
  ])

  const parentContainer = tippyAppendTo?.() ?? undefined

  return (
    <div
      className='absolute'
      onKeyDownCapture={(e) => {
        if (e.key !== 'Escape') return
        e.stopPropagation()
        closeLinkEditor()
      }}>
      <BubbleMenu
        pluginKey='bubbleMenuText'
        editor={editor}
        tippyOptions={{
          onHidden: closeLinkEditor,
          maxWidth: 'auto',
          appendTo: parentContainer,
          popperOptions: {
            // prefer top; allow flipping to the bottom to avoid getting clipped.
            // if the popover is completely off-screen it will be hidden by CSS in editor.css.
            placement: 'top',
            modifiers: [
              {
                name: 'flip',
                options: {
                  fallbackPlacements: ['top', 'bottom'],
                  boundary: parentContainer,
                },
              },
            ],
          },
        }}
        updateDelay={50}
        shouldShow={({ editor, view, state, from, to }) => {
          // Reworked from the default, because we only want the selection
          // menu for text selections where a mark change will be visible.
          // https://github.com/ueberdosis/tiptap/blob/063ced27ca55f331960b01ee6aea5623eee0ba49/packages/extension-bubble-menu/src/bubble-menu-plugin.ts#L43
          if (!view.hasFocus() && !canComment) {
            return false
          }

          const { doc, selection } = state
          const isText = isTextSelection(selection)

          if (!isText) return false
          const isEmpty =
            selection.empty ||
            (isText && doc.textBetween(from, to).length === 0)

          if (isEmpty) return false
          if (
            ['postNoteAttachment', 'comment', 'codeBlock'].some((name) =>
              editor.isActive(name)
            )
          )
            return false
          return true
        }}>
        <div
          ref={containerRef}
          className='text-foreground bg-background flex cursor-default items-center gap-1 rounded-lg p-1 shadow-lg dark:shadow-[inset_0px_1px_0px_rgb(255_255_255_/_0.04),_inset_0px_0px_0px_1px_rgb(255_255_255_/_0.02),_0px_1px_2px_rgb(0_0_0_/_0.4),_0px_2px_4px_rgb(0_0_0_/_0.08),_0px_0px_0px_0.5px_rgb(0_0_0_/_0.24)]'>
          {linkEditorOpen ? (
            <LinkEditor
              url={url}
              onChangeUrl={setUrl}
              onSaveLink={saveLink}
              onRemoveLink={removeLink}
            />
          ) : (
            <>
              {editor.isEditable && (
                <>
                  {enableHeaders && (
                    <DropdownMenu
                      align='start'
                      items={paragraphItems}
                      trigger={
                        <BubbleMenuButton
                          onClick={blurEditor}
                          icon={paragraphIcon(editor)}
                          tooltip='Paragraph'
                          dropdown
                        />
                      }
                      desktop={{
                        container: containerRef.current,
                        width: 'w-50',
                      }}
                    />
                  )}
                  <BubbleMenuButton
                    onClick={(e) => {
                      e.stopPropagation()
                      editor.chain().toggleBold().focus().run()
                    }}
                    isActive={editor.isActive('bold')}
                    icon={<BoldIcon className='size-4' />}
                    tooltip='Bold'
                    shortcut='mod+b'
                  />
                  <BubbleMenuButton
                    onClick={(e) => {
                      e.stopPropagation()
                      editor.chain().toggleItalic().focus().run()
                    }}
                    isActive={editor.isActive('italic')}
                    icon={<ItalicIcon className='size-4' />}
                    tooltip='Italic'
                    shortcut='mod+i'
                  />
                  {enableUnderline && (
                    <BubbleMenuButton
                      onClick={(e) => {
                        e.stopPropagation()
                        editor.chain().toggleUnderline().focus().run()
                      }}
                      isActive={editor.isActive('underline')}
                      icon={<UnderlineIcon className='size-4' />}
                      tooltip='Underline'
                      shortcut='mod+u'
                    />
                  )}
                  <BubbleMenuButton
                    onClick={(e) => {
                      e.stopPropagation()
                      editor.chain().toggleStrike().focus().run()
                    }}
                    isActive={editor.isActive('strike')}
                    icon={<StrikeIcon className='size-4' />}
                    tooltip='Strikethrough'
                    shortcut='mod+shift+s'
                  />
                  <BubbleMenuSeparator />

                  {enableBlockquote && (
                    <BubbleMenuButton
                      onClick={(e) => {
                        e.stopPropagation()

                        const selection = editor.state.selection
                        const parentList = findParentNode((node) =>
                          isList(
                            node.type.name,
                            editor.extensionManager.extensions
                          )
                        )(selection)
                        let chain = editor.chain()

                        // fully collapse nested lists
                        if (parentList) {
                          for (let i = 0; i < parentList.depth; i++) {
                            chain = chain.liftListItem('listItem')
                          }
                        }

                        chain.toggleBlockquote().focus().run()
                      }}
                      isActive={editor.isActive('blockquote')}
                      icon={<QuoteIcon className='size-4' />}
                      tooltip='Quote'
                      shortcut='mod+shift+b'
                    />
                  )}
                  {enableLists && (
                    <DropdownMenu
                      align='start'
                      items={listItems}
                      trigger={
                        <BubbleMenuButton
                          onClick={blurEditor}
                          icon={listIcon(editor)}
                          tooltip='List'
                          dropdown
                        />
                      }
                      desktop={{
                        container: containerRef.current,
                        width: 'w-50',
                      }}
                    />
                  )}
                  <BubbleMenuButton
                    onClick={(e) => {
                      e.stopPropagation()
                      editor.chain().toggleCode().focus().run()
                    }}
                    isActive={editor.isActive('code')}
                    icon={<CodeIcon className='size-4' />}
                    tooltip='Code'
                    shortcut='mod+e'
                  />

                  {enableCodeBlock && (
                    <BubbleMenuButton
                      onClick={(e) => {
                        e.stopPropagation()
                        editor.chain().toggleCodeBlock().focus().run()
                      }}
                      isActive={editor.isActive('codeBlock')}
                      icon={<CodeBlockIcon className='size-4' />}
                      tooltip='Code block'
                      shortcut='mod+alt+c'
                    />
                  )}

                  <BubbleMenuSeparator />

                  <BubbleMenuButton
                    onClick={openLinkEditor}
                    isActive={editor.isActive('link')}
                    icon={<LinkIcon className='size-4' />}
                    tooltip='Link'
                    shortcut='mod+k'
                  />
                </>
              )}
            </>
          )}
        </div>
      </BubbleMenu>

      <BubbleMenu
        pluginKey='bubbleMenuLink'
        editor={editor}
        tippyOptions={{
          onHidden: closeLinkEditor,
          maxWidth: 'auto',
          appendTo: parentContainer,
        }}
        shouldShow={({ editor, from, to }) => {
          // only show the bubble menu for links.
          return from === to && editor.isActive('link')
        }}>
        <div className='text-foreground flex gap-1 rounded-lg bg-background p-1 items-center shadow-lg dark:shadow-[inset_0px_1px_0px_rgb(255_255_255_/_0.04),_inset_0px_0px_0px_1px_rgb(255_255_255_/_0.02),_0px_1px_2px_rgb(0_0_0_/_0.4),_0px_2px_4px_rgb(0_0_0_/_0.08),_0px_0px_0px_0.5px_rgb(0_0_0_/_0.24)]'>
          {linkEditorOpen ? (
            <LinkEditor
              url={url}
              onChangeUrl={setUrl}
              onSaveLink={saveLink}
              onRemoveLink={removeLink}
            />
          ) : (
            <>
              <Tooltip label='Edit link'>
                <Button
                  onClick={openLinkEditor}
                  size='icon'
                  className='size-6 hover:bg-primary-hover active:bg-primary-active'>
                  <PencilIcon className='size-4' />
                </Button>
              </Tooltip>
              <Tooltip label='Delete link'>
                <Button
                  onClick={removeLink}
                  className='size-6 hover:bg-primary-hover active:bg-primary-active'>
                  <TrashIcon />
                </Button>
              </Tooltip>
              {!!url && isValidUrl(url) && (
                <Tooltip label='Open in new tab'>
                  <Button
                    asChild
                    className='size-6 hover:bg-primary-hover active:bg-primary-active'>
                    <Link href={url} target='_blank'>
                      <ExternalLinkIcon className='size-4' />
                    </Link>
                  </Button>
                </Tooltip>
              )}
            </>
          )}
        </div>
      </BubbleMenu>
    </div>
  )
})
