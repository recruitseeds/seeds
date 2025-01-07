'use client'

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type { Editor } from '@tiptap/react'
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  ChevronDown,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
} from 'lucide-react'
import { Bold as BoldIcon } from './icons/bold'
import { Code } from './icons/code'
import { Italic } from './icons/italic'
import { Strikethrough } from './icons/strikethrough'
import { Underline as UnderlineIcon } from './icons/underline'

export function EditorMenuBar({
  editor,
  templates,
}: {
  editor: Editor
  templates: Record<string, string>
}) {
  if (!editor) return null

  const applyTemplate = (templateKey: keyof typeof templates) => {
    const templateContent = templates[templateKey].replace(/\n\s+/g, '\n')
    editor.chain().focus().insertContent(templateContent.trim()).run()
  }

  const insertItem = (item: string) => {
    editor.chain().focus().insertContent(item).run()
  }

  const isActive = (type: string, options = {}) =>
    editor.isActive(type, options)

  return (
    <div className="mb-2 mt-5 flex items-stretch overflow-x-scroll rounded-lg border">
      {/* Text Styles Dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger className="flex w-[128px] items-center justify-between gap-3 border-r px-3 hover:bg-secondary">
          Text
          <ChevronDown className="h-4 w-4" />
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem
            onClick={() => {
              editor.chain().focus().setParagraph().run()
            }}
            className="flex items-center gap-2"
          >
            <AlignLeft className="h-4 w-4" />
            Paragraph
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => {
              editor.chain().focus().toggleHeading({ level: 1 }).run()
            }}
            className="flex items-center gap-2"
          >
            <Heading1 className="h-4 w-4" />
            Heading 1
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => {
              editor.chain().focus().toggleHeading({ level: 2 }).run()
            }}
            className="flex items-center gap-2"
          >
            <Heading2 className="h-4 w-4" />
            Heading 2
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => {
              editor.chain().focus().toggleHeading({ level: 3 }).run()
            }}
            className="flex items-center gap-2"
          >
            <Heading3 className="h-4 w-4" />
            Heading 3
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Formatting Buttons */}
      <button
        onClick={() => editor.chain().focus().toggleBold().run()}
        className={`p-2 hover:bg-white/10 ${
          isActive('bold') ? 'bg-white/10' : ''
        }`}
      >
        <BoldIcon className="size-4" />
      </button>
      <button
        onClick={() => editor.chain().focus().toggleItalic().run()}
        className={`p-2 hover:bg-white/10 ${
          isActive('italic') ? 'bg-white/10' : ''
        }`}
      >
        <Italic className="size-4" />
      </button>
      <button
        onClick={() => editor.chain().focus().toggleUnderline().run()}
        className={`p-2 hover:bg-white/10 ${
          isActive('underline') ? 'bg-white/10' : ''
        }`}
      >
        <UnderlineIcon className="h-4 w-4" />
      </button>
      <button
        onClick={() => editor.chain().focus().toggleStrike().run()}
        className={`p-2 hover:bg-white/10 ${
          isActive('strike') ? 'bg-white/10' : ''
        }`}
      >
        <Strikethrough className="h-4 w-4" />
      </button>
      <button
        onClick={() => editor.chain().focus().toggleCode().run()}
        className={`border-r p-2 hover:bg-white/10 ${
          isActive('code') ? 'bg-white/10' : ''
        }`}
      >
        <Code className="h-4 w-4" />
      </button>

      {/* Text Alignment */}
      <button
        onClick={() => editor.chain().focus().setTextAlign('left').run()}
        className={`p-2 hover:bg-white/10 ${
          isActive({ textAlign: 'left' }) ? 'bg-white/10' : ''
        }`}
      >
        <AlignLeft className="h-4 w-4" />
      </button>
      <button
        onClick={() => editor.chain().focus().setTextAlign('center').run()}
        className={`p-2 hover:bg-white/10 ${
          isActive({ textAlign: 'center' }) ? 'bg-white/10' : ''
        }`}
      >
        <AlignCenter className="h-4 w-4" />
      </button>
      <button
        onClick={() => editor.chain().focus().setTextAlign('right').run()}
        className={`border-r p-2 hover:bg-white/10 ${
          isActive({ textAlign: 'right' }) ? 'bg-white/10' : ''
        }`}
      >
        <AlignRight className="h-4 w-4" />
      </button>

      {/* List Buttons */}
      <button
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        className={`p-2 hover:bg-white/10 ${
          isActive('orderedList') ? 'bg-white/10' : ''
        }`}
      >
        <ListOrdered className="h-4 w-4" />
      </button>
      <button
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        className={`p-2 hover:bg-white/10 ${
          isActive('bulletList') ? 'bg-white/10' : ''
        }`}
      >
        <List className="h-4 w-4" />
      </button>

      {/* Templates Dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger className="flex items-center gap-3 border-x px-3 hover:bg-secondary">
          Templates
          <ChevronDown className="h-4 w-4" />
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem
            onClick={() => {
              applyTemplate('companyInfo')
              editor.chain().focus() // Ensure editor regains focus
            }}
          >
            Company Information
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => {
              applyTemplate('jobDescription')
              editor.chain().focus()
            }}
          >
            Job Description
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Insert Dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger className="flex items-center gap-3 border-r px-3 hover:bg-secondary">
          Insert
          <ChevronDown className="h-4 w-4" />
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem
            onClick={() => {
              insertItem('Job Type: Full Time')
            }}
          >
            Job Type
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => {
              insertItem('Salary Range: $50,000 - $80,000')
            }}
          >
            Salary Range
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => {
              insertItem('Location: Remote')
            }}
          >
            Location
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
