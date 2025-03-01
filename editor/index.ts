import { DetailsOptions } from '@tiptap-pro/extension-details'
import { NodeViewRenderer } from '@tiptap/core'
import { TaskItemOptions } from '@tiptap/extension-task-item'
import { Document } from './extensions/block-document'
// import { BlockDocument } from './extensions/block-document'
import { Blockquote } from './extensions/block-quote'
import { Bold } from './extensions/bold'
import { BulletList } from './extensions/bullet-list'
import { Code } from './extensions/code'
import {
  CodeBlockHighlighted,
  CodeBlockHighlightedOptions,
} from './extensions/code-block-highlighting'
import { CodeFenceMarkdownParser } from './extensions/code-fence-markdown-parser'
import { Details, DetailsContent, DetailsSummary } from './extensions/details'
import { Dropcursor, DropcursorOptions } from './extensions/drop-cursor'
import { Hardbreak } from './extensions/hard-break'
import { Heading } from './extensions/heading'
import { HorizontalRule } from './extensions/horizontal-rule'
import { ImageMarkdownParser } from './extensions/image-markdown-parser'
import { Italic } from './extensions/italic'
import { Kbd } from './extensions/kbd'
import { Link, LinkOptions } from './extensions/link'
import { LinkUnfurl, LinkUnfurlOptions } from './extensions/link-unfurl'
import { ListItem } from './extensions/list-item'
import { ListKeyMap } from './extensions/list-key-map'
import { OrderedList } from './extensions/ordered-list'
import { Paragraph } from './extensions/paragraph'
import { Placeholder } from './extensions/placeholder'
import { ShiftEnterNewLineExtension } from './extensions/shift-enter-new-line'
import { SoftbreakMarkdownParser } from './extensions/softbreak-markdown-parser'
import { SplitNearHardBreaks } from './extensions/split-near-hard-breaks'
import { Strike } from './extensions/strike'
import { TaskItem } from './extensions/task-item'
import { TaskList } from './extensions/task-list'
import { Text } from './extensions/text'
import { Typography } from './extensions/typography'
import { Underline } from './extensions/underline'

export interface GetMarkdownExtensionsOptions {
  link?: Partial<LinkOptions>

  placeholder?: string

  dropcursor?: Partial<DropcursorOptions>

  linkUnfurl?: Partial<LinkUnfurlOptions> & {
    addNodeView?(): NodeViewRenderer
  }

  codeBlockHighlighted?: Partial<CodeBlockHighlightedOptions>

  enableInlineAttachments?: boolean

  taskItem?: Partial<TaskItemOptions>

  details?: Partial<DetailsOptions>
}

export function getMarkdownExtensions(options?: GetMarkdownExtensionsOptions) {
  return [
    Document,
    // BlockDocument,
    Paragraph,
    Text,
    Code,
    CodeBlockHighlighted.configure(options?.codeBlockHighlighted),
    Bold,
    Blockquote,
    Italic,
    Strike,
    OrderedList,
    BulletList,
    Heading,
    ListItem,
    HorizontalRule,
    Link.configure(options?.link),
    Underline,
    Hardbreak,
    Kbd,
    ListKeyMap,
    CodeFenceMarkdownParser,
    ImageMarkdownParser,
    SoftbreakMarkdownParser,
    SplitNearHardBreaks,
    ShiftEnterNewLineExtension,

    Placeholder.configure({
      placeholder: options?.placeholder,
    }),
    Typography,

    TaskItem.configure(options?.taskItem),
    TaskList,

    Details.configure(options?.details),
    DetailsContent,
    // .extend({
    //   content: '(block|customBlock?)+',
    // }),
    DetailsSummary,

    ...(options?.dropcursor ? [Dropcursor.configure(options?.dropcursor)] : []),

    ...(options?.linkUnfurl
      ? [
          LinkUnfurl.extend({
            addNodeView: options?.linkUnfurl?.addNodeView,
          }),
        ]
      : []),
  ]
}
