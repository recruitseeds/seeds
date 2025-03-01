'use client'
import { AppSidebar } from '@/components/left-sidebar'
import { RightAppSidebar } from '@/components/right-sidebar'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { Button } from '@/components/ui/button'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import { getMarkdownExtensions } from '@/editor'
import { useBreakpoint } from '@/hooks/use-breakpoint'
import { EditorContent, useEditor } from '@tiptap/react'
import React, { useMemo } from 'react'

interface MarkdownEditorProps {
  placeholder?: string
  onChange?: (html: string) => void
  editable?: boolean
}

const MarkdownEditor: React.FC<MarkdownEditorProps> = ({
  placeholder = 'Start typing...',
  onChange,
  editable = true,
}) => {
  const extensions = useMemo(() => {
    return [
      ...getMarkdownExtensions({
        placeholder,
      }),
    ]
  }, [placeholder])

  const isMobile = useBreakpoint('lg', 'max')

  const editor = useEditor(
    {
      extensions,
      editable,
      onUpdate: ({ editor }) => {
        onChange?.(editor.getHTML())
      },
      editorProps: {
        attributes: {
          class:
            'prose w-full min-h-[200px] p-4 focus:outline-none cursor-text',
        },
      },
    },
    [extensions]
  )

  if (!editor) {
    return <div>Loading editor...</div>
  }

  return (
    <SidebarProvider
      ignoreKeyboardShortcut
      style={
        {
          '--sidebar-width': '15rem',
        } as React.CSSProperties
      }>
      <AppSidebar />
      <SidebarInset>
        <header className='flex h-16 shrink-0 items-center justify-between px-8'>
          <div className='flex items-center gap-2'>
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem className='hidden md:block'>
                  <BreadcrumbLink href='#'>
                    Building Your Application
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className='hidden md:block' />
                <BreadcrumbItem>
                  <BreadcrumbPage>Data Fetching</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
          <div className='flex items-center'>
            <Button variant='secondary'>Preview</Button>
          </div>
        </header>
        <div className='flex flex-col'>
          <div
            className='border rounded-md cursor-text mx-8'
            onClick={() => editor.chain().focus()}>
            <EditorContent editor={editor} className='w-full min-h-100dvh' />
          </div>
          <div className='flex gap-2 justify-end mt-2 mx-8'>
            <Button variant='secondary'>Cancel</Button>
            <Button variant='brand'>Save</Button>
          </div>
        </div>
      </SidebarInset>
      {!isMobile && <RightAppSidebar side='right' />}
    </SidebarProvider>
  )
}

export default MarkdownEditor
