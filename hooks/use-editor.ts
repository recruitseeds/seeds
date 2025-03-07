import type { EditorUser } from '@/components/editor/types'
import { initialContent } from '@/data/initial-content'
import type { AnyExtension, Editor, EditorOptions } from '@tiptap/core'
import { useEditor, useEditorState } from '@tiptap/react'
import { useEffect } from 'react'
import { ExtensionKit } from '../editor/extensions/extension-kit'

export function randomElement<T>(array: Array<T>): T {
  return array[Math.floor(Math.random() * array.length)]
}

declare global {
  interface Window {
    editor: Editor | null
  }
}

export const useBlockEditor = (
  options: Partial<Omit<EditorOptions, 'extensions'>> = {}
) => {
  const editor = useEditor({
    ...options,
    immediatelyRender: false,
    shouldRerenderOnTransaction: false,
    autofocus: true,
    onCreate: (ctx) => {
      if (ctx.editor.isEmpty) {
        ctx.editor.commands.setContent(initialContent)
        ctx.editor.commands.focus('start', { scrollIntoView: true })
      }

      if (options.onCreate) {
        options.onCreate(ctx)
      }
    },
    extensions: [...ExtensionKit()].filter(
      (e): e is AnyExtension => e !== undefined
    ),
    editorProps: {
      attributes: {
        autocomplete: 'off',
        autocorrect: 'on',
        autocapitalize: 'off',
        class:
          'prose outline-none focus:outline-none focus:ring-0 focus:shadow-none mb-15 mt-5 text-foreground min-h-[calc(100vh-160px)]',
      },
    },
  })

  const users = useEditorState({
    editor,
    selector: (ctx): (EditorUser & { initials: string })[] => {
      if (!ctx.editor?.storage.collaborationCursor?.users) {
        return []
      }
      return ctx.editor.storage.collaborationCursor.users.map(
        (user: EditorUser) => {
          const names = user.name?.split(' ')
          const firstName = names?.[0]
          const lastName = names?.[names.length - 1]
          const initials = `${firstName?.[0] || '?'}${lastName?.[0] || '?'}`
          return { ...user, initials: initials.length ? initials : '?' }
        }
      )
    },
  })

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.editor = editor
    }
  }, [editor])

  return { editor, users }
}
