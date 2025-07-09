import { cn } from '@/lib/utils'
import type { Node } from '@tiptap/pm/model'
import { type Editor, NodeViewWrapper } from '@tiptap/react'
import { useCallback, useRef } from 'react'

interface ImageBlockViewProps {
  editor: Editor
  getPos: () => number
  node: Node
  updateAttributes: (attrs: Record<string, string>) => void
}

export const ImageBlockView = (props: ImageBlockViewProps) => {
  const { editor, getPos, node } = props as ImageBlockViewProps & {
    node: Node & {
      attrs: {
        src: string
        width: string
        align: 'left' | 'center' | 'right'
        alt?: string
      }
    }
  }

  const imageWrapperRef = useRef<HTMLDivElement>(null)
  const { src, width, align, alt } = node.attrs

  const wrapperClassName = cn(
    'relative', // Add relative positioning for potential overlays
    align === 'left' ? 'ml-0' : 'ml-auto',
    align === 'right' ? 'mr-0' : 'mr-auto',
    align === 'center' && 'mx-auto'
  )

  const onClick = useCallback(() => {
    editor.commands.setNodeSelection(getPos())
  }, [getPos, editor.commands])

  return (
    <NodeViewWrapper>
      <div className={wrapperClassName} style={{ width }} data-drag-handle>
        <div contentEditable={false} ref={imageWrapperRef}>
          <img
            className='block cursor-pointer hover:opacity-90 transition-opacity'
            src={src}
            alt={alt || ''}
            onClick={onClick}
            draggable={false}
          />
        </div>
      </div>
    </NodeViewWrapper>
  )
}

export default ImageBlockView
