import React from 'react'

interface TipTapNode {
  type: string
  content?: TipTapNode[]
  text?: string
  marks?: Array<{
    type: string
    attrs?: Record<string, any>
  }>
  attrs?: Record<string, any>
}

interface TipTapRendererProps {
  content: TipTapNode | null
  className?: string
}

function renderNode(node: TipTapNode): React.JSX.Element | string {
  if (node.type === 'text') {
    let text: React.JSX.Element | string = node.text || ''
    
    if (node.marks) {
      for (const mark of node.marks) {
        switch (mark.type) {
          case 'bold':
            text = <strong key="bold">{text}</strong>
            break
          case 'italic':
            text = <em key="italic">{text}</em>
            break
          case 'code':
            text = <code key="code" className="bg-muted px-1 py-0.5 rounded text-sm">{text}</code>
            break
          case 'link':
            text = (
              <a 
                key="link"
                href={mark.attrs?.href} 
                className="text-blue-600 hover:text-blue-800 underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                {text}
              </a>
            )
            break
        }
      }
    }
    
    return text
  }

  const children = node.content?.map((child, index) => (
    <span key={index}>{renderNode(child)}</span>
  )) || []

  switch (node.type) {
    case 'doc':
      return <div>{children}</div>
    
    case 'paragraph':
      return <p className="mb-4 last:mb-0">{children}</p>
    
    case 'heading':
      const level = node.attrs?.level || 1
      const HeadingTag = `h${Math.min(level, 6)}` as keyof React.JSX.IntrinsicElements
      const headingClasses = {
        1: 'text-3xl font-bold mb-6 mt-8 first:mt-0',
        2: 'text-2xl font-semibold mb-4 mt-6 first:mt-0',
        3: 'text-xl font-semibold mb-3 mt-4 first:mt-0',
        4: 'text-lg font-semibold mb-2 mt-3 first:mt-0',
        5: 'text-base font-semibold mb-2 mt-2 first:mt-0',
        6: 'text-sm font-semibold mb-2 mt-2 first:mt-0',
      }
      return (
        <HeadingTag className={headingClasses[level as keyof typeof headingClasses]}>
          {children}
        </HeadingTag>
      )
    
    case 'bulletList':
      return <ul className="list-disc ml-6 mb-4 space-y-2">{children}</ul>
    
    case 'orderedList':
      return <ol className="list-decimal ml-6 mb-4 space-y-2">{children}</ol>
    
    case 'listItem':
      return <li className="leading-relaxed">{children}</li>
    
    case 'blockquote':
      return (
        <blockquote className="border-l-4 border-gray-300 pl-4 italic my-4 text-muted-foreground">
          {children}
        </blockquote>
      )
    
    case 'codeBlock':
      return (
        <pre className="bg-muted p-4 rounded-lg overflow-x-auto mb-4">
          <code className="text-sm">{children}</code>
        </pre>
      )
    
    case 'horizontalRule':
      return <hr className="border-border my-8" />
    
    case 'hardBreak':
      return <br />
    
    default:
      console.warn(`Unknown node type: ${node.type}`)
      return <div>{children}</div>
  }
}

export function TipTapRenderer({ content, className = '' }: TipTapRendererProps) {
  if (!content) {
    return (
      <div className={`text-muted-foreground ${className}`}>
        No job description available.
      </div>
    )
  }

  try {
    return (
      <div className={`prose prose-neutral dark:prose-invert max-w-none ${className}`}>
        {renderNode(content)}
      </div>
    )
  } catch (error) {
    console.error('Error rendering TipTap content:', error)
    return (
      <div className={`text-muted-foreground ${className}`}>
        Unable to display job description.
      </div>
    )
  }
}