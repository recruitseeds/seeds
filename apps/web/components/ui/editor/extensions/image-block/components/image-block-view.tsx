import { cn } from './lib/utils'
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

  const isFullWidth = width === '100%'

  const wrapperClassName = cn(
    'relative flex', 
    {
      'justify-start': align === 'left',
      'justify-center': align === 'center',
      'justify-end': align === 'right',
    }
  )

  const imageClassName = cn('block cursor-pointer hover:opacity-90 transition-opacity rounded-md', {
    
    'w-full': isFullWidth,
    
    'max-w-full h-auto': !isFullWidth,
  })

  const onClick = useCallback(() => {
    const pos = getPos()
    editor.commands.setNodeSelection(pos)
    editor.commands.focus()
  }, [getPos, editor])

  return (
    <NodeViewWrapper>
      <div
        className={wrapperClassName}
        style={{
          width: '100%', 
        }}
        data-drag-handle>
        <div
          contentEditable={false}
          ref={imageWrapperRef}
          style={{
            width: isFullWidth ? '100%' : width,
            transition: 'width 0.2s ease', 
          }}>
          <img className={imageClassName} src={src} alt={alt || ''} onClick={onClick} draggable={false} />
        </div>
      </div>
    </NodeViewWrapper>
  )
}

export default ImageBlockView
