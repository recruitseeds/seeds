'use client'

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
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { DatePicker } from '@/components/ui/date-picker'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { useTRPC } from '@/trpc/client'
import type { RouterOutputs } from '@/trpc/routers/_app'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { format } from 'date-fns'
import { Calendar, Loader2, Pencil, Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

interface EducationPropsWithData {
  initialEducationData: RouterOutputs['candidate']['listEducation']
}

type EducationPropsWithoutData = object

type EducationProps = EducationPropsWithData | EducationPropsWithoutData

function hasData(props: EducationProps): props is EducationPropsWithData {
  return 'initialEducationData' in props
}

type EducationItem = NonNullable<RouterOutputs['candidate']['listEducation']>[number]

const educationSchema = z.object({
  institution_name: z.string().min(1, 'Institution name is required.'),
  degree_name: z.string().min(1, 'Degree name is required.'),
  field_of_study: z.string().optional().nullable(),
  start_date: z.string().min(1, 'Start date is required.'),
  end_date: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  is_current: z.boolean().default(false),
})

type EducationFormValues = z.infer<typeof educationSchema>

export function Education(props: EducationProps) {
  const trpc = useTRPC()
  const queryClient = useQueryClient()
  const [isSheetOpen, setIsSheetOpen] = useState(false)
  const [editingEducation, setEditingEducation] = useState<EducationItem | null>(null)

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [educationIdToDelete, setEducationIdToDelete] = useState<string | null>(null)

  const form = useForm<EducationFormValues>({
    resolver: zodResolver(educationSchema),
    defaultValues: {
      institution_name: '',
      degree_name: '',
      field_of_study: '',
      start_date: '',
      end_date: '',
      description: '',
      is_current: false,
    },
  })

  const {
    data: educationData,
    isLoading,
    error,
  } = useQuery({
    ...trpc.candidate.listEducation.queryOptions(undefined),
    ...(hasData(props) ? { initialData: props.initialEducationData } : {}),
  })

  const createMutation = useMutation(
    trpc.candidate.createEducation.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries(trpc.candidate.listEducation.queryFilter())
        setIsSheetOpen(false)
      },
      onError: (error) => {
        console.error('Failed to add education:', error.message)
      },
    })
  )

  const updateMutation = useMutation(
    trpc.candidate.updateEducation.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries(trpc.candidate.listEducation.queryFilter())
        setIsSheetOpen(false)
      },
      onError: (error) => {
        console.error('Failed to update education:', error.message)
      },
    })
  )

  const deleteMutation = useMutation(
    trpc.candidate.deleteEducation.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries(trpc.candidate.listEducation.queryFilter())
        setEducationIdToDelete(null)
        setIsDeleteDialogOpen(false)
      },
      onError: (error) => {
        console.error('Failed to delete education:', error.message)
        setEducationIdToDelete(null)
        setIsDeleteDialogOpen(false)
      },
    })
  )

  const handleOpenSheet = (education?: EducationItem) => {
    if (education) {
      setEditingEducation(education)
      let initialDescription = ''
      if (education.description) {
        if (typeof education.description === 'string') {
          initialDescription = education.description
        } else if (
          typeof education.description === 'object' &&
          education.description !== null &&
          'text' in education.description &&
          typeof (education.description as { text: string }).text === 'string'
        ) {
          initialDescription = (education.description as { text: string }).text
        } else if (typeof education.description === 'object') {
          initialDescription = JSON.stringify(education.description)
        }
      }

      const formatUtcDateToLocal = (dateString: string) => {
        const date = new Date(dateString)
        const year = date.getUTCFullYear()
        const month = String(date.getUTCMonth() + 1).padStart(2, '0')
        const day = String(date.getUTCDate()).padStart(2, '0')
        return `${year}-${month}-${day}`
      }

      form.reset({
        institution_name: education.institution_name || '',
        degree_name: education.degree_name || '',
        field_of_study: education.field_of_study || '',
        start_date: education.start_date ? formatUtcDateToLocal(education.start_date) : '',
        end_date: education.end_date ? formatUtcDateToLocal(education.end_date) : '',
        description: initialDescription,
        is_current: education.is_current || false,
      })
    } else {
      setEditingEducation(null)
      form.reset({
        institution_name: '',
        degree_name: '',
        field_of_study: '',
        start_date: '',
        end_date: '',
        description: '',
        is_current: false,
      })
    }
    setIsSheetOpen(true)
  }

  const onSheetOpenChange = (open: boolean) => {
    setIsSheetOpen(open)
    if (!open) {
      setEditingEducation(null)
      form.reset()
    }
  }

  const onSubmit = (data: EducationFormValues) => {
    const createUtcDate = (dateString: string) => {
      const [year, month, day] = dateString.split('-').map(Number)
      return new Date(Date.UTC(year, month - 1, day)).toISOString()
    }

    const payload = {
      institution_name: data.institution_name,
      degree_name: data.degree_name,
      field_of_study: data.field_of_study || null,
      start_date: data.start_date ? createUtcDate(data.start_date) : new Date().toISOString(),
      end_date: data.is_current ? null : data.end_date ? createUtcDate(data.end_date) : null,
      description: data.description || null,
      is_current: data.is_current,
    }

    if (editingEducation) {
      updateMutation.mutate({
        id: editingEducation.id,
        ...payload,
      })
    } else {
      createMutation.mutate(payload)
    }
  }

  const handleDeleteClick = (id: string) => {
    setEducationIdToDelete(id)
    setIsDeleteDialogOpen(true)
  }

  const confirmDeleteAction = () => {
    if (educationIdToDelete) {
      deleteMutation.mutate({ educationId: educationIdToDelete })
    }
  }

  const cancelDeleteAction = () => {
    setIsDeleteDialogOpen(false)
    setEducationIdToDelete(null)
  }

  const iconVerticalAlignClass = 'top-[6px]'
  const isSubmitting = form.formState.isSubmitting || createMutation.isPending || updateMutation.isPending
  const watchIsCurrent = form.watch('is_current')

  if (isLoading) {
    return (
      <Card flat className='bg-transparent shadow-none'>
        <CardHeader>
          <CardTitle>Education</CardTitle>
          <CardDescription>Your academic background</CardDescription>
        </CardHeader>
        <CardContent className='flex justify-center items-center h-60'>
          <Loader2 className='h-10 w-10 animate-spin text-muted-foreground' />
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card flat className='bg-transparent shadow-none'>
        <CardHeader>
          <CardTitle>Education</CardTitle>
          <CardDescription>Your academic background</CardDescription>
        </CardHeader>
        <CardContent>
          <p className='text-red-600'>Error loading education: {error.message}</p>
        </CardContent>
      </Card>
    )
  }

  const educationItems = educationData || []

  return (
    <>
      <Card className='bg-transparent border-none pt-0'>
        <CardHeader className='flex flex-row items-center justify-between px-0'>
          <div>
            <CardTitle>Education</CardTitle>
            <CardDescription>Your academic background</CardDescription>
          </div>
          <div className='flex items-center gap-2'>
            <Button size='sm' onClick={() => handleOpenSheet()}>
              <Plus className='h-4 w-4 mr-1' /> Add Education
            </Button>
          </div>
        </CardHeader>
        <CardContent className='px-0'>
          {educationItems.length > 0 ? (
            <div className='relative'>
              <div className='space-y-8'>
                {educationItems.map((education, index) => (
                  <div key={education.id} className='relative pl-8 group'>
                    {index < educationItems.length - 1 && (
                      <div className='absolute left-[7px] top-[20px] bottom-[-45px] w-0.5 bg-border' />
                    )}
                    <div
                      className={`absolute left-0 ${iconVerticalAlignClass} size-4 rounded-full bg-foreground flex items-center justify-center border-2 border-background z-10`}
                    />
                    <div>
                      <div className='flex flex-col md:flex-row md:items-start justify-between mb-1'>
                        <div className='md:flex-1'>
                          <h3 className='font-medium text-lg'>{education.institution_name || 'N/A'}</h3>
                          <p className='text-muted-foreground text-sm'>
                            {education.degree_name || 'N/A'}
                            {education.field_of_study ? ` • ${education.field_of_study}` : ''}
                          </p>
                        </div>
                        <div className='flex items-center gap-2 mt-1 md:mt-0'>
                          <div className='flex items-center gap-1 text-sm text-muted-foreground'>
                            <Calendar className='h-3 w-3' />
                            <span>
                              {education.start_date
                                ? new Date(education.start_date).toLocaleDateString('en-US', {
                                    month: 'short',
                                    year: 'numeric',
                                  })
                                : 'N/A'}
                              {' - '}
                              {education.is_current
                                ? 'Present'
                                : education.end_date
                                ? new Date(education.end_date).toLocaleDateString('en-US', {
                                    month: 'short',
                                    year: 'numeric',
                                  })
                                : 'Present'}
                            </span>
                          </div>
                          <div className='opacity-0 group-hover:opacity-100 transition-opacity flex gap-1'>
                            <Button
                              variant='ghost'
                              size='icon'
                              className='h-8 w-8'
                              onClick={() => handleOpenSheet(education)}>
                              <Pencil className='h-3 w-3' />
                            </Button>
                            <Button
                              variant='ghost'
                              size='icon'
                              className='size-8 hover:bg-destructive-subtle hover:text-destructive-vibrant active:bg-destructive-subtle/80 active:text-destructive-vibrant'
                              onClick={() => handleDeleteClick(education.id)}
                              disabled={deleteMutation.isPending}>
                              <Trash2 className='h-3 w-3' />
                            </Button>
                          </div>
                        </div>
                      </div>
                      {education.description && (
                        <p className='text-sm text-muted-foreground mt-1'>
                          {typeof education.description === 'object' &&
                          education.description &&
                          'text' in education.description
                            ? (education.description as { text: string }).text
                            : typeof education.description === 'string'
                            ? education.description
                            : typeof education.description === 'object' && education.description !== null
                            ? JSON.stringify(education.description)
                            : ''}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className='text-muted-foreground'>No education history added yet.</p>
          )}
        </CardContent>
      </Card>

      <Sheet open={isSheetOpen} onOpenChange={onSheetOpenChange}>
        <SheetContent className='flex flex-col sm:max-w-2xl w-full h-[100dvh] overflow-y-auto'>
          <SheetHeader className='px-6 pt-6'>
            <SheetTitle>{editingEducation ? 'Edit' : 'Add'} Education</SheetTitle>
            <SheetDescription>
              {editingEducation ? 'Update your education details' : 'Add a new education entry to your profile'}
            </SheetDescription>
          </SheetHeader>
          <ScrollArea className='flex-1'>
            <div className='px-6 py-4'>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-4'>
                  <FormField
                    control={form.control}
                    name='institution_name'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Institution Name</FormLabel>
                        <FormControl>
                          <Input placeholder='University of Example' {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name='degree_name'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Degree Name</FormLabel>
                        <FormControl>
                          <Input placeholder='Bachelor of Science' {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name='field_of_study'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Field of Study</FormLabel>
                        <FormControl>
                          <Input placeholder='Computer Science' {...field} value={field.value || ''} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name='start_date'
                    render={({ field }) => (
                      <FormItem className='flex flex-col'>
                        <FormLabel>Start Date</FormLabel>
                        <DatePicker
                          selected={field.value ? new Date(field.value + 'T12:00:00') : undefined}
                          onSelect={(date) => field.onChange(date ? format(date, 'yyyy-MM-dd') : '')}
                          placeholder='Select start date'
                          disabled={isSubmitting}
                        />
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name='is_current'
                    render={({ field }) => (
                      <FormItem>
                        <div className='flex items-center space-x-2'>
                          <FormControl>
                            <Switch checked={field.value} onCheckedChange={field.onChange} disabled={isSubmitting} />
                          </FormControl>
                          <FormLabel>I currently study here</FormLabel>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {!watchIsCurrent && (
                    <FormField
                      control={form.control}
                      name='end_date'
                      render={({ field }) => (
                        <FormItem className='flex flex-col'>
                          <FormLabel>End Date (or expected)</FormLabel>
                          <DatePicker
                            selected={field.value ? new Date(field.value + 'T12:00:00') : undefined}
                            onSelect={(date) => field.onChange(date ? format(date, 'yyyy-MM-dd') : '')}
                            placeholder='Select end date'
                            disabled={isSubmitting || watchIsCurrent}
                          />
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                  <FormField
                    control={form.control}
                    name='description'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description (Optional)</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder='E.g., Thesis title, honors, relevant coursework'
                            rows={3}
                            {...field}
                            value={field.value || ''}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </form>
              </Form>
            </div>
          </ScrollArea>
          <SheetFooter className='px-6 pb-6 pt-4'>
            <Button
              type='button'
              onClick={form.handleSubmit(onSubmit)}
              disabled={isSubmitting}
              className='w-full sm:w-auto'>
              {isSubmitting ? (
                <>
                  <Loader2 className='size-4 animate-spin' />
                  {editingEducation ? 'Update' : 'Add'}
                </>
              ) : editingEducation ? (
                'Update'
              ) : (
                'Add'
              )}
            </Button>
            <Button type='button' variant='outline' onClick={() => setIsSheetOpen(false)} className='w-full sm:w-auto'>
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
              This action cannot be undone. This will permanently delete this education entry.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={cancelDeleteAction}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteAction} disabled={deleteMutation.isPending}>
              {deleteMutation.isPending ? (
                <>
                  <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                  Delete
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
