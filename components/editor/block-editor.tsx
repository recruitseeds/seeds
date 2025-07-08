import ImageBlockMenu from '@/editor/extensions/image-block/components/image-block-menu'
import { ColumnsMenu } from '@/editor/extensions/multi-column/menus/columns-menu'
import { useTRPC } from '@/trpc/client'
import type { AppRouter } from '@/trpc/routers/_app'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { EditorContent } from '@tiptap/react'
import type { TRPCClientErrorLike } from '@trpc/client'
import { Loader2 } from 'lucide-react'
import { useRef, useState } from 'react'
import { toast } from 'sonner'
import { Button } from '../ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../ui/dialog'
import { EditorMenuBar } from './editor-menu-bar'

interface BlockEditorProps {
  editor: any
  jobData: any
}

export const BlockEditor = ({ editor, jobData }: BlockEditorProps) => {
  const menuContainerRef = useRef(null)
  const [showDiscardDialog, setShowDiscardDialog] = useState(false)
  const trpcClient = useTRPC()
  const queryClient = useQueryClient()

  const createJobPostingMutation = useMutation(
    trpcClient.organization.createJobPosting.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries(trpcClient.organization.listJobPostings.queryFilter())
        toast.success('Job posting saved successfully!')
        editor?.commands.clearContent()
      },
      onError: (error: TRPCClientErrorLike<AppRouter>) => {
        toast.error(`Failed to save job posting: ${error.message}`)
      },
    })
  )

  // Check if editor has any meaningful content (even a single character)
  const hasEditorContent = () => {
    const content = editor?.getJSON()
    if (!content || !content.content || content.content.length === 0) return false

    // Check if there's any text content at all
    return content.content.some((node: any) => {
      if (node.content && node.content.length > 0) {
        return node.content.some((child: any) => child.text && child.text.length > 0)
      }
      return false
    })
  }

  const handleSave = (status: 'draft' | 'published' = 'draft') => {
    const content = editor?.getJSON() || null

    // Determine status based on whether job data is complete
    const finalStatus = jobData ? status : 'draft'

    // Use job data if available, otherwise use defaults for draft
    const payload = jobData
      ? {
          ...jobData,
          content,
          status: finalStatus,
        }
      : {
          title: 'Untitled',
          job_type: 'full_time' as const,
          content,
          status: 'draft' as const,
        }

    createJobPostingMutation.mutate(payload)
  }

  const handleSaveAsDraftFromDialog = () => {
    const content = editor?.getJSON() || null

    const payload = jobData
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

    createJobPostingMutation.mutate(payload)
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

  if (!editor) {
    return (
      <div className='min-h-[100dvh] flex items-center justify-center'>
        <div className='animate-pulse'>Loading Editor...</div>
      </div>
    )
  }

  const hasJobData = jobData !== null
  const isLoading = createJobPostingMutation.isPending

  return (
    <div ref={menuContainerRef}>
      <EditorMenuBar
        editor={editor}
        onSave={handleSave}
        onDiscard={handleDiscard}
        hasJobData={hasJobData}
        isLoading={isLoading}
      />
      <div className='relative flex flex-col overflow-hidden'>
        <EditorContent editor={editor} className='flex-1 overflow-y-auto mt-5 mx-2' />
      </div>
      <ColumnsMenu editor={editor} appendTo={menuContainerRef} />
      <ImageBlockMenu editor={editor} appendTo={menuContainerRef} />
      {editor ? (
        <div className='md:hidden flex items-center gap-2 justify-end mb-20 mt-10 mr-8'>
          <Button variant='ghost' size='sm' onClick={handleDiscard} disabled={isLoading}>
            Discard
          </Button>
          <Button variant='brand' size='sm' onClick={() => handleSave('draft')} disabled={isLoading}>
            {isLoading && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
            Save
          </Button>
        </div>
      ) : null}

      <Dialog open={showDiscardDialog} onOpenChange={setShowDiscardDialog}>
        <DialogContent className='sm:max-w-[425px]'>
          <DialogHeader>
            <DialogTitle>Discard changes?</DialogTitle>
            <DialogDescription>
              You have unsaved changes. Would you like to save as a draft or clear all content?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={handleSaveAsDraftFromDialog} disabled={isLoading}>
              Save as Draft
            </Button>
            <Button onClick={handleClearEditor} variant='destructive'>
              Clear All
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
