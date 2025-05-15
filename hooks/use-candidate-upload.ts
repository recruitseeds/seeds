'use client'

import { useTRPC } from '@/trpc/client'
import type { RouterOutputs } from '@/trpc/routers/_app'
import { useMutation } from '@tanstack/react-query'
import { useState } from 'react'
import { toast } from 'sonner'
interface R2UploadParams {
  file: File
  userId: string
}

type UploadResult = RouterOutputs['candidate']['uploadFile']

export function useR2Upload() {
  const [isReadingFile, setIsReadingFile] = useState<boolean>(false)
  const trpc = useTRPC()

  const uploadFileMutation = useMutation(
    trpc.candidate.uploadFile.mutationOptions({})
  )

  const uploadToR2 = async ({
    file,
  }: R2UploadParams): Promise<UploadResult | null> => {
    setIsReadingFile(true)
    try {
      const fileContentBase64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader()
        reader.readAsDataURL(file)
        reader.onload = () => {
          const result = reader.result as string
          resolve(result.split(',')[1])
        }
        reader.onerror = (error) => reject(error)
      })
      setIsReadingFile(false)

      if (!fileContentBase64) {
        toast.error('Failed to read file content.')
        throw new Error('Failed to read file content.')
      }

      const result = await uploadFileMutation.mutateAsync({
        fileName: file.name,
        fileMimeType: file.type || 'application/octet-stream',
        fileContentBase64,
        fileCategoryForR2Path: 'avatar',
        dbFileType: 'other',
      })
      return result
    } catch (error) {
      setIsReadingFile(false)
      console.error('Error in uploadToR2 process:', error)
      if (!uploadFileMutation.isError) {
        toast.error(
          (error as unknown as { message?: string })?.message ??
            'File upload process failed.'
        )
      }
      return null
    }
  }

  return {
    uploadToR2,
    isLoading: isReadingFile || uploadFileMutation.isPending,
  }
}
