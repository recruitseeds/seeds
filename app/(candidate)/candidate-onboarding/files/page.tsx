'use client'

import type React from 'react'

import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  FileIcon,
  FileImage,
  FileSpreadsheet,
  FileText,
  Upload,
  X,
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

interface FileData {
  file: File
  preview: string
}

export default function FilesUploadPage() {
  const router = useRouter()
  const [resume, setResume] = useState<FileData | null>(null)
  const [coverLetter, setCoverLetter] = useState<FileData | null>(null)
  const [transcript, setTranscript] = useState<FileData | null>(null)
  const [otherFiles, setOtherFiles] = useState<FileData[]>([])

  // Format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return (
      Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
    )
  }

  // Handle file upload
  const handleFileUpload = (
    event: React.ChangeEvent<HTMLInputElement>,
    setFile: React.Dispatch<React.SetStateAction<FileData | null>>
  ) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = () => {
        setFile({
          file,
          preview: URL.createObjectURL(file),
        })
      }
      reader.readAsDataURL(file)
    }
  }

  // Handle multiple file upload
  const handleMultipleFileUpload = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = event.target.files
    if (files) {
      const newFiles: FileData[] = []
      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        newFiles.push({
          file,
          preview: URL.createObjectURL(file),
        })
      }
      setOtherFiles((prevFiles) => [...prevFiles, ...newFiles])
    }
  }

  // Remove a file
  const removeFile = (
    type: 'resume' | 'coverLetter' | 'transcript' | 'other',
    index?: number
  ) => {
    if (type === 'resume' && resume) URL.revokeObjectURL(resume.preview)
    if (type === 'coverLetter' && coverLetter)
      URL.revokeObjectURL(coverLetter.preview)
    if (type === 'transcript' && transcript)
      URL.revokeObjectURL(transcript.preview)
    if (type === 'other' && index !== undefined)
      URL.revokeObjectURL(otherFiles[index].preview)

    if (type === 'resume') {
      setResume(null)
    } else if (type === 'coverLetter') {
      setCoverLetter(null)
    } else if (type === 'transcript') {
      setTranscript(null)
    } else if (type === 'other' && index !== undefined) {
      setOtherFiles(otherFiles.filter((_, i) => i !== index))
    }
  }

  // Get file icon based on file type
  const getFileIcon = (fileName: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase()
    if (extension === 'pdf' || extension === 'doc' || extension === 'docx') {
      return <FileText className='h-8 w-8 text-blue-500' />
    } else if (
      extension === 'jpg' ||
      extension === 'jpeg' ||
      extension === 'png' ||
      extension === 'gif'
    ) {
      return <FileImage className='h-8 w-8 text-green-500' />
    } else if (
      extension === 'xls' ||
      extension === 'xlsx' ||
      extension === 'csv'
    ) {
      return <FileSpreadsheet className='h-8 w-8 text-green-500' />
    } else {
      return <FileIcon className='h-8 w-8 text-gray-500' />
    }
  }

  // Handle final submission for this step
  const handleContinue = () => {
    const filesToUpload = {
      resume: resume?.file,
      coverLetter: coverLetter?.file,
      transcript: transcript?.file,
      other: otherFiles.map((f) => f.file),
    }
    console.log('Uploading files:', filesToUpload)
    router.push('/candidate-onboarding/complete')
  }

  // Handle skipping this step
  const handleSkip = () => {
    console.log('Skipping files step')
    router.push('/candidate-onboarding/complete')
  }

  // Handle going back
  const handlePrevious = () => {
    router.push('/candidate-onboarding/experience')
  }

  return (
    <div className='space-y-6'>
      <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
        {/* Resume Upload */}
        <Card>
          <CardHeader>
            <CardTitle>Resume</CardTitle>
            <CardDescription>Upload your most recent resume</CardDescription>
          </CardHeader>
          <CardContent>
            {resume ? (
              <div className='flex items-start p-4 border rounded-lg'>
                <div className='mr-4'>{getFileIcon(resume.file.name)}</div>
                <div className='flex-1 min-w-0'>
                  <p className='font-medium truncate'>{resume.file.name}</p>
                  <p className='text-sm text-muted-foreground'>
                    {formatFileSize(resume.file.size)}
                  </p>
                </div>
                <Button
                  variant='ghost'
                  size='icon'
                  className='ml-2'
                  onClick={() => removeFile('resume')}>
                  <X className='h-4 w-4' />
                  <span className='sr-only'>Remove</span>
                </Button>
              </div>
            ) : (
              <div className='flex flex-col items-center justify-center p-6 border border-dashed rounded-lg'>
                <FileText className='h-10 w-10 text-muted-foreground mb-2' />
                <Label
                  htmlFor='resume-upload'
                  className='cursor-pointer text-center'>
                  <div className='flex flex-col items-center'>
                    <p className='text-sm text-muted-foreground mb-1'>
                      Drag and drop or click to upload
                    </p>
                    <Button
                      size='sm'
                      variant='secondary'
                      type='button'
                      className='mt-2'>
                      <Upload className='h-4 w-4 mr-2' /> Select File
                    </Button>
                  </div>
                  <Input
                    id='resume-upload'
                    type='file'
                    accept='.pdf,.doc,.docx'
                    className='hidden'
                    onChange={(e) => handleFileUpload(e, setResume)}
                  />
                </Label>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Cover Letter Upload */}
        <Card>
          <CardHeader>
            <CardTitle>Cover Letter</CardTitle>
            <CardDescription>
              Upload your cover letter (optional)
            </CardDescription>
          </CardHeader>
          <CardContent>
            {coverLetter ? (
              <div className='flex items-start p-4 border rounded-lg'>
                <div className='mr-4'>{getFileIcon(coverLetter.file.name)}</div>
                <div className='flex-1 min-w-0'>
                  <p className='font-medium truncate'>
                    {coverLetter.file.name}
                  </p>
                  <p className='text-sm text-muted-foreground'>
                    {formatFileSize(coverLetter.file.size)}
                  </p>
                </div>
                <Button
                  variant='ghost'
                  size='icon'
                  className='ml-2'
                  onClick={() => removeFile('coverLetter')}>
                  <X className='h-4 w-4' />
                  <span className='sr-only'>Remove</span>
                </Button>
              </div>
            ) : (
              <div className='flex flex-col items-center justify-center p-6 border border-dashed rounded-lg'>
                <FileText className='h-10 w-10 text-muted-foreground mb-2' />
                <Label
                  htmlFor='cover-letter-upload'
                  className='cursor-pointer text-center'>
                  <div className='flex flex-col items-center'>
                    <p className='text-sm text-muted-foreground mb-1'>
                      Drag and drop or click to upload
                    </p>
                    <Button
                      size='sm'
                      variant='secondary'
                      type='button'
                      className='mt-2'>
                      <Upload className='h-4 w-4 mr-2' /> Select File
                    </Button>
                  </div>
                  <Input
                    id='cover-letter-upload'
                    type='file'
                    accept='.pdf,.doc,.docx'
                    className='hidden'
                    onChange={(e) => handleFileUpload(e, setCoverLetter)}
                  />
                </Label>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Transcript Upload */}
        <Card>
          <CardHeader>
            <CardTitle>Transcript</CardTitle>
            <CardDescription>
              Upload your academic transcript (optional)
            </CardDescription>
          </CardHeader>
          <CardContent>
            {transcript ? (
              <div className='flex items-start p-4 border rounded-lg'>
                <div className='mr-4'>{getFileIcon(transcript.file.name)}</div>
                <div className='flex-1 min-w-0'>
                  <p className='font-medium truncate'>{transcript.file.name}</p>
                  <p className='text-sm text-muted-foreground'>
                    {formatFileSize(transcript.file.size)}
                  </p>
                </div>
                <Button
                  variant='ghost'
                  size='icon'
                  className='ml-2'
                  onClick={() => removeFile('transcript')}>
                  <X className='h-4 w-4' />
                  <span className='sr-only'>Remove</span>
                </Button>
              </div>
            ) : (
              <div className='flex flex-col items-center justify-center p-6 border border-dashed rounded-lg'>
                <FileSpreadsheet className='h-10 w-10 text-muted-foreground mb-2' />
                <Label
                  htmlFor='transcript-upload'
                  className='cursor-pointer text-center'>
                  <div className='flex flex-col items-center'>
                    <p className='text-sm text-muted-foreground mb-1'>
                      Drag and drop or click to upload
                    </p>
                    <Button
                      size='sm'
                      variant='secondary'
                      type='button'
                      className='mt-2'>
                      <Upload className='h-4 w-4 mr-2' /> Select File
                    </Button>
                  </div>
                  <Input
                    id='transcript-upload'
                    type='file'
                    accept='.pdf,.doc,.docx,.xls,.xlsx'
                    className='hidden'
                    onChange={(e) => handleFileUpload(e, setTranscript)}
                  />
                </Label>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Other Files Upload */}
        <Card>
          <CardHeader>
            <CardTitle>Other Documents</CardTitle>
            <CardDescription>
              Upload any additional documents (optional)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className='space-y-4'>
              {otherFiles.length > 0 && (
                <div className='space-y-2'>
                  {otherFiles.map((file, index) => (
                    <div
                      key={index}
                      className='flex items-start p-4 border rounded-lg'>
                      <div className='mr-4'>{getFileIcon(file.file.name)}</div>
                      <div className='flex-1 min-w-0'>
                        <p className='font-medium truncate'>{file.file.name}</p>
                        <p className='text-sm text-muted-foreground'>
                          {formatFileSize(file.file.size)}
                        </p>
                      </div>
                      <Button
                        variant='ghost'
                        size='icon'
                        className='ml-2'
                        onClick={() => removeFile('other', index)}>
                        <X className='h-4 w-4' />
                        <span className='sr-only'>Remove</span>
                      </Button>
                    </div>
                  ))}
                </div>
              )}
              <div className='flex flex-col items-center justify-center p-6 border border-dashed rounded-lg'>
                <FileIcon className='h-10 w-10 text-muted-foreground mb-2' />
                <Label
                  htmlFor='other-files-upload'
                  className='cursor-pointer text-center'>
                  <div className='flex flex-col items-center'>
                    <p className='text-sm text-muted-foreground mb-1'>
                      Drag and drop or click to upload
                    </p>
                    <Button
                      size='sm'
                      variant='secondary'
                      type='button'
                      className='mt-2'>
                      <Upload className='h-4 w-4 mr-2' /> Select Files
                    </Button>
                  </div>
                  <Input
                    id='other-files-upload'
                    type='file'
                    multiple
                    className='hidden'
                    onChange={handleMultipleFileUpload}
                  />
                </Label>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className='flex justify-between'>
        <Button variant='outline' onClick={handlePrevious}>
          Previous
        </Button>
        <div className='space-x-2'>
          <Button variant='outline' onClick={handleSkip}>
            Fill out later
          </Button>
          <Button onClick={handleContinue}>Continue</Button>
        </div>
      </div>
    </div>
  )
}
