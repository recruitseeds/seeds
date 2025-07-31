'use client'

import { Button } from '../ui/button'
import { formatBytes, useFileUpload } from '@/hooks/use-file-upload'
import { AlertCircleIcon, PaperclipIcon, UploadIcon, XIcon } from 'lucide-react'

interface CandidateApplicationFileUploaderProps {
  onFileSelect: (file: File | null) => void
  maxSize?: number
  accept?: string
}

export function CandidateApplicationFileUploader({
  onFileSelect,
  maxSize = 10 * 1024 * 1024,
  accept,
}: CandidateApplicationFileUploaderProps) {
  const [
    { files, isDragging, errors },
    {
      handleDragEnter,
      handleDragLeave,
      handleDragOver,
      handleDrop,
      openFileDialog,
      removeFile,
      getInputProps,
    },
  ] = useFileUpload({
    maxSize,
    multiple: false,
    accept,
    onFilesChange: (newFiles) => {
      setTimeout(() => {
        onFileSelect(newFiles.length > 0 ? newFiles[0].file : null)
      }, 0)
    },
  })

  const currentFileDisplay = files[0]

  const handleRemove = () => {
    if (currentFileDisplay) {
      removeFile(currentFileDisplay.id)
      onFileSelect(null)
    }
  }

  return (
    <div className='flex flex-col gap-2'>
      <div
        role='button'
        tabIndex={currentFileDisplay ? -1 : 0}
        onClick={!currentFileDisplay ? openFileDialog : undefined}
        onKeyPress={
          !currentFileDisplay
            ? (e) => (e.key === 'Enter' || e.key === ' ') && openFileDialog()
            : undefined
        }
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        data-dragging={isDragging || undefined}
        className={`border-input hover:bg-accent/50 data-[dragging=true]:bg-accent/50 has-[input:focus-visible]:border-ring has-[input:focus-visible]:ring-ring/50 flex min-h-40 flex-col items-center justify-center rounded-xl border border-dashed p-4 transition-colors ${
          currentFileDisplay ? 'cursor-default opacity-70' : 'cursor-pointer'
        } focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2`}
        aria-disabled={!!currentFileDisplay}>
        <input
          {...getInputProps()}
          className='sr-only'
          aria-label='Upload file'
          disabled={!!currentFileDisplay}
        />

        <div className='flex flex-col items-center justify-center text-center'>
          <div
            className='bg-background mb-2 flex size-11 shrink-0 items-center justify-center rounded-full border'
            aria-hidden='true'>
            <UploadIcon className='size-4 opacity-60' />
          </div>
          <p className='mb-1.5 text-sm font-medium'>
            {currentFileDisplay ? 'File selected' : 'Upload file'}
          </p>
          <p className='text-muted-foreground text-xs'>
            Drag & drop or click to browse (max. {formatBytes(maxSize)})
          </p>
        </div>
      </div>

      {errors.length > 0 && (
        <div
          className='text-destructive flex items-center gap-1 text-xs'
          role='alert'>
          <AlertCircleIcon className='size-3 shrink-0' />
          <span>{errors[0]}</span>
        </div>
      )}

      {currentFileDisplay && (
        <div className='space-y-2'>
          <div
            key={currentFileDisplay.id}
            className='flex items-center justify-between gap-2 rounded-xl border px-4 py-2'>
            <div className='flex items-center gap-3 overflow-hidden'>
              <PaperclipIcon
                className='size-4 shrink-0 opacity-60'
                aria-hidden='true'
              />
              <div className='min-w-0'>
                <p className='truncate text-[13px] font-medium'>
                  {currentFileDisplay.file.name}
                </p>
              </div>
            </div>

            <Button
              size='icon'
              variant='ghost'
              className='text-muted-foreground/80 hover:text-foreground -me-2 size-8 hover:bg-transparent'
              onClick={handleRemove}
              aria-label='Remove file'>
              <XIcon className='size-4' aria-hidden='true' />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
