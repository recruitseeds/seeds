'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { useTRPC } from '@/trpc/client'
import type { RouterOutputs } from '@/trpc/routers/_app'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Calendar, Loader2, Pencil, Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { DatePicker } from '@/components/ui/date-picker'
import { ScrollArea } from '@/components/ui/scroll-area'
import { format } from 'date-fns'

interface WorkExperiencePropsWithData {
  initialExperiencesData: RouterOutputs['candidate']['listWorkExperiences']
}
type WorkExperiencePropsWithoutData = object
type WorkExperienceProps = WorkExperiencePropsWithData | WorkExperiencePropsWithoutData

function hasData(props: WorkExperienceProps): props is WorkExperiencePropsWithData {
  return 'initialExperiencesData' in props
}

type WorkExperienceItem = NonNullable<RouterOutputs['candidate']['listWorkExperiences']>[number]

type WorkExperienceFormData = {
  job_title: string
  company_name: string
  location: string
  start_date: string
  end_date: string
  description: string
  is_current: boolean
}

export function WorkExperience(props: WorkExperienceProps) {
  const trpc = useTRPC()
  const queryClient = useQueryClient()
  const [isSheetOpen, setIsSheetOpen] = useState(false)
  const [editingExperience, setEditingExperience] = useState<WorkExperienceItem | null>(null)
  const [formData, setFormData] = useState<WorkExperienceFormData>({
    job_title: '',
    company_name: '',
    location: '',
    start_date: '',
    end_date: '',
    description: '',
    is_current: false,
  })

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [experienceIdToDelete, setExperienceIdToDelete] = useState<string | null>(null)

  const {
    data: experiencesData,
    isLoading,
    error,
  } = useQuery({
    ...trpc.candidate.listWorkExperiences.queryOptions(undefined),
    ...(hasData(props) ? { initialData: props.initialExperiencesData } : {}),
  })

  const createMutation = useMutation(
    trpc.candidate.createWorkExperience.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries(trpc.candidate.listWorkExperiences.queryFilter())
        handleCloseSheet()
      },
      onError: (error) => {
        console.error('Failed to add work experience:', error.message)
      },
    })
  )

  const updateMutation = useMutation(
    trpc.candidate.updateWorkExperience.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries(trpc.candidate.listWorkExperiences.queryFilter())
        handleCloseSheet()
      },
      onError: (error) => {
        console.error('Failed to update work experience:', error.message)
      },
    })
  )

  const deleteMutation = useMutation(
    trpc.candidate.deleteWorkExperience.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries(trpc.candidate.listWorkExperiences.queryFilter())
        setExperienceIdToDelete(null)
        setIsDeleteDialogOpen(false)
      },
      onError: (error) => {
        console.error('Failed to delete work experience:', error.message)
        setExperienceIdToDelete(null)
        setIsDeleteDialogOpen(false)
      },
    })
  )

  const handleOpenSheet = (experience?: WorkExperienceItem) => {
    if (experience) {
      setEditingExperience(experience)
      let initialDescription = ''
      if (experience.description) {
        if (
          typeof experience.description === 'object' &&
          experience.description !== null &&
          'text' in experience.description &&
          typeof (experience.description as { text: string }).text === 'string'
        ) {
          initialDescription = (experience.description as { text: string }).text
        } else if (typeof experience.description === 'string') {
          initialDescription = experience.description
        }
      }

      const formatUtcDateToLocal = (dateString: string) => {
        const date = new Date(dateString)
        const year = date.getUTCFullYear()
        const month = String(date.getUTCMonth() + 1).padStart(2, '0')
        const day = String(date.getUTCDate()).padStart(2, '0')
        return `${year}-${month}-${day}`
      }

      setFormData({
        job_title: experience.job_title || '',
        company_name: experience.company_name || '',
        location: experience.location || '',
        start_date: experience.start_date ? formatUtcDateToLocal(experience.start_date) : '',
        end_date: experience.end_date ? formatUtcDateToLocal(experience.end_date) : '',
        description: initialDescription,
        is_current: experience.is_current || false,
      })
    } else {
      setEditingExperience(null)
      setFormData({
        job_title: '',
        company_name: '',
        location: '',
        start_date: '',
        end_date: '',
        description: '',
        is_current: false,
      })
    }
    setIsSheetOpen(true)
  }

  const handleCloseSheet = () => {
    setIsSheetOpen(false)
    setEditingExperience(null)
    setFormData({
      job_title: '',
      company_name: '',
      location: '',
      start_date: '',
      end_date: '',
      description: '',
      is_current: false,
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const createUtcDate = (dateString: string) => {
      const [year, month, day] = dateString.split('-').map(Number)
      return new Date(Date.UTC(year, month - 1, day)).toISOString()
    }

    const dataToSubmit = {
      job_title: formData.job_title,
      company_name: formData.company_name,
      location: formData.location || null,
      start_date: formData.start_date ? createUtcDate(formData.start_date) : new Date().toISOString(),
      end_date: formData.is_current ? null : formData.end_date ? createUtcDate(formData.end_date) : null,
      description: formData.description || null,
      is_current: formData.is_current,
    }

    if (editingExperience) {
      updateMutation.mutate({
        id: editingExperience.id,
        ...dataToSubmit,
      })
    } else {
      createMutation.mutate(dataToSubmit)
    }
  }

  const handleDeleteClick = (id: string) => {
    setExperienceIdToDelete(id)
    setIsDeleteDialogOpen(true)
  }

  const confirmDeleteAction = () => {
    if (experienceIdToDelete) {
      deleteMutation.mutate({ workExperienceId: experienceIdToDelete })
    }
  }

  const cancelDeleteAction = () => {
    setIsDeleteDialogOpen(false)
    setExperienceIdToDelete(null)
  }

  const iconVerticalAlignClass = 'top-[6px]'

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Work Experience</CardTitle>
          <CardDescription>Your professional journey</CardDescription>
        </CardHeader>
        <CardContent className='flex justify-center items-center h-60'>
          <Loader2 className='h-10 w-10 animate-spin text-muted-foreground' />
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Work Experience</CardTitle>
          <CardDescription>Your professional journey</CardDescription>
        </CardHeader>
        <CardContent>
          <p className='text-red-600'>Error loading work experience: {error.message}</p>
        </CardContent>
      </Card>
    )
  }

  const experiences = experiencesData || []

  return (
    <>
      <Card className='bg-transparent border-none gap-6 pt-0'>
        <CardHeader className='flex flex-row items-center justify-between px-0'>
          <div>
            <CardTitle>Work Experience</CardTitle>
            <CardDescription>Your professional journey</CardDescription>
          </div>
          <div className='flex items-center gap-2'>
            <Button size='sm' onClick={() => handleOpenSheet()}>
              <Plus className='h-4 w-4 mr-1' /> Add Experience
            </Button>
          </div>
        </CardHeader>
        <CardContent className='px-0'>
          {experiences.length > 0 ? (
            <div className='relative'>
              <div className='space-y-8'>
                {experiences.map((experience, index) => (
                  <div key={experience.id} className='relative pl-8 group'>
                    {index < experiences.length - 1 && (
                      <div className='absolute left-[7px] top-[20px] bottom-[-45px] w-0.5 bg-border' />
                    )}
                    <div
                      className={`absolute left-0 ${iconVerticalAlignClass} size-4 rounded-full bg-foreground flex items-center justify-center border-2 border-background z-10`}
                    />
                    <div>
                      <div className='flex flex-col md:flex-row md:items-start justify-between mb-2'>
                        <div className='md:flex-1'>
                          <h3 className='font-medium text-lg'>{experience.job_title || 'N/A'}</h3>
                          <p className='text-muted-foreground'>
                            {experience.company_name || 'N/A'} • {experience.location || 'N/A'}
                          </p>
                        </div>
                        <div className='flex items-center gap-2'>
                          <div className='flex items-center gap-1 text-sm text-muted-foreground'>
                            <Calendar className='h-3 w-3' />
                            <span>
                              {experience.start_date
                                ? new Date(experience.start_date).toLocaleDateString('en-US', {
                                    month: 'short',
                                    year: 'numeric',
                                  })
                                : 'N/A'}
                              {' - '}
                              {experience.is_current
                                ? 'Present'
                                : experience.end_date
                                ? new Date(experience.end_date).toLocaleDateString('en-US', {
                                    month: 'short',
                                    year: 'numeric',
                                  })
                                : 'N/A'}
                            </span>
                          </div>
                          <div className='opacity-0 group-hover:opacity-100 transition-opacity flex gap-1'>
                            <Button
                              variant='ghost'
                              size='icon'
                              className='h-8 w-8'
                              onClick={() => handleOpenSheet(experience)}>
                              <Pencil className='h-3 w-3' />
                            </Button>
                            <Button
                              variant='ghost'
                              size='icon'
                              className='size-8 hover:bg-destructive-subtle hover:text-destructive-vibrant active:bg-destructive-subtle/80 active:text-destructive-vibrant'
                              onClick={() => handleDeleteClick(experience.id)}
                              disabled={deleteMutation.isPending}>
                              <Trash2 className='h-3 w-3' />
                            </Button>
                          </div>
                        </div>
                      </div>
                      <p className='text-sm mb-3'>
                        {experience.description &&
                        typeof experience.description === 'object' &&
                        'text' in experience.description
                          ? (experience.description as { text: string }).text
                          : typeof experience.description === 'string'
                          ? experience.description
                          : 'No description provided.'}
                      </p>
                      {experience.skills_tags &&
                      Array.isArray(experience.skills_tags) &&
                      experience.skills_tags.length > 0 ? (
                        <div className='flex flex-wrap gap-2'>
                          {(experience.skills_tags as string[]).map((skill) => (
                            <Badge key={skill} variant='secondary'>
                              {skill}
                            </Badge>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className='text-muted-foreground'>No work experience added yet.</p>
          )}
        </CardContent>
      </Card>

      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent className='flex flex-col sm:max-w-2xl  w-full h-[100dvh] overflow-y-auto'>
          <SheetHeader className='px-6 pt-6'>
            <SheetTitle>{editingExperience ? 'Edit' : 'Add'} Work Experience</SheetTitle>
            <SheetDescription>
              {editingExperience ? 'Update your work experience details' : 'Add a new work experience to your profile'}
            </SheetDescription>
          </SheetHeader>
          <ScrollArea className='flex-1'>
            <div className='px-6 py-4'>
              <form onSubmit={handleSubmit} className='space-y-4'>
                <div className='space-y-2'>
                  <Label htmlFor='job_title'>Job Title</Label>
                  <Input
                    id='job_title'
                    value={formData.job_title}
                    onChange={(e) => setFormData({ ...formData, job_title: e.target.value })}
                    required
                  />
                </div>
                <div className='space-y-2'>
                  <Label htmlFor='company_name'>Company Name</Label>
                  <Input
                    id='company_name'
                    value={formData.company_name}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        company_name: e.target.value,
                      })
                    }
                    required
                  />
                </div>
                <div className='space-y-2'>
                  <Label htmlFor='location'>Location</Label>
                  <Input
                    id='location'
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  />
                </div>
                <div className='space-y-2'>
                  <Label htmlFor='start_date'>Start Date</Label>
                  <DatePicker
                    selected={formData.start_date ? new Date(formData.start_date + 'T12:00:00') : undefined}
                    onSelect={(date) =>
                      setFormData({
                        ...formData,
                        start_date: date ? format(date, 'yyyy-MM-dd') : '',
                      })
                    }
                    placeholder='Select start date'
                  />
                  <input
                    type='text'
                    value={formData.start_date}
                    onChange={() => {}}
                    required
                    className='sr-only'
                    tabIndex={-1}
                  />
                </div>
                <div className='flex items-center space-x-2'>
                  <Switch
                    id='is_current'
                    checked={formData.is_current}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_current: checked })}
                  />
                  <Label htmlFor='is_current'>I currently work here</Label>
                </div>
                {!formData.is_current && (
                  <div className='space-y-2'>
                    <Label htmlFor='end_date'>End Date</Label>
                    <DatePicker
                      selected={formData.end_date ? new Date(formData.end_date + 'T12:00:00') : undefined}
                      onSelect={(date) =>
                        setFormData({
                          ...formData,
                          end_date: date ? format(date, 'yyyy-MM-dd') : '',
                        })
                      }
                      placeholder='Select end date'
                      disabled={formData.is_current}
                    />
                  </div>
                )}
                <div className='space-y-2'>
                  <Label htmlFor='description'>Description</Label>
                  <Textarea
                    id='description'
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        description: e.target.value,
                      })
                    }
                    rows={4}
                  />
                </div>
              </form>
            </div>
          </ScrollArea>
          <SheetFooter className='px-6 pb-6 pt-4'>
            <Button
              type='button'
              onClick={(e) => {
                const sheetContent = e.currentTarget.closest('.flex.flex-col[role="dialog"]')
                const form = sheetContent?.querySelector('form')
                if (form) {
                  form.requestSubmit()
                }
              }}
              disabled={createMutation.isPending || updateMutation.isPending}
              className='w-full sm:w-auto'>
              {createMutation.isPending || updateMutation.isPending ? (
                <>
                  <Loader2 className='size-4 animate-spin' />
                  {editingExperience ? 'Update' : 'Add'}
                </>
              ) : editingExperience ? (
                'Update'
              ) : (
                'Add'
              )}
            </Button>
            <Button type='button' variant='outline' onClick={handleCloseSheet} className='w-full sm:w-auto'>
              Cancel
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete this work experience.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={cancelDeleteAction}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteAction} disabled={deleteMutation.isPending}>
              {deleteMutation.isPending ? (
                <>
                  <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                  Deleting...
                </>
              ) : (
                'Delete'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
