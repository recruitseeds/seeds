'use client'

import type React from 'react'

import { Button } from '@seeds/ui/button'
import { Progress } from '@seeds/ui/progress'
import { cn } from '@seeds/ui/lib/utils'
import { AlertCircle, FileText, Upload, X } from 'lucide-react'
import { useRef, useState } from 'react'

interface ResumeUploaderProps {
  onUpload: (file: File) => void
  isExtracting: boolean
  onCancel: () => void
}

export function ResumeUploader({
  onUpload,
  isExtracting,
  onCancel,
}: ResumeUploaderProps) {
  const [file, setFile] = useState<File | null>(null)
  const [isDragging, setIsDragging] = useState<boolean>(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    validateAndSetFile(selectedFile)
  }

  const validateAndSetFile = (selectedFile: File | undefined) => {
    setUploadError(null)

    if (!selectedFile) {
      return
    }

    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
    ]
    if (!allowedTypes.includes(selectedFile.type)) {
      setUploadError('Please upload a PDF, DOC, DOCX, or TXT file.')
      return
    }

    if (selectedFile.size > 5 * 1024 * 1024) {
      setUploadError('File size must be less than 5MB.')
      return
    }

    setFile(selectedFile)
  }

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(false)
    const droppedFile = e.dataTransfer.files[0]
    validateAndSetFile(droppedFile)
  }

  const handleUploadClick = () => {
    if (file) {
      onUpload(file)
    }
  }

  const handleRemoveFile = () => {
    setFile(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return (
      Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
    )
  }

  return (
    <div className='space-y-4'>
      {!file && !isExtracting ? (
        <div
          className={cn(
            'border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors',
            isDragging
              ? 'border-primary bg-primary/5'
              : 'border-muted-foreground/25 hover:border-primary/50'
          )}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}>
          <div className='flex flex-col items-center justify-center space-y-4'>
            <div className='rounded-full bg-primary/10 p-3'>
              <FileText className='h-8 w-8 text-primary' />
            </div>
            <div>
              <h4 className='text-lg font-medium mb-1'>Upload your resume</h4>
              <p className='text-sm text-muted-foreground mb-2'>
                Drag and drop your file here or click to browse
              </p>
              <p className='text-xs text-muted-foreground'>
                Supported formats: PDF, DOC, DOCX, TXT (Max 5MB)
              </p>
            </div>
            <Button variant='outline' size='sm' className='mt-2'>
              <Upload className='h-4 w-4 mr-2' /> Select File
            </Button>
          </div>
          <input
            type='file'
            ref={fileInputRef}
            onChange={handleFileChange}
            className='hidden'
            accept='.pdf,.doc,.docx,.txt,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain'
          />
        </div>
      ) : (
        <div className='border rounded-lg p-6'>
          {isExtracting ? (
            <div className='space-y-4'>
              <div className='flex items-center justify-between'>
                <div className='flex items-center space-x-3'>
                  <div className='rounded-full bg-primary/10 p-2'>
                    <FileText className='h-5 w-5 text-primary' />
                  </div>
                  <div>
                    <p className='font-medium'>{file?.name}</p>
                    <p className='text-xs text-muted-foreground'>
                      {formatFileSize(file?.size || 0)}
                    </p>
                  </div>
                </div>
                <Button variant='ghost' size='sm' onClick={onCancel}>
                  <X className='h-4 w-4' />
                </Button>
              </div>

              <div className='space-y-2'>
                <div className='flex justify-between text-sm'>
                  <span>Extracting information...</span>
                  <span>Please wait</span>
                </div>
                <Progress value={65} className='h-2' />
              </div>

              <div className='bg-muted p-3 rounded text-sm'>
                <p className='flex items-center'>
                  <AlertCircle className='h-4 w-4 mr-2 text-muted-foreground' />
                  Please don&apos;t close this window while we extract your
                  information
                </p>
              </div>
            </div>
          ) : (
            <div className='flex items-center justify-between'>
              <div className='flex items-center space-x-3'>
                <div className='rounded-full bg-secondary p-2'>
                  <FileText className='h-5 w-5 text-primary' />
                </div>
                <div>
                  <p className='font-medium'>{file?.name}</p>
                  <p className='text-xs text-muted-foreground'>
                    {formatFileSize(file?.size || 0)}
                  </p>
                </div>
              </div>
              <Button variant='ghost' size='sm' onClick={handleRemoveFile}>
                <X className='h-4 w-4' />
              </Button>
            </div>
          )}
        </div>
      )}

      {uploadError && (
        <div className='bg-destructive/10 text-destructive p-3 rounded-md text-sm flex items-start'>
          <AlertCircle className='h-4 w-4 mr-2 mt-0.5 flex-shrink-0' />
          <span>{uploadError}</span>
        </div>
      )}

      {file && !isExtracting && (
        <div className='flex justify-center'>
          <Button onClick={handleUploadClick} size='lg'>
            <Upload className='h-4 w-4 mr-2' /> Upload and Extract Information
          </Button>
        </div>
      )}
    </div>
  )
}
