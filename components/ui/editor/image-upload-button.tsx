import type { ButtonProps } from '@/components/ui/button'
import { Button } from '@/components/ui/editor/button'
import { useTiptapEditor } from '@/hooks/use-tiptap-editor'
import { API } from '@/lib/api'
import type { Editor } from '@tiptap/react'
import { ImagePlus, Loader2 } from 'lucide-react'
import * as React from 'react'
import { toast } from 'sonner'

export interface ImageUploadButtonProps extends ButtonProps {
  editor?: Editor | null
  text?: string
  extensionName?: string
}

export function isImageActive(editor: Editor | null, extensionName: string): boolean {
  if (!editor) return false
  return editor.isActive(extensionName)
}

export function insertImageUpload(editor: Editor | null, extensionName: string): boolean {
  if (!editor) return false

  return editor
    .chain()
    .focus()
    .insertContent({
      type: extensionName,
    })
    .run()
}

export function useImageUploadButton(editor: Editor | null, extensionName = 'imageUpload', disabled = false) {
  const [isUploading, setIsUploading] = React.useState(false)
  const fileInputRef = React.useRef<HTMLInputElement>(null)
  const isActive = isImageActive(editor, extensionName)

  const handleFileUpload = React.useCallback(
    async (file: File) => {
      if (!editor || disabled) return
      setIsUploading(true)
      try {
        const url = await API.uploadImage(file)
        console.log('Upload successful, URL:', url) // This should show the full Cloudflare URL

        // Also log what's about to be inserted
        console.log('About to insert image with URL:', url)

        // Insert ImageBlock directly like your old toolbar
        const result = editor.chain().focus().setImageBlock({ src: url }).run()
        console.log('setImageBlock result:', result)

        toast.success('Image uploaded successfully')
      } catch (error: any) {
        const errorMessage = error?.message || 'Failed to upload image'
        toast.error(errorMessage)
      } finally {
        setIsUploading(false)
      }
    },
    [editor, disabled]
  )

  const handleFileInputChange = React.useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0]
      if (file) {
        handleFileUpload(file)
      }
      // Reset the input so the same file can be selected again
      event.target.value = ''
    },
    [handleFileUpload]
  )

  const handleUploadClick = React.useCallback(() => {
    if (disabled || isUploading) return
    fileInputRef.current?.click()
  }, [disabled, isUploading])

  const handleInsertImageUpload = React.useCallback(() => {
    if (disabled) return false
    return insertImageUpload(editor, extensionName)
  }, [editor, extensionName, disabled])

  return {
    isActive,
    isUploading,
    fileInputRef,
    handleUploadClick,
    handleFileInputChange,
    handleInsertImageUpload,
  }
}

export const ImageUploadButton = React.forwardRef<HTMLButtonElement, ImageUploadButtonProps>(
  (
    {
      editor: providedEditor,
      extensionName = 'imageUpload',
      text,
      className = '',
      disabled,
      onClick,
      children,
      ...buttonProps
    },
    ref
  ) => {
    const editor = useTiptapEditor(providedEditor)
    const { isActive, isUploading, fileInputRef, handleUploadClick, handleFileInputChange } = useImageUploadButton(
      editor,
      extensionName,
      disabled
    )

    const handleClick = React.useCallback(
      (e: React.MouseEvent<HTMLButtonElement>) => {
        onClick?.(e)

        if (!e.defaultPrevented && !disabled && !isUploading) {
          handleUploadClick()
        }
      },
      [onClick, disabled, isUploading, handleUploadClick]
    )

    if (!editor || !editor.isEditable) {
      return null
    }

    return (
      <>
        <Button
          ref={ref}
          type='button'
          className={`${className.trim()} h-9`}
          data-style='ghost'
          variant='ghost'
          data-active-state={isActive ? 'on' : 'off'}
          role='button'
          tabIndex={-1}
          aria-label='Add image'
          aria-pressed={isActive}
          tooltip='Add image'
          disabled={disabled || isUploading}
          onClick={handleClick}
          {...buttonProps}>
          {children || (
            <>
              {isUploading ? <Loader2 className='h-4 w-4 animate-spin' /> : <ImagePlus className='h-4 w-4' />}
              {text && <span className='tiptap-button-text'>{text}</span>}
            </>
          )}
        </Button>

        <input type='file' accept='image/*' ref={fileInputRef} className='hidden' onChange={handleFileInputChange} />
      </>
    )
  }
)

ImageUploadButton.displayName = 'ImageUploadButton'

export default ImageUploadButton
