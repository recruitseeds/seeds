'use client'

import {
  type CandidateFileUploadsActionResult,
  handleCandidateFileUploadsAction,
} from '@/actions/create-file-uploads-action'
import { Button } from '@seeds/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@seeds/ui/card'
import { Input } from '@seeds/ui/input'
import { Label } from '@seeds/ui/label'
import type { CandidateUploadedFileMetadata } from '@/supabase/mutations'
import { FileIcon, FileImage, FileSpreadsheet, FileText, Loader2, Upload, X } from 'lucide-react'
import { useAction } from 'next-safe-action/hooks'
import { useRouter } from 'next/navigation'
import type React from 'react'
import { useCallback, useId, useState } from 'react'

interface ClientFileData {
  file: File
  previewUrl: string
  id: string
  isExisting?: boolean
  existingFileName?: string
  existingFileSize?: number
  existingStoragePath?: string
}

interface OnboardingFilesFormProps {
  initialResume?: CandidateUploadedFileMetadata | null
}

export function OnboardingFilesForm({ initialResume }: OnboardingFilesFormProps) {
  const router = useRouter()
  const [coverLetter, setCoverLetter] = useState<ClientFileData | null>(null)
  const [transcript, setTranscript] = useState<ClientFileData | null>(null)
  const [otherFiles, setOtherFiles] = useState<ClientFileData[]>([])

  const formDomId = useId()
  const [resume, setResume] = useState<ClientFileData | null>(() => {
    if (initialResume) {
      return {
        file: new File([], initialResume.file_name, {
          type: initialResume.mime_type || undefined,
        }),
        previewUrl: '',
        id: initialResume.id,
        isExisting: true,
        existingFileName: initialResume.file_name,
        existingFileSize: initialResume.size_bytes || 0,
        existingStoragePath: initialResume.storage_path,
      }
    }
    return null
  })

  const { execute: uploadFilesAction, status } = useAction(handleCandidateFileUploadsAction, {
    onSuccess: (result) => {
      const serverResponse = result.data as CandidateFileUploadsActionResult | undefined

      if (!serverResponse) {
        console.error('[OnboardingFilesForm] onSuccess: Server response wrapper is undefined.', result)
        return
      }

      if (serverResponse.success && serverResponse.results) {
        const resumeResult = serverResponse.results.find((r) => r.originalClientKey === 'resume')
        if (resumeResult?.parsed_resume_data) {
          console.log('Parsed Resume Data:', resumeResult.parsed_resume_data)
        }
        router.push('/candidate-onboarding/complete')
      } else if (!serverResponse.success && serverResponse.error) {
        console.error('File processing error from action:', serverResponse.error)
      } else if (serverResponse.success && (!serverResponse.results || serverResponse.results.length === 0)) {
        router.push('/candidate-onboarding/complete')
      } else {
        console.error('Unexpected file processing result:', serverResponse)
      }
    },
    onError: (errorHookPayload) => {
      console.error('[OnboardingFilesForm] File upload action hook error:', errorHookPayload)
    },
  })

  const isSubmitting = status === 'executing'

  const formatFileSize = (bytes: number | string | null | undefined): string => {
    const numericBytes = Number(bytes || 0)

    if (Number.isNaN(numericBytes) || numericBytes <= 0) {
      return '0 Bytes'
    }

    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    if (numericBytes < 1) return `${numericBytes} Bytes`

    const i = Math.floor(Math.log(numericBytes) / Math.log(k))
    const index = Math.min(i, sizes.length - 1)

    const sizeValue = Number.parseFloat((numericBytes / k ** index).toFixed(2))
    if (Number.isNaN(sizeValue)) {
      return 'N/A'
    }

    return `${sizeValue}${sizes[index]}`
  }

  const handleFileSelection = useCallback(
    (
      event: React.ChangeEvent<HTMLInputElement>,
      setFileState: React.Dispatch<React.SetStateAction<ClientFileData | null>>
    ) => {
      const file = event.target.files?.[0]
      if (file) {
        setFileState({
          file,
          previewUrl: URL.createObjectURL(file),
          id: crypto.randomUUID(),
          isExisting: false,
        })
      }
      event.target.value = ''
    },
    []
  )

  const handleMultipleFileSelection = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (files) {
      const newFiles: ClientFileData[] = Array.from(files).map((file) => ({
        file,
        previewUrl: URL.createObjectURL(file),
        id: crypto.randomUUID(),
        isExisting: false,
      }))
      setOtherFiles((prevFiles) => [...prevFiles, ...newFiles])
    }
    event.target.value = ''
  }, [])

  const removeFile = useCallback(
    (type: 'resume' | 'coverLetter' | 'transcript' | 'other', fileId?: string) => {
      if (type === 'resume' && resume) {
        if (!resume.isExisting && resume.previewUrl) URL.revokeObjectURL(resume.previewUrl)
        setResume(null)
      } else if (type === 'coverLetter' && coverLetter) {
        if (coverLetter.previewUrl) URL.revokeObjectURL(coverLetter.previewUrl)
        setCoverLetter(null)
      } else if (type === 'transcript' && transcript) {
        if (transcript.previewUrl) URL.revokeObjectURL(transcript.previewUrl)
        setTranscript(null)
      } else if (type === 'other' && fileId) {
        const fileToRemove = otherFiles.find((f) => f.id === fileId)
        if (fileToRemove && !fileToRemove.isExisting && fileToRemove.previewUrl)
          URL.revokeObjectURL(fileToRemove.previewUrl)
        setOtherFiles((currentOtherFiles) => currentOtherFiles.filter((f) => f.id !== fileId))
      }
    },
    [resume, coverLetter, transcript, otherFiles]
  )

  const getFileIcon = (fileName: string | undefined) => {
    if (!fileName) return <FileIcon className='h-8 w-8 text-gray-500' />
    const extension = fileName.split('.').pop()?.toLowerCase()
    if (['pdf', 'doc', 'docx'].includes(extension || '')) {
      return <FileText className='size-8' />
    }
    if (['jpg', 'jpeg', 'png', 'gif'].includes(extension || '')) {
      return <FileImage className='size-8' />
    }
    if (['xls', 'xlsx', 'csv'].includes(extension || '')) {
      return <FileSpreadsheet className='size-6' />
    }
    return <FileIcon className='size-8' />
  }

  const handleContinue = async () => {
    const formData = new FormData()
    let filesAddedToFormData = 0

    if (resume?.file && !resume.isExisting) {
      formData.append('resume', resume.file, resume.file.name)
      filesAddedToFormData++
    } else if (resume?.isExisting) {
      console.log('Skipping resume upload, using existing one:', resume.existingFileName)
    }

    if (coverLetter?.file && !coverLetter.isExisting) {
      formData.append('coverLetter', coverLetter.file, coverLetter.file.name)
      filesAddedToFormData++
    }
    if (transcript?.file && !transcript.isExisting) {
      formData.append('transcript', transcript.file, transcript.file.name)
      filesAddedToFormData++
    }
    for (const fileData of otherFiles) {
      if (!fileData.isExisting) {
        formData.append('otherFiles', fileData.file, fileData.file.name)
        filesAddedToFormData++
      }
    }

    if (filesAddedToFormData === 0) {
      router.push('/candidate-onboarding/complete')
      return
    }

    ;(uploadFilesAction as unknown as (input: FormData) => void)(formData)
  }

  const handlePrevious = () => {
    router.push('/candidate-onboarding/experience')
  }

  const renderFileUploadCard = (
    title: string,
    description: string,
    fileData: ClientFileData | null,
    onFileChange: (event: React.ChangeEvent<HTMLInputElement>) => void,
    onRemove: () => void,
    inputId: string,
    acceptTypes: string,
    DefaultIcon: React.ElementType = FileText
  ) => (
    <Card flat>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        {fileData ? (
          <div className='flex items-start p-4 border rounded-lg'>
            <div className='mr-4'>
              {getFileIcon(fileData.isExisting ? fileData.existingFileName : fileData.file.name)}
            </div>
            <div className='flex-1 min-w-0'>
              <p className='font-medium truncate'>
                {fileData.isExisting ? fileData.existingFileName : fileData.file.name}
              </p>
              <p className='text-sm text-muted-foreground'>
                {formatFileSize(fileData.isExisting ? fileData.existingFileSize : fileData.file.size)}
              </p>
            </div>
            <Button variant='ghost' size='icon' className='ml-2' onClick={onRemove} disabled={isSubmitting}>
              <X className='h-4 w-4' />
              <span className='sr-only'>Remove {title}</span>
            </Button>
          </div>
        ) : (
          <div className='flex flex-col items-center justify-center p-6 border border-dashed rounded-lg'>
            <DefaultIcon className='h-10 w-10 text-muted-foreground mb-2' />
            <Label htmlFor={inputId} className='cursor-pointer text-center'>
              <div className='flex flex-col items-center'>
                <p className='text-sm text-muted-foreground mb-1'>Drag & drop or click to upload</p>
                <Button size='sm' variant='secondary' type='button' className='mt-2' asChild>
                  <span>
                    <Upload className='h-4 w-4 mr-2' /> Select File
                  </span>
                </Button>
              </div>
              <Input
                id={inputId}
                type='file'
                accept={acceptTypes}
                className='hidden'
                onChange={onFileChange}
                disabled={isSubmitting}
              />
            </Label>
          </div>
        )}
      </CardContent>
    </Card>
  )

  return (
    <div className='space-y-6'>
      <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
        {renderFileUploadCard(
          'Resume',
          resume?.isExisting ? 'Previously uploaded resume. You can replace it.' : 'Upload your most recent resume',
          resume,
          (e) => handleFileSelection(e, setResume),
          () => removeFile('resume'),
          `${formDomId}-resume-upload`,
          '.pdf,.doc,.docx,.txt',
          FileText
        )}
        {renderFileUploadCard(
          'Cover Letter',
          'Upload your cover letter (optional)',
          coverLetter,
          (e) => handleFileSelection(e, setCoverLetter),
          () => removeFile('coverLetter'),
          `${formDomId}-cover-letter-upload`,
          '.pdf,.doc,.docx,.txt',
          FileText
        )}
        {renderFileUploadCard(
          'Transcript',
          'Upload academic transcript (optional)',
          transcript,
          (e) => handleFileSelection(e, setTranscript),
          () => removeFile('transcript'),
          `${formDomId}-transcript-upload`,
          '.pdf,.doc,.docx,.xls,.xlsx,.csv,.txt,.jpg,.jpeg,.png',
          FileSpreadsheet
        )}

        <Card flat>
          <CardHeader>
            <CardTitle>Other Documents</CardTitle>
            <CardDescription>Upload any additional documents (optional)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className='space-y-4'>
              {otherFiles.length > 0 && (
                <div className='space-y-2'>
                  {otherFiles.map((fileData) => (
                    <div key={fileData.id} className='flex items-start p-4 border rounded-lg'>
                      <div className='mr-4'>{getFileIcon(fileData.file.name)}</div>
                      <div className='flex-1 min-w-0'>
                        <p className='font-medium truncate'>{fileData.file.name}</p>
                        <p className='text-sm text-muted-foreground'>{formatFileSize(fileData.file.size)}</p>
                      </div>
                      <Button
                        variant='ghost'
                        size='icon'
                        className='ml-2'
                        onClick={() => removeFile('other', fileData.id)}
                        disabled={isSubmitting}>
                        <X className='h-4 w-4' />
                        <span className='sr-only'>Remove file</span>
                      </Button>
                    </div>
                  ))}
                </div>
              )}
              <div className='flex flex-col items-center justify-center p-6 border border-dashed rounded-lg'>
                <FileIcon className='h-10 w-10 text-muted-foreground mb-2' />
                <Label htmlFor={`${formDomId}-other-files-upload`} className='cursor-pointer text-center'>
                  <div className='flex flex-col items-center'>
                    <p className='text-sm text-muted-foreground mb-1'>Drag & drop or click to upload</p>
                    <Button size='sm' variant='secondary' type='button' className='mt-2' asChild>
                      <span>
                        <Upload className='h-4 w-4 mr-2' /> Select Files
                      </span>
                    </Button>
                  </div>
                  <Input
                    id={`${formDomId}-other-files-upload`}
                    type='file'
                    multiple
                    className='hidden'
                    onChange={handleMultipleFileSelection}
                    disabled={isSubmitting}
                  />
                </Label>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className='flex justify-between pt-4'>
        <Button variant='outline' onClick={handlePrevious} disabled={isSubmitting}>
          Previous
        </Button>
        <Button onClick={handleContinue} disabled={isSubmitting}>
          {isSubmitting && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
          Upload
        </Button>
      </div>
    </div>
  )
}
