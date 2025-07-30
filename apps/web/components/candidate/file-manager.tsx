'use client'

import { Badge } from '@seeds/ui/badge'
import { Button, buttonVariants } from '@seeds/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@seeds/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@seeds/ui/dialog'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@seeds/ui/dropdown-menu'
import { Input } from '@seeds/ui/input'
import { Label } from '@seeds/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@seeds/ui/select'
import { cn } from '@seeds/ui/lib/utils'
import { useTRPC } from '@/trpc/client'
import type { RouterOutputs } from '@/trpc/routers/_app'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Download,
  Eye,
  File,
  FileCheckIcon as FileCertificate,
  FileCheck,
  FileImage,
  FileSpreadsheet,
  FileText,
  Link,
  Loader2,
  MoreVertical,
  Star,
  Trash2,
  Upload,
} from 'lucide-react'
import Image from 'next/image'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import type React from 'react'
import { useState } from 'react'
import DocViewer, { DocViewerRenderers } from 'react-doc-viewer'

const R2_PUBLIC_URL_BASE = process.env.NEXT_PUBLIC_CLOUDFLARE_R2_PUBLIC_URL

function getPublicUrlFromR2Key(r2Key: string | null | undefined): string {
  if (!r2Key) return '/placeholder.svg'
  if (!R2_PUBLIC_URL_BASE) return r2Key
  if (r2Key.startsWith('http://') || r2Key.startsWith('https://')) return r2Key
  return `${R2_PUBLIC_URL_BASE}/${r2Key}`
}

const documentTypes = {
  resume: {
    label: 'Resumes',
    icon: FileText,
    dbValue: 'resume' as const,
    uploadButtonText: 'Upload a resume',
  },
  cover_letter: {
    label: 'Cover Letters',
    icon: FileText,
    dbValue: 'cover_letter' as const,
    uploadButtonText: 'Upload a cover letter',
  },
  portfolio: {
    label: 'Portfolios',
    icon: FileImage,
    dbValue: 'other' as const,
    uploadButtonText: 'Upload to portfolio',
  },
  certification: {
    label: 'Certifications',
    icon: FileCertificate,
    dbValue: 'other' as const,
    uploadButtonText: 'Upload a certification',
  },
  transcript: {
    label: 'Transcripts',
    icon: FileSpreadsheet,
    dbValue: 'transcript' as const,
    uploadButtonText: 'Upload a transcript',
  },
  reference: {
    label: 'Reference Letters',
    icon: FileText,
    dbValue: 'other' as const,
    uploadButtonText: 'Upload a reference letter',
  },
  eligibility: {
    label: 'Work Eligibility',
    icon: FileCheck,
    dbValue: 'other' as const,
    uploadButtonText: 'Upload work eligibility',
  },
  other: {
    label: 'Other Documents',
    icon: File,
    dbValue: 'other' as const,
    uploadButtonText: 'Upload other documents',
  },
}

type DocumentTypeKey = keyof typeof documentTypes
type DocumentFromAPI = RouterOutputs['candidate']['listFiles'][number]

interface FileManagerPropsWithData {
  initialFilesData: RouterOutputs['candidate']['listFiles']
}
type FileManagerPropsWithoutData = object
type FileManagerProps = FileManagerPropsWithData | FileManagerPropsWithoutData

function hasData(props: FileManagerProps): props is FileManagerPropsWithData {
  return 'initialFilesData' in props
}

const formatFileSize = (bytes: number | null | undefined): string => {
  if (bytes === null || bytes === undefined || bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${Number.parseFloat((bytes / k ** i).toFixed(2))} ${sizes[i]}`
}

const sidebarNavItems = Object.entries(documentTypes).map(([key, { label }]) => ({
  value: key as DocumentTypeKey,
  title: label,
}))

const DEFAULT_SECTION: DocumentTypeKey = 'resume'

const getFileExtension = (filename: string | undefined): string => {
  if (!filename) return ''
  return filename.slice(((filename.lastIndexOf('.') - 1) >>> 0) + 2).toLowerCase()
}

export function FileManager(props: FileManagerProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const trpc = useTRPC()
  const queryClient = useQueryClient()

  const currentSectionParam = searchParams.get('section') as DocumentTypeKey | null
  const activeSection =
    currentSectionParam && sidebarNavItems.find((item) => item.value === currentSectionParam)
      ? currentSectionParam
      : DEFAULT_SECTION

  const { data: documentsFromAPI, error: filesError } = useQuery({
    ...trpc.candidate.listFiles.queryOptions(undefined),
    ...(hasData(props) ? { initialData: props.initialFilesData } : {}),
  })

  const [selectedDocument, setSelectedDocument] = useState<DocumentFromAPI | null>(null)
  const [showDocumentPreview, setShowDocumentPreview] = useState(false)
  const [deletingFileId, setDeletingFileId] = useState<string | null>(null)

  const uploadMutation = useMutation(
    trpc.candidate.uploadFile.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries(trpc.candidate.listFiles.queryFilter())
      },
      onError: (error) => {
        console.error(`Upload failed: ${error.message}`)
      },
    })
  )

  const deleteMutation = useMutation(
    trpc.candidate.deleteFile.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries(trpc.candidate.listFiles.queryFilter())
        setDeletingFileId(null)
      },
      onError: (error) => {
        console.error(`Delete failed: ${error.message}`)
        setDeletingFileId(null)
      },
    })
  )

  const setDefaultResumeMutation = useMutation(
    trpc.candidate.setDefaultResume.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries(trpc.candidate.listFiles.queryFilter())
      },
      onError: (error) => {
        console.error(`Failed to set default resume: ${error.message}`)
      },
    })
  )

  const handleSectionChange = (sectionValue: DocumentTypeKey) => {
    const current = new URLSearchParams(Array.from(searchParams.entries()))
    current.set('section', sectionValue)
    const search = current.toString()
    const query = search ? `?${search}` : ''
    router.push(`${pathname}${query}`, { scroll: false })
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>, sectionKey: DocumentTypeKey) => {
    const file = event.target.files?.[0]

    if (file) {
      const reader = new FileReader()
      reader.onload = async (e) => {
        const base64 = e.target?.result as string
        const base64Content = base64.split(',')[1]

        await uploadMutation.mutateAsync({
          fileName: file.name,
          fileMimeType: file.type,
          fileContentBase64: base64Content,
          fileCategoryForR2Path: sectionKey,
          dbFileType: documentTypes[sectionKey].dbValue,
        })
      }
      reader.readAsDataURL(file)
    }

    if (event.target) {
      event.target.value = ''
    }
  }

  const setAsDefault = (docId: string) => {
    setDefaultResumeMutation.mutate({ fileId: docId })
  }

  const openDocumentPreview = (document: DocumentFromAPI) => {
    setSelectedDocument(document)
    setShowDocumentPreview(true)
  }

  const documentsForCurrentSection = (documentsFromAPI || []).filter((doc) => {
    const docCategoryFromPath = doc.storage_path.split('/')[2]
    if (activeSection === 'resume' || activeSection === 'cover_letter' || activeSection === 'transcript') {
      return doc.file_type === activeSection
    }
    return docCategoryFromPath === activeSection
  })

  const currentSectionDetails = documentTypes[activeSection]
  const IconToRender = currentSectionDetails.icon

  if (filesError) {
    return (
      <Card className='shadow-none border-0 md:border md:shadow-sm'>
        <CardHeader>
          <CardTitle>Document Management</CardTitle>
        </CardHeader>
        <CardContent>
          <p className='text-red-600'>Error loading documents: {filesError.message}</p>
        </CardContent>
      </Card>
    )
  }

  if (activeSection === 'portfolio') {
    return (
      <Card className='border-none px-0 pt-0 gap-3'>
        <CardHeader className='px-0'>
          <CardTitle>Document Management</CardTitle>
          <CardDescription>Upload, manage, and organize your professional documents</CardDescription>
        </CardHeader>
        <CardContent className='px-0'>
          <div className='md:hidden mb-6'>
            <Select value={activeSection} onValueChange={(value) => handleSectionChange(value as DocumentTypeKey)}>
              <SelectTrigger className='w-full'>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {sidebarNavItems.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className='flex flex-col md:flex-row gap-8'>
            <aside className='hidden md:block md:w-1/4 lg:w-1/5'>
              <nav className={cn('flex flex-col space-y-1')}>
                {sidebarNavItems.map((item) => (
                  <Button
                    key={item.value}
                    variant='ghost'
                    className={cn(
                      'w-full justify-start',
                      activeSection === item.value
                        ? 'bg-muted/50 hover:bg-muted/80 shadow-[inset_0px_0px_0px_0.5px_rgb(255_255_255_/_0.02),inset_0px_0.5px_0px_rgb(255_255_255_/_0.04),_inset_0px_0px_0px_1px_rgb(255_255_255_/_0.02),_0px_0px_0px_0.5px_rgb(0_0_0_/_0.24)]'
                        : 'hover:bg-transparent hover:underline active:bg-muted'
                    )}
                    onClick={() => handleSectionChange(item.value)}>
                    {item.title}
                  </Button>
                ))}
              </nav>
            </aside>

            <main className='flex-1 space-y-4 min-w-0'>
              <div className='space-y-4'>
                <div className='text-center py-8 space-y-4'>
                  <div className='flex justify-center'>
                    <FileImage className='h-16 w-16 text-muted-foreground' />
                  </div>
                  <div>
                    <h4 className='text-lg font-medium'>Portfolio Feature Coming Soon</h4>
                    <p className='text-muted-foreground mt-2'>
                      We're working on an amazing portfolio showcase feature that will let you display your best work
                      with screenshots and live links.
                    </p>
                  </div>
                  <Button variant='link' asChild>
                    <a href='/' className='inline-flex items-center gap-2'>
                      Read more about portfolios
                      <Link className='h-4 w-4' />
                    </a>
                  </Button>
                </div>
              </div>
            </main>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card className='border-none gap-3 pt-0 bg-transparent'>
        <CardHeader className='px-0'>
          <CardTitle>Document Management</CardTitle>
          <CardDescription>Upload, manage, and organize your professional documents</CardDescription>
        </CardHeader>
        <CardContent className='px-0'>
          <div className='md:hidden mb-6'>
            <Select value={activeSection} onValueChange={(value) => handleSectionChange(value as DocumentTypeKey)}>
              <SelectTrigger className='w-full'>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {sidebarNavItems.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className='flex flex-col md:flex-row gap-8'>
            <aside className='hidden md:block md:w-1/4 lg:w-1/5'>
              <nav className={cn('flex flex-col space-y-1')}>
                {sidebarNavItems.map((item) => (
                  <Button
                    key={item.value}
                    variant='ghost'
                    className={cn(
                      'w-full justify-start',
                      activeSection === item.value
                        ? 'bg-muted/50 hover:bg-muted/80 shadow-[inset_0px_0px_0px_0.5px_rgb(255_255_255_/_0.02),inset_0px_0.5px_0px_rgb(255_255_255_/_0.04),_inset_0px_0px_0px_1px_rgb(255_255_255_/_0.02),_0px_0px_0px_0.5px_rgb(0_0_0_/_0.24)]'
                        : 'hover:bg-transparent hover:underline active:bg-muted'
                    )}
                    onClick={() => handleSectionChange(item.value)}>
                    {item.title}
                  </Button>
                ))}
              </nav>
            </aside>

            <main className='flex-1 space-y-4 min-w-0'>
              <div className='flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2'>
                <h3 className='text-lg font-medium'>{currentSectionDetails.label}</h3>
                <div>
                  <Label htmlFor={`upload-${activeSection}`} className='cursor-pointer'>
                    <div
                      className={cn(
                        buttonVariants({ size: 'sm' }),
                        uploadMutation.isPending && 'opacity-50 cursor-not-allowed'
                      )}>
                      {uploadMutation.isPending ? (
                        <Loader2 className='h-4 w-4 mr-2 animate-spin' />
                      ) : (
                        <Upload className='h-4 w-4 mr-2' />
                      )}
                      <span>{currentSectionDetails.uploadButtonText}</span>
                    </div>
                    <Input
                      id={`upload-${activeSection}`}
                      type='file'
                      accept='.pdf,.doc,.docx,.jpg,.jpeg,.png,.txt,.ppt,.pptx,.xls,.xlsx'
                      className='hidden'
                      onChange={(e) => handleFileUpload(e, activeSection)}
                      disabled={uploadMutation.isPending}
                    />
                  </Label>
                </div>
              </div>

              {documentsForCurrentSection.length > 0 ? (
                <div className='space-y-3'>
                  {documentsForCurrentSection.map((document) => (
                    <div
                      key={document.id}
                      className='flex flex-col md:flex-row md:items-center justify-between p-4 border rounded gap-4'>
                      <div className='flex items-start md:items-center gap-3 flex-1 min-w-0'>
                        <div className='bg-muted p-2 rounded hidden sm:block'>
                          <IconToRender className='h-6 w-6 text-muted-foreground' />
                        </div>
                        <div className='flex-1 min-w-0'>
                          <div className='flex items-center gap-2 flex-wrap'>
                            <h4 className='font-medium truncate'>{document.file_name}</h4>
                            {document.is_default_resume && (
                              <Badge variant='secondary' className='whitespace-nowrap'>
                                Default
                              </Badge>
                            )}
                          </div>
                          <div className='flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-xs text-muted-foreground'>
                            <span>
                              Uploaded:{' '}
                              {document.created_at ? new Date(document.created_at).toLocaleDateString() : 'N/A'}
                            </span>
                            <span>{formatFileSize(document.size_bytes)}</span>
                          </div>
                        </div>
                      </div>

                      <div className='flex items-center gap-1.5 flex-wrap justify-end md:justify-start'>
                        <Button variant='outline' size='sm' onClick={() => openDocumentPreview(document)}>
                          <Eye className='h-4 w-4 sm:mr-1' /> <span className='hidden sm:inline'>Preview</span>
                        </Button>
                        <Button variant='outline' size='sm' asChild>
                          <a
                            href={getPublicUrlFromR2Key(document.storage_path)}
                            download={document.file_name}
                            target='_blank'
                            rel='noopener noreferrer'>
                            <Download className='h-4 w-4 sm:mr-1' />
                            <span className='hidden sm:inline'>Download</span>
                          </a>
                        </Button>

                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant='ghost' className='h-[26px] w-[26px] px-2'>
                              <MoreVertical className='size-4' />
                              <span className='sr-only'>More options</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align='end' className='space-y-0.5'>
                            {activeSection === 'resume' && !document.is_default_resume && (
                              <DropdownMenuItem onClick={() => setAsDefault(document.id)}>
                                <Star className='h-4 w-4 mr-2' /> Set as Default
                              </DropdownMenuItem>
                            )}
                            {activeSection === 'resume' && document.is_default_resume && (
                              <DropdownMenuItem disabled>
                                <Star className='h-4 w-4 mr-2 text-yellow-500 fill-yellow-300' />
                                Default resume
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem
                              onClick={() => {
                                setDeletingFileId(document.id)
                                deleteMutation.mutate({ fileId: document.id })
                              }}
                              disabled={deleteMutation.isPending}
                              variant='destructive'>
                              {deleteMutation.isPending && deletingFileId === document.id ? (
                                <>
                                  <Loader2 className='size-4 mr-2 animate-spin' />
                                  Deleting...
                                </>
                              ) : (
                                <>
                                  <Trash2 className='size-4 mr-2' />
                                  Delete
                                </>
                              )}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className='flex flex-col items-center justify-center p-8 border border-dashed rounded-lg text-center'>
                  <IconToRender className='h-12 w-12 text-muted-foreground mb-4' />
                  <h4 className='text-lg font-medium mb-2'>No {currentSectionDetails.label} Uploaded</h4>
                  <p className='text-muted-foreground mb-4 max-w-xs'>
                    Upload your {currentSectionDetails.label.toLowerCase()} to make them available when applying for
                    jobs.
                  </p>
                  <Label htmlFor={`upload-empty-${activeSection}`} className='cursor-pointer'>
                    <div
                      className={cn(
                        buttonVariants({ variant: 'default', size: 'sm' }),
                        uploadMutation.isPending && 'opacity-50 cursor-not-allowed'
                      )}>
                      {uploadMutation.isPending ? (
                        <Loader2 className='h-4 w-4 mr-2 animate-spin' />
                      ) : (
                        <Upload className='h-4 w-4' />
                      )}
                      <span>{currentSectionDetails.uploadButtonText}</span>
                    </div>
                    <Input
                      id={`upload-empty-${activeSection}`}
                      type='file'
                      accept='.pdf,.doc,.docx,.jpg,.jpeg,.png,.txt,.ppt,.pptx,.xls,.xlsx'
                      className='hidden'
                      onChange={(e) => handleFileUpload(e, activeSection)}
                      disabled={uploadMutation.isPending}
                    />
                  </Label>
                </div>
              )}
            </main>
          </div>
        </CardContent>
      </Card>

      <Dialog open={showDocumentPreview} onOpenChange={setShowDocumentPreview}>
        <DialogContent className='lg:max-w-4xl md:max-w-2xl w-[90vw] h-[90vh] flex flex-col p-4 sm:p-6'>
          <DialogHeader className='pr-10'>
            <DialogTitle className='truncate'>{selectedDocument?.file_name}</DialogTitle>
            <DialogDescription>
              Uploaded on{' '}
              {selectedDocument?.created_at ? new Date(selectedDocument.created_at).toLocaleDateString() : 'N/A'} •{' '}
              {selectedDocument && formatFileSize(selectedDocument.size_bytes)}
            </DialogDescription>
          </DialogHeader>
          <div className='flex-1 min-h-0 mt-2 sm:mt-4 -mx-4 sm:-mx-6 px-4 sm:px-6 overflow-hidden'>
            {selectedDocument?.storage_path ? (
              (() => {
                const fileUrl = getPublicUrlFromR2Key(selectedDocument.storage_path)
                const fileExtension = getFileExtension(selectedDocument.file_name)
                const isImage =
                  selectedDocument.mime_type?.startsWith('image/') ||
                  ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(fileExtension)

                if (isImage) {
                  return (
                    <div className='relative w-full h-full'>
                      <Image
                        src={fileUrl}
                        alt={selectedDocument.file_name || 'Preview'}
                        fill
                        style={{ objectFit: 'contain' }}
                      />
                    </div>
                  )
                }
                if (fileExtension === 'pdf' && !process.env.NEXT_PUBLIC_USE_REACT_DOC_VIEWER_FOR_PDF) {
                  return (
                    <iframe
                      src={`${fileUrl}#toolbar=0&navpanes=0`}
                      className='w-full h-full border rounded bg-muted'
                      title='Document Preview'
                    />
                  )
                }
                if (fileUrl) {
                  const documents = [
                    {
                      uri: fileUrl,
                      fileType: fileExtension,
                      fileName: selectedDocument.file_name || 'Document',
                    },
                  ]
                  return (
                    <DocViewer
                      documents={documents}
                      pluginRenderers={DocViewerRenderers}
                      config={{
                        header: {
                          disableHeader: true,
                          disableFileName: true,
                        },
                      }}
                      className='w-full h-full'
                    />
                  )
                }
                return <p>Preview not available: No storage path.</p>
              })()
            ) : (
              <p>Preview not available.</p>
            )}
          </div>
          <DialogFooter className='mt-4 sm:mt-6 flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 gap-2'>
            <Button variant='outline' size='sm' asChild>
              <a
                href={getPublicUrlFromR2Key(selectedDocument?.storage_path)}
                download={selectedDocument?.file_name}
                target='_blank'
                rel='noopener noreferrer'>
                Download
              </a>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
