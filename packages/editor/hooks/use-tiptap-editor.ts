import type { Editor } from '@tiptap/react'

/**
 * Hook to use the TipTap editor instance.
 * Currently just returns the provided editor, but can be extended
 * to use context in the future if needed.
 */
export function useTiptapEditor(editor: Editor | null | undefined): Editor | null {
  return editor || null
}