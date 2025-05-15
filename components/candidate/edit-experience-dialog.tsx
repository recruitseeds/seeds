'use client'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useCharacterLimit } from '@/hooks/use-character-limit'
import { useFileUpload } from '@/hooks/use-file-upload'
import { CheckIcon, ImagePlusIcon, XIcon } from 'lucide-react'
import Image from 'next/image'
import { useId, useState } from 'react'
import { ExperienceDialogTimeline } from './experience-dialog-timeline'

type Application = {
  id: string
  job_title: string | null
  company_name: string | null
  status: string | null
  application_date: string | null
  next_step_description?: string | null
  next_step_date?: string | null
}

const initialBgImage = [
  {
    name: 'profile-bg.jpg',
    size: 1528737,
    type: 'image/jpeg',
    url: '/profile-bg.jpg',
    id: 'profile-bg-123456789',
  },
]

const initialAvatarImage = [
  {
    name: 'avatar-72-01.jpg',
    size: 1528737,
    type: 'image/jpeg',
    url: '/avatar-72-01.jpg',
    id: 'avatar-123456789',
  },
]

interface EditExperienceDialogProps {
  application: Application
  triggerButton?: React.ReactNode
}

export function EditExperienceDialog({
  application,
  triggerButton,
}: EditExperienceDialogProps) {
  const id = useId()
  const [isEditing, setIsEditing] = useState(false)
  const [isOpen, setIsOpen] = useState(false)

  const maxLength = 180
  const {
    value: bioValue,
    characterCount,
    handleChange: handleBioChange,
    maxLength: limit,
  } = useCharacterLimit({
    maxLength,
    initialValue:
      'Hey, I am Margaret, a web developer who loves turning ideas into amazing websites!',
  })

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open)
    if (!open) {
      setIsEditing(false)
    }
  }

  const handleSaveChanges = () => {
    handleOpenChange(false)
  }

  if (!application) {
    return (
      <Dialog open={isOpen} onOpenChange={handleOpenChange}>
        <DialogTrigger asChild>
          {triggerButton || (
            <Button variant='outline' size='sm'>
              View
            </Button>
          )}
        </DialogTrigger>
        <DialogContent>Loading application details...</DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {triggerButton || (
          <Button variant='outline' size='sm'>
            View
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className='flex flex-col gap-0 p-0 sm:max-w-lg [&>button:last-child]:top-3.5'>
        <DialogHeader className='contents space-y-0 text-left'>
          <DialogTitle className='border-b px-6 py-4 text-base'>
            {isEditing ? 'Edit profile' : 'Application Details'}
          </DialogTitle>
        </DialogHeader>
        <DialogDescription className='sr-only'>
          {isEditing
            ? 'Make changes to your profile here.'
            : `Details for your application to ${
                application.job_title || 'N/A'
              } at ${application.company_name || 'N/A'}.`}
        </DialogDescription>

        {isEditing ? (
          <div className='overflow-y-auto'>
            <ProfileBg />
            <Avatar />
            <div className='px-6 pt-4 pb-6'>
              <form className='space-y-4'>
                <div className='flex flex-col gap-4 sm:flex-row'>
                  <div className='flex-1 space-y-2'>
                    <Label htmlFor={`${id}-first-name`}>First name</Label>
                    <Input
                      id={`${id}-first-name`}
                      placeholder='Matt'
                      defaultValue='Margaret'
                      type='text'
                      required
                    />
                  </div>
                  <div className='flex-1 space-y-2'>
                    <Label htmlFor={`${id}-last-name`}>Last name</Label>
                    <Input
                      id={`${id}-last-name`}
                      placeholder='Welsh'
                      defaultValue='Villard'
                      type='text'
                      required
                    />
                  </div>
                </div>
                <div className='*:not-first:mt-2'>
                  <Label htmlFor={`${id}-username`}>Username</Label>
                  <div className='relative'>
                    <Input
                      id={`${id}-username`}
                      className='peer pe-9'
                      placeholder='Username'
                      defaultValue='margaret-villard-69'
                      type='text'
                      required
                    />
                    <div className='text-muted-foreground/80 pointer-events-none absolute inset-y-0 end-0 flex items-center justify-center pe-3 peer-disabled:opacity-50'>
                      <CheckIcon
                        size={16}
                        className='text-emerald-500'
                        aria-hidden='true'
                      />
                    </div>
                  </div>
                </div>
                <div className='*:not-first:mt-2'>
                  <Label htmlFor={`${id}-website`}>Website</Label>
                  <div className='flex rounded-md shadow-xs'>
                    <span className='border-input bg-background text-muted-foreground -z-10 inline-flex items-center rounded-s-md border px-3 text-sm'>
                      https://
                    </span>
                    <Input
                      id={`${id}-website`}
                      className='-ms-px rounded-s-none shadow-none'
                      placeholder='yourwebsite.com'
                      defaultValue='www.margaret.com'
                      type='text'
                    />
                  </div>
                </div>
                <div className='*:not-first:mt-2'>
                  <Label htmlFor={`${id}-bio`}>Biography</Label>
                  <Textarea
                    id={`${id}-bio`}
                    placeholder='Write a few sentences about yourself'
                    value={bioValue}
                    maxLength={maxLength}
                    onChange={handleBioChange}
                    aria-describedby={`${id}-description-bio`}
                  />
                  <p
                    id={`${id}-description-bio`}
                    className='text-muted-foreground mt-2 text-right text-xs'
                    role='status'
                    aria-live='polite'>
                    <span className='tabular-nums'>
                      {limit - characterCount}
                    </span>{' '}
                    characters left
                  </p>
                </div>
              </form>
            </div>
          </div>
        ) : (
          <ExperienceDialogTimeline application={application} />
        )}

        <DialogFooter className='border-t px-6 py-4'>
          {isEditing ? (
            <>
              <Button
                type='button'
                variant='outline'
                onClick={() => setIsEditing(false)}>
                Cancel
              </Button>
              <Button type='button' onClick={handleSaveChanges}>
                Save changes
              </Button>
            </>
          ) : (
            <Button type='button' onClick={() => setIsEditing(true)}>
              Edit application
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function ProfileBg() {
  const [{ files }, { removeFile, openFileDialog, getInputProps }] =
    useFileUpload({
      accept: 'image/*',
      initialFiles: initialBgImage,
    })

  const currentImage = files[0]?.preview || null

  return (
    <div className='h-32'>
      <div className='bg-muted relative flex size-full items-center justify-center overflow-hidden'>
        {currentImage && (
          <Image
            className='size-full object-cover'
            src={currentImage}
            alt={
              files[0]?.preview
                ? 'Preview of uploaded image'
                : 'Default profile background'
            }
            width={512}
            height={128}
            priority={true}
          />
        )}
        <div className='absolute inset-0 flex items-center justify-center gap-2'>
          <button
            type='button'
            className='focus-visible:border-ring focus-visible:ring-ring/50 z-50 flex size-10 cursor-pointer items-center justify-center rounded-full bg-black/60 text-white transition-[color,box-shadow] outline-none hover:bg-black/80 focus-visible:ring-[3px]'
            onClick={openFileDialog}
            aria-label={currentImage ? 'Change image' : 'Upload image'}>
            <ImagePlusIcon size={16} aria-hidden='true' />
          </button>
          {currentImage && (
            <button
              type='button'
              className='focus-visible:border-ring focus-visible:ring-ring/50 z-50 flex size-10 cursor-pointer items-center justify-center rounded-full bg-black/60 text-white transition-[color,box-shadow] outline-none hover:bg-black/80 focus-visible:ring-[3px]'
              onClick={() => removeFile(files[0]?.id)}
              aria-label='Remove image'>
              <XIcon size={16} aria-hidden='true' />
            </button>
          )}
        </div>
      </div>
      <input
        {...getInputProps()}
        className='sr-only'
        aria-label='Upload image file'
      />
    </div>
  )
}

function Avatar() {
  const [{ files }, { openFileDialog, getInputProps }] = useFileUpload({
    accept: 'image/*',
    initialFiles: initialAvatarImage,
  })

  const currentImage = files[0]?.preview || null

  return (
    <div className='-mt-10 px-6'>
      <div className='border-background bg-muted relative flex size-20 items-center justify-center overflow-hidden rounded-full border-4 shadow-xs shadow-black/10'>
        {currentImage && (
          <Image
            src={currentImage}
            className='size-full object-cover'
            width={80}
            height={80}
            alt='Profile image'
            priority={true}
          />
        )}
        <button
          type='button'
          className='focus-visible:border-ring focus-visible:ring-ring/50 absolute flex size-8 cursor-pointer items-center justify-center rounded-full bg-black/60 text-white transition-[color,box-shadow] outline-none hover:bg-black/80 focus-visible:ring-[3px]'
          onClick={openFileDialog}
          aria-label='Change profile picture'>
          <ImagePlusIcon size={16} aria-hidden='true' />
        </button>
        <input
          {...getInputProps()}
          className='sr-only'
          aria-label='Upload profile picture'
        />
      </div>
    </div>
  )
}
