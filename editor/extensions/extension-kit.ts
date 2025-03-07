'use client'

import { API } from '@/lib/api'
import { BlockquoteFigure } from './blockquote-figure'
import { CodeBlock } from './code-block'
import { Document } from './document'
import { emojiSuggestion } from './emoji-suggestion'
import { Figcaption } from './figcaption'
import { FontSize } from './font-size'
import { Heading } from './heading'
import { HorizontalRule } from './horizontal-rule'
import { ImageBlock } from './image-block'
import { Link } from './link'
import { Column } from './multi-column'
import { Columns } from './multi-column/columns'
import { Selection } from './selection'
import { SlashCommand } from './slash-command'
import { SplitNearHardBreaks } from './split-near-hard-breaks'
import { TrailingNode } from './trailing-node'

import {
  CharacterCount,
  Color,
  Details,
  DetailsContent,
  DetailsSummary,
  Dropcursor,
  Emoji,
  FileHandler,
  Focus,
  FontFamily,
  Highlight,
  Placeholder,
  StarterKit,
  Subscript,
  Superscript,
  TextAlign,
  TextStyle,
  Typography,
  Underline,
  UniqueID,
} from '.'

import { isChangeOrigin } from '@tiptap/extension-collaboration'
import { ImageUpload } from './image-upload'

export const ExtensionKit = () => [
  Document,
  Columns,
  Column,
  Selection,
  SplitNearHardBreaks,
  Heading.configure({
    levels: [1, 2, 3, 4, 5, 6],
  }),
  HorizontalRule,
  UniqueID.configure({
    types: ['paragraph', 'heading', 'blockquote', 'codeBlock', 'table'],
    filterTransaction: (transaction) => !isChangeOrigin(transaction),
  }),
  StarterKit.configure({
    document: false,
    dropcursor: false,
    heading: false,
    horizontalRule: false,
    blockquote: false,
    history: false,
    codeBlock: false,
  }),
  Details.configure({
    persist: true,
    HTMLAttributes: {
      class: 'details',
    },
  }),
  DetailsContent,
  DetailsSummary,
  CodeBlock,
  TextStyle,
  FontSize,
  FontFamily,
  Color,
  TrailingNode,
  Link.configure({
    openOnClick: false,
  }),
  Highlight.configure({ multicolor: true }),
  Underline,
  CharacterCount.configure({ limit: 50000 }),
  ImageUpload,
  ImageBlock,
  FileHandler.configure({
    allowedMimeTypes: ['image/png', 'image/jpeg', 'image/gif', 'image/webp'],
    onDrop: (currentEditor, files, pos) => {
      files.forEach(async (file) => {
        const url = await API.uploadImage(file)

        currentEditor.chain().setImageBlockAt({ pos, src: url }).focus().run()
      })
    },
    onPaste: (currentEditor, files) => {
      files.forEach(async (file) => {
        const url = await API.uploadImage(file)

        return currentEditor
          .chain()
          .setImageBlockAt({
            pos: currentEditor.state.selection.anchor,
            src: url,
          })
          .focus()
          .run()
      })
    },
  }),
  Emoji.configure({
    enableEmoticons: true,
    suggestion: emojiSuggestion,
  }),
  TextAlign.extend({
    addKeyboardShortcuts() {
      return {}
    },
  }).configure({
    types: ['heading', 'paragraph'],
  }),
  Subscript,
  Superscript,
  Typography,
  Placeholder.configure({
    includeChildren: true,
    showOnlyCurrent: false,
    placeholder: () => '',
  }),
  SlashCommand,
  Focus,
  Figcaption,
  BlockquoteFigure,
  Dropcursor.configure({
    width: 2,
    class: 'ProseMirror-dropcursor border-black',
  }),
]

export default ExtensionKit
