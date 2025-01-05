'use client'

import BulletList from '@tiptap/extension-bullet-list'
import OrderedList from '@tiptap/extension-ordered-list'
import TextAlign from '@tiptap/extension-text-align'
import Underline from '@tiptap/extension-underline'
import { EditorContent, useEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { EditorMenuBar } from './editor-menu-bar'

const TEMPLATES = {
  companyInfo: `
    <h2>About My Company</h2>
    <p>We are a leader in our industry, committed to delivering high-quality services and fostering innovation.</p>
    <h3>Responsibilities</h3>
    <ul>
      <li>Collaborate with cross-functional teams to achieve goals.</li>
      <li>Ensure deliverables meet quality standards.</li>
      <li>Adapt and grow in a fast-paced environment.</li>
    </ul>
  `,
  jobDescription: `
    <h2>Job Description</h2>
    <p>This is a detailed job description for the position being offered. Please review the responsibilities and qualifications required.</p>
  `,
}

export function Editor() {
  const editor = useEditor({
    extensions: [
      Underline,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      OrderedList.configure({
        HTMLAttributes: {
          class: 'ordered-list',
        },
      }),
      BulletList.configure({
        HTMLAttributes: {
          class: 'bullet-list',
        },
      }),
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3, 4],
        },
        bulletList: false,
        orderedList: false,
      }),
    ],
    editorProps: {
      attributes: {
        class:
          'prose prose-sm sm:prose lg:prose-lg xl:prose-2xl mx-auto min-h-[500px] rounded-lg border bg-gray-200 p-5 text-black focus:outline-none',
      },
    },
  })

  if (!editor) return null

  return (
    <div className="relative w-full">
      <EditorMenuBar editor={editor} templates={TEMPLATES} />
      <EditorContent editor={editor} />
    </div>
  )
}
