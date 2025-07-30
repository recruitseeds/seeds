import { ToolbarSkeleton } from '@/components/skeletons/toolbar'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@seeds/ui/dialog'
import { BlockquoteButton } from '@seeds/editor/blockquote-button'
import { Button } from '@seeds/editor/button'
import { CodeBlockButton } from '@seeds/editor/code-block-button'
import {
  ColorHighlightPopover,
  ColorHighlightPopoverButton,
  ColorHighlightPopoverContent,
} from '@seeds/editor/color-highlight-popover'
import { ImageBlock } from '@seeds/editor/extensions/image-block'
import { ImageBlockMenu } from '@seeds/editor/extensions/image-block/components/image-block-menu'
import { ImageUpload } from '@seeds/editor/extensions/image-upload'
import { Link } from '@seeds/editor/extensions/link-extension'
import { Selection } from '@seeds/editor/extensions/selection-extension'
import { TrailingNode } from '@seeds/editor/extensions/trailing-node-extension'
import { HeadingDropdownMenu } from '@seeds/editor/heading-dropdown-menu'
import { ImageUploadButton } from '@seeds/editor/image-upload-button'
import { LinkButton, LinkContent, LinkPopover } from '@seeds/editor/link-popover'
import { ListDropdownMenu } from '@seeds/editor/list-dropdown-menu'
import { MarkButton } from '@seeds/editor/mark-button'
import { Spacer } from '@seeds/editor/spacer'
import { TextAlignButton } from '@seeds/editor/text-align-button'
import { Toolbar, ToolbarGroup, ToolbarSeparator } from '@seeds/editor/toolbar'
import { UndoRedoButton } from '@seeds/editor/undo-redo-button'
import { useCursorVisibility } from '@/hooks/use-cursor-visibility'
import { useMobile } from '@/hooks/use-mobile'
import { useWindowSize } from '@/hooks/use-window-size'
import { uploadImage } from '@/lib/api'
import { useTRPC } from '@/trpc/client'
import type { AppRouter } from '@/trpc/routers/_app'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { FileHandler } from '@tiptap-pro/extension-file-handler'
import { Highlight } from '@tiptap/extension-highlight'
import { Image } from '@tiptap/extension-image'
import { Subscript } from '@tiptap/extension-subscript'
import { Superscript } from '@tiptap/extension-superscript'
import { TaskItem } from '@tiptap/extension-task-item'
import { TaskList } from '@tiptap/extension-task-list'
import { TextAlign } from '@tiptap/extension-text-align'
import { Typography } from '@tiptap/extension-typography'
import { Underline } from '@tiptap/extension-underline'
import { EditorContent, EditorContext, useEditor } from '@tiptap/react'
import { StarterKit } from '@tiptap/starter-kit'
import type { TRPCClientErrorLike } from '@trpc/client'
import { ArrowLeftIcon, HighlighterIcon, LinkIcon, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import * as React from 'react'
import { toast } from 'sonner'

const MobileToolbarContent = ({ type, onBack }: { type: 'highlighter' | 'link'; onBack: () => void }) => (
  <>
    <ToolbarGroup>
      <Button data-style='ghost' variant='ghost' onClick={onBack}>
        <ArrowLeftIcon className='tiptap-button-icon' />
        {type === 'highlighter' ? (
          <HighlighterIcon className='tiptap-button-icon' />
        ) : (
          <LinkIcon className='tiptap-button-icon' />
        )}
      </Button>
    </ToolbarGroup>
    <ToolbarSeparator />
    {type === 'highlighter' ? <ColorHighlightPopoverContent /> : <LinkContent />}
  </>
)

interface JobData {
  id?: string
  title: string
  job_type: 'full_time' | 'part_time' | 'contract' | 'internship' | 'temporary'
  content?: unknown
  status?: 'draft' | 'published' | 'archived' | 'closed'
  department?: string | null
  experience_level?: string | null
  hiring_manager_id?: string | null
  salary_min?: number | null
  salary_max?: number | null
  salary_type?: string | null
}

interface SimpleEditorProps {
  jobData?: JobData | null
  existingContent?: any
  jobId?: string
  isEditing?: boolean
  isJobDataLoading?: boolean
}

export function BlockEditor({
  jobData,
  existingContent,
  jobId,
  isEditing = false,
  isJobDataLoading = false,
}: SimpleEditorProps) {
  const isMobile = useMobile()
  const windowSize = useWindowSize()
  const router = useRouter()
  const [mobileView, setMobileView] = React.useState<'main' | 'highlighter' | 'link'>('main')
  const [showDiscardDialog, setShowDiscardDialog] = React.useState(false)
  const toolbarRef = React.useRef<HTMLDivElement>(null)
  const trpcClient = useTRPC()
  const queryClient = useQueryClient()

  const isEditingJob = isEditing || !!jobId

  const createJobPostingMutation = useMutation(
    trpcClient.organization.createJobPosting.mutationOptions({
      onSuccess: async (data) => {
        await queryClient.invalidateQueries(trpcClient.organization.listJobPostings.queryFilter())
        toast.success('Job posting saved successfully!')
      },
      onError: (error: TRPCClientErrorLike<AppRouter>) => {
        toast.error(`Failed to save job posting: ${error.message}`)
      },
    })
  )

  const updateJobPostingMutation = useMutation(
    trpcClient.organization.updateJobPosting.mutationOptions({
      onSuccess: async (data, variables) => {
        await queryClient.invalidateQueries(trpcClient.organization.listJobPostings.queryFilter())
        await queryClient.invalidateQueries(trpcClient.organization.getJobPosting.queryFilter({ id: jobId! }))

        if (variables.status === 'draft') {
          toast.success('Draft saved successfully!')
          router.push('/jobs/drafts')
        } else {
          toast.success('Job posting published successfully!')
        }
      },
      onError: (error: TRPCClientErrorLike<AppRouter>) => {
        toast.error(`Failed to update job posting: ${error.message}`)
      },
    })
  )

  const editor = useEditor({
    immediatelyRender: false,
    editorProps: {
      attributes: {
        autocomplete: 'off',
        autocorrect: 'off',
        class: 'prose outline-none focus:outline-none focus:ring-0 mt-5 text-foreground min-h-screen',
        autocapitalize: 'off',
        'aria-label': 'Main content area, start typing to enter text.',
      },
    },
    extensions: [
      StarterKit,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Underline,
      TaskList,
      TaskItem.configure({ nested: true }),
      Highlight.configure({ multicolor: true }),
      Image,
      Typography,
      ImageBlock,
      ImageUpload,
      FileHandler.configure({
        allowedMimeTypes: ['image/png', 'image/jpeg', 'image/gif', 'image/webp'],
        onDrop: (currentEditor, files, pos) => {
          files.forEach(async (file) => {
            const url = await uploadImage(file)
            currentEditor.chain().setImageBlockAt({ pos, src: url }).focus().run()
          })
        },
        onPaste: (currentEditor, files) => {
          files.forEach(async (file) => {
            const url = await uploadImage(file)
            return currentEditor
              .chain()
              .setImageBlockAt({ pos: currentEditor.state.selection.anchor, src: url })
              .focus()
              .run()
          })
        },
      }),
      Superscript,
      Subscript,
      Selection,
      TrailingNode,
      Link.configure({ openOnClick: false }),
    ],
  })

  const bodyRect = useCursorVisibility({
    editor,
    overlayHeight: toolbarRef.current?.getBoundingClientRect().height ?? 0,
  })

  const hasEditorContent = () => {
    const content = editor?.getJSON()
    if (!content || !content.content || content.content.length === 0) return false
    return content.content.some((node: { content?: { text?: string }[] }) => {
      if (node.content && node.content.length > 0) {
        return node.content.some((child: { text?: string }) => child.text && child.text.length > 0)
      }
      return false
    })
  }

  const hasRequiredJobData = () => {
    if (!jobData) return false
    return !!(jobData.title && jobData.title.trim().length > 0 && jobData.job_type)
  }

  const isLoading = createJobPostingMutation.isPending || updateJobPostingMutation.isPending

  const canPublish = (() => {
    if (!hasEditorContent()) return false

    if (isEditingJob) {
      if (isJobDataLoading) return false
      return hasRequiredJobData()
    }

    return hasRequiredJobData()
  })()

  const canSaveDraft = hasEditorContent()

  const handleSave = (status: 'draft' | 'published' = 'draft') => {
    const content = editor?.getJSON() || null

    if (status === 'published' && !canPublish) {
      toast.error('Please fill in all required job details before publishing')
      return
    }

    if (status === 'draft' && !canSaveDraft) {
      toast.error('Please add some content before saving')
      return
    }

    if (isEditingJob && jobId) {
      const payload = {
        id: jobId,
        ...jobData,
        content,
        status,
      }

      if (status === 'draft') {
        payload.title = jobData?.title?.trim() || 'Untitled'
        payload.job_type = (jobData?.job_type || 'full_time') as
          | 'full_time'
          | 'part_time'
          | 'contract'
          | 'internship'
          | 'temporary'
      }

      updateJobPostingMutation.mutate(payload)
    } else {
      const payload =
        jobData && hasRequiredJobData()
          ? {
              ...jobData,
              content,
              status,
            }
          : {
              title: 'Untitled',
              job_type: 'full_time' as const,
              content,
              status: 'draft' as const,
            }
      createJobPostingMutation.mutate(payload)
    }
  }

  const handleSaveAsDraftFromDialog = () => {
    const content = editor?.getJSON() || null

    if (!canSaveDraft) {
      toast.error('Please add some content before saving')
      return
    }

    if (isEditingJob && jobId) {
      const payload = {
        id: jobId,
        ...jobData,
        title: jobData?.title?.trim() || 'Untitled',
        job_type: (jobData?.job_type || 'full_time') as
          | 'full_time'
          | 'part_time'
          | 'contract'
          | 'internship'
          | 'temporary',
        content,
        status: 'draft' as const,
      }
      updateJobPostingMutation.mutate(payload)
    } else {
      const payload =
        jobData && hasRequiredJobData()
          ? {
              ...jobData,
              content,
              status: 'draft' as const,
            }
          : {
              title: 'Untitled',
              job_type: 'full_time' as const,
              content,
              status: 'draft' as const,
            }
      createJobPostingMutation.mutate(payload, {
        onSuccess: () => {
          router.push('/jobs/drafts')
        },
      })
    }
    setShowDiscardDialog(false)
  }

  const handleDiscard = () => {
    setShowDiscardDialog(true)
  }

  const handleClearEditor = () => {
    editor?.commands.clearContent()
    setShowDiscardDialog(false)
    toast.success('Content cleared')
  }

  React.useEffect(() => {
    if (!isMobile && mobileView !== 'main') {
      setMobileView('main')
    }
  }, [isMobile, mobileView])

  React.useEffect(() => {
    if (editor && existingContent) {
      editor.commands.setContent(existingContent)
    }
  }, [editor, existingContent])

  if (!editor) {
    return <ToolbarSkeleton />
  }

  return (
    <EditorContext.Provider value={{ editor }}>
      <div className='sticky top-0 z-40 border-b border-dashed bg-background'>
        <div className='flex items-center'>
          <div className='flex-1 min-w-0 overflow-x-auto'>
            <Toolbar
              ref={toolbarRef}
              style={
                isMobile
                  ? {
                      bottom: `calc(100% - ${windowSize.height - bodyRect.y}px)`,
                    }
                  : {}
              }>
              {mobileView === 'main' ? (
                <>
                  <Spacer />
                  <ToolbarGroup>
                    <UndoRedoButton action='undo' />
                    <UndoRedoButton action='redo' />
                  </ToolbarGroup>
                  <ToolbarSeparator />
                  <ToolbarGroup>
                    <HeadingDropdownMenu levels={[1, 2, 3, 4]} />
                    <ListDropdownMenu types={['bulletList', 'orderedList', 'taskList']} />
                    <BlockquoteButton />
                    <CodeBlockButton />
                  </ToolbarGroup>
                  <ToolbarSeparator />
                  <ToolbarGroup>
                    <MarkButton type='bold' />
                    <MarkButton type='italic' />
                    <MarkButton type='strike' />
                    <MarkButton type='code' />
                    <MarkButton type='underline' />
                    {!isMobile ? (
                      <ColorHighlightPopover />
                    ) : (
                      <ColorHighlightPopoverButton onClick={() => setMobileView('highlighter')} />
                    )}
                    {!isMobile ? <LinkPopover /> : <LinkButton onClick={() => setMobileView('link')} />}
                  </ToolbarGroup>
                  <ToolbarSeparator />
                  <ToolbarGroup>
                    <MarkButton type='superscript' />
                    <MarkButton type='subscript' />
                  </ToolbarGroup>
                  <ToolbarSeparator />
                  <ToolbarGroup>
                    <TextAlignButton align='left' />
                    <TextAlignButton align='center' />
                    <TextAlignButton align='right' />
                    <TextAlignButton align='justify' />
                  </ToolbarGroup>
                  <ToolbarSeparator />
                  <ToolbarGroup>
                    <ImageUploadButton text='Add' />
                  </ToolbarGroup>
                  <Spacer />
                </>
              ) : (
                <MobileToolbarContent
                  type={mobileView === 'highlighter' ? 'highlighter' : 'link'}
                  onBack={() => setMobileView('main')}
                />
              )}
            </Toolbar>
          </div>
          {mobileView === 'main' && (
            <div className='flex-shrink-0 px-4 py-2 border-l border-dashed'>
              <div className='flex gap-2'>
                <Button variant='ghost' size='sm' onClick={handleDiscard} disabled={isLoading}>
                  Discard
                </Button>
                <Button
                  variant='brand'
                  size='sm'
                  onClick={() => handleSave('published')}
                  disabled={!canPublish || isLoading}>
                  {isLoading && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
                  Publish
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
      <EditorContent editor={editor} role='presentation' className='simple-editor-content' />
      <ImageBlockMenu editor={editor} />
      <Dialog open={showDiscardDialog} onOpenChange={setShowDiscardDialog}>
        <DialogContent className='sm:max-w-[425px]'>
          <DialogHeader>
            <DialogTitle>Discard changes?</DialogTitle>
            <DialogDescription>
              You have unsaved changes. Would you like to save as a draft or clear all content?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={handleSaveAsDraftFromDialog} disabled={isLoading || !canSaveDraft}>
              Save as Draft
            </Button>
            <Button onClick={handleClearEditor} variant='destructive'>
              Clear All
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </EditorContext.Provider>
  )
}
