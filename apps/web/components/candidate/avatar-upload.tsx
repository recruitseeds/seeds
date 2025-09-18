'use client'

import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar'
import { useR2Upload } from '@/hooks/use-candidate-upload'
import { useTRPC } from '@/trpc/client'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Loader2, Upload } from 'lucide-react'
import { forwardRef, useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'



interface ClientAvatarUploadProps {
  userId: string
  initialAvatarUrl?: string | null
  fallbackInitials: string
  onUploadSuccess?: (newAvatarUrl: string) => void
  size?: number
}

const R2_PUBLIC_URL_BASE = process.env.NEXT_PUBLIC_CLOUDFLARE_R2_PUBLIC_URL

function getPublicUrlFromR2Key(
  r2Key: string | null | undefined
): string | null {
  if (!r2Key) return null
  if (!R2_PUBLIC_URL_BASE) return r2Key
  if (r2Key.startsWith('http://') || r2Key.startsWith('https://')) return r2Key
  return `${R2_PUBLIC_URL_BASE}/${r2Key}`
}

export const ClientAvatarUpload = forwardRef<
  HTMLInputElement,
  ClientAvatarUploadProps
>(
  (
    { userId, initialAvatarUrl, fallbackInitials, onUploadSuccess, size = 128 },
    ref
  ) => {
    const [avatarPreview, setAvatarPreview] = useState<string | null>(() =>
      getPublicUrlFromR2Key(initialAvatarUrl)
    )
    const inputRef = useRef<HTMLInputElement>(null)
    const { uploadToR2, isLoading: isUploadingToR2 } = useR2Upload()
    const trpc = useTRPC()
    const tanstackQueryClient = useQueryClient()

    useEffect(() => {
      setAvatarPreview(getPublicUrlFromR2Key(initialAvatarUrl))
    }, [initialAvatarUrl])

    const updateProfileMutation = useMutation(
      trpc.candidate.updateProfile.mutationOptions({
        onSuccess: (updatedProfileData) => {
          toast.success('Avatar updated successfully!')
          tanstackQueryClient.invalidateQueries({
            queryKey: trpc.candidate.getProfile.queryKey(undefined),
          })
          if (updatedProfileData?.avatar_url) {
            const publicUrl = getPublicUrlFromR2Key(
              updatedProfileData.avatar_url
            )
            if (publicUrl && onUploadSuccess) {
              onUploadSuccess(publicUrl)
            }
          }
        },
        onError: (error) => {
          toast.error(
            error.message || 'Failed to update profile with new avatar.'
          )
          setAvatarPreview(getPublicUrlFromR2Key(initialAvatarUrl))
        },
      })
    )

    const handleFileSelectAndUpload = async (
      event: React.ChangeEvent<HTMLInputElement>
    ) => {
      const file = event.target.files?.[0]
      if (!file) return

      if (file.size > 5 * 1024 * 1024) {
        toast.error('File is too large. Please select an image under 5MB.')
        return
      }

      const reader = new FileReader()
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string)
      }
      reader.readAsDataURL(file)

      const uploadResult = await uploadToR2({ file, userId })

      if (uploadResult && uploadResult.storage_path) {
        updateProfileMutation.mutate({ avatar_url: uploadResult.storage_path })
      } else {
        setAvatarPreview(getPublicUrlFromR2Key(initialAvatarUrl))
      }
    }

    const fileInputRef = ref || inputRef
    const isLoading = isUploadingToR2 || updateProfileMutation.isPending

    return (
      <div
        className='relative group rounded-full'
        style={{ width: size, height: size }}
        onClick={() => {
          if (!isLoading && 'current' in fileInputRef && fileInputRef.current) {
            fileInputRef.current.click()
          }
        }}>
        <Avatar className='w-full h-full border cursor-pointer'>
          {isLoading ? (
            <AvatarFallback className='flex items-center justify-center bg-muted'>
              <Loader2 className='h-1/2 w-1/2 animate-spin text-muted-foreground' />
            </AvatarFallback>
          ) : avatarPreview ? (
            <AvatarImage src={avatarPreview} alt='Profile Avatar' />
          ) : (
            <AvatarFallback
              className={`bg-primary/10 text-primary text-${
                size > 64 ? '2xl' : 'lg'
              }`}>
              {fallbackInitials}
            </AvatarFallback>
          )}
        </Avatar>
        {!isLoading && (
          <div className='absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity rounded-full cursor-pointer'>
            <Upload
              className={`size-${size > 64 ? '1/3' : '1/2'} text-white`}
            />
          </div>
        )}
        <input
          ref={fileInputRef}
          type='file'
          className='hidden'
          accept='image/png, image/jpeg, image/gif, image/webp'
          onChange={handleFileSelectAndUpload}
          disabled={isLoading}
        />
      </div>
    )
  }
)
ClientAvatarUpload.displayName = 'ClientAvatarUpload'
