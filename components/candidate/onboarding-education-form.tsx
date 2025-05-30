'use client'

import { createCandidateEducationAction } from '@/actions/create-candidate-education-action'
import { deleteCandidateEducationAction } from '@/actions/delete-candidate-education-action'
import {
  candidateEducationFormSchema,
  createCandidateEducationSchema,
  updateCandidateEducationSchema,
} from '@/actions/schema'
import { updateCandidateEducationAction } from '@/actions/update-candidate-education'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import DatePicker from '@/components/ui/date-picker'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { formatDateToYYYYMMDD, parseDateString } from '@/lib/dates'
import type { CandidateEducation } from '@/supabase/queries'
import type { Json } from '@/supabase/types/db'
import { zodResolver } from '@hookform/resolvers/zod'
import { format } from 'date-fns'
import { Calendar as CalendarIcon, Loader2, MapPin, Pencil, Plus, Trash2 } from 'lucide-react'
import { useAction } from 'next-safe-action/hooks'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import type { z } from 'zod'

type EducationFormValues = z.infer<typeof candidateEducationFormSchema>

const sortEducationEntries = (entries: CandidateEducation[]): CandidateEducation[] => {
  return [...entries].sort((a, b) => {
    if (!a.end_date && b.end_date) return -1
    if (a.end_date && !b.end_date) return 1

    if (!a.end_date && !b.end_date) {
      if (!a.start_date && !b.start_date) return 0
      if (!a.start_date) return 1
      if (!b.start_date) return -1
      return new Date(b.start_date).getTime() - new Date(a.start_date).getTime()
    }

    if (a.end_date && b.end_date) {
      return new Date(b.end_date).getTime() - new Date(a.end_date).getTime()
    }

    return 0
  })
}

interface OnboardingEducationFormProps {
  initialData: CandidateEducation[]
}

export function OnboardingEducationForm({ initialData }: OnboardingEducationFormProps) {
  const router = useRouter()
  const [degrees, setDegrees] = useState<CandidateEducation[]>(initialData || [])
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingDegree, setEditingDegree] = useState<CandidateEducation | null>(null)
  const [educationToDeleteId, setEducationToDeleteId] = useState<string | null>(null)
  const submissionSourceRef = useRef<'initial_save_button' | 'continue_implicit_save' | null>(null)

  const form = useForm<EducationFormValues>({
    resolver: zodResolver(candidateEducationFormSchema),
    defaultValues: {
      degree: '',
      institution: '',
      location: '',
      startDate: '',
      endDate: '',
      description: '',
      achievements: undefined,
    },
  })

  const resetForm = useCallback(
    (degreeData: CandidateEducation | null = null) => {
      form.reset({
        id: degreeData?.id ?? undefined,
        degree: degreeData?.degree_name ?? '',
        institution: degreeData?.institution_name ?? '',
        location: degreeData?.location ?? '',
        startDate: degreeData?.start_date ?? '',
        endDate: degreeData?.end_date ?? '',
        description: displayDescription(degreeData?.description),
        achievements: degreeData?.achievements ?? undefined,
      })
      form.clearErrors()
    },
    [form]
  )

  useEffect(() => {
    if (initialData.length === 0 && !editingDegree) {
      resetForm(null)
    }
  }, [initialData, editingDegree, resetForm])

  const { execute: createEducation, status: createStatus } = useAction(createCandidateEducationAction, {
    onSuccess: (hookProvidedResult) => {
      const actionResult = hookProvidedResult.data
      if (actionResult?.success && actionResult.data) {
        const newEducationRecord = actionResult.data as CandidateEducation
        setDegrees((prev) => sortEducationEntries([...prev, newEducationRecord]))
        if (isFormOpen) {
          closeDialog()
        } else {
          resetForm(null)
        }
      } else {
        console.error('Create education error response:', JSON.stringify(hookProvidedResult))
      }
    },
    onError: (error) => {
      console.error('Create education hook error:', JSON.stringify(error))
    },
    onSettled: () => {
      submissionSourceRef.current = null
    },
  })

  const { execute: updateEducation, status: updateStatus } = useAction(updateCandidateEducationAction, {
    onSuccess: (hookProvidedResult) => {
      const actionResult = hookProvidedResult.data
      if (actionResult?.success && actionResult.data) {
        const updatedRecord = actionResult.data as CandidateEducation
        setDegrees((prev) => sortEducationEntries(prev.map((d) => (d.id === updatedRecord.id ? updatedRecord : d))))
        closeDialog()
      } else {
        console.error('Update education error response:', JSON.stringify(hookProvidedResult))
      }
    },
    onError: (error) => {
      console.error('Update education hook error:', JSON.stringify(error))
    },
  })

  const { execute: deleteEducation, status: deleteStatus } = useAction(deleteCandidateEducationAction, {
    onSuccess: ({ data, input }) => {
      const idToDelete = input.id

      if (data && data.success === true) {
        setDegrees((prev) => prev.filter((deg) => deg.id !== idToDelete))
      } else {
        console.error('Delete education failed or returned unexpected data:', data)
      }
      setEducationToDeleteId(null)
    },
    onError: (hookErrorPayload) => {
      console.error('Delete education hook error:', hookErrorPayload.error)
      setEducationToDeleteId(null)
    },
  })

  const isSubmittingCombined =
    createStatus === 'executing' || updateStatus === 'executing' || deleteStatus === 'executing'

  const displayDescription = (description: Json | null | undefined): string => {
    if (!description) return ''
    if (typeof description === 'string') return description
    if (typeof description === 'object' && description !== null && !Array.isArray(description)) {
      if ('text' in description && typeof description.text === 'string') {
        return description.text
      }
      try {
        return JSON.stringify(description)
      } catch {
        return ''
      }
    }
    return String(description)
  }

  const openAddDialog = () => {
    setEditingDegree(null)
    resetForm(null)
    setIsFormOpen(true)
  }

  const openEditDialog = (degree: CandidateEducation) => {
    setEditingDegree(degree)
    resetForm(degree)
    setIsFormOpen(true)
  }

  const closeDialog = () => {
    setIsFormOpen(false)
    setEditingDegree(null)
  }

  const handleFormSubmit = (values: EducationFormValues) => {
    let descriptionValue: string | { text: string } | null | undefined = values.description

    if (typeof descriptionValue === 'string' && descriptionValue.trim() !== '') {
      try {
        JSON.parse(descriptionValue)
      } catch {
        descriptionValue = { text: descriptionValue }
      }
    } else if (descriptionValue === '') {
      descriptionValue = null
    }

    const basePayload = {
      degree_name: values.degree || null,
      institution_name: values.institution || null,
      location: values.location || null,
      start_date: values.startDate || null,
      end_date: values.endDate || null,
      description: descriptionValue,
      achievements: values.achievements || null,
    }

    if (editingDegree && values.id) {
      const updatePayload = { ...basePayload, id: values.id }
      const validation = updateCandidateEducationSchema.safeParse(updatePayload)
      if (!validation.success) {
        for (const issue of validation.error.issues) {
          form.setError(issue.path[0] as keyof EducationFormValues, {
            message: issue.message,
          })
        }
        return
      }
      updateEducation(validation.data)
    } else {
      const validation = createCandidateEducationSchema.safeParse(basePayload)
      if (!validation.success) {
        for (const issue of validation.error.issues) {
          form.setError(issue.path[0] as keyof EducationFormValues, {
            message: issue.message,
          })
        }
        return
      }
      if (!isFormOpen && !editingDegree) {
        submissionSourceRef.current = 'initial_save_button'
      }
      createEducation(validation.data)
    }
  }

  const confirmDeleteDegree = () => {
    if (educationToDeleteId) {
      deleteEducation({ id: educationToDeleteId })
    }
  }

  const handleContinue = async () => {
    if (degrees.length === 0 && !isFormOpen) {
      const isValid = await form.trigger()
      if (isValid) {
        const currentValues = form.getValues()
        handleFormSubmit(currentValues)
      } else {
        return
      }
    }
    router.push('/candidate-onboarding/experience')
  }

  const handlePrevious = () => {
    router.push('/candidate-onboarding/personal')
  }

  const formatDisplayDate = (dateStr: string | null): string => {
    if (!dateStr) return ''
    const date = parseDateString(dateStr)
    return date ? format(date, 'MMM yyyy') : dateStr
  }

  const displayDateRange = (startDate: string | null, endDate: string | null) => {
    const start = startDate ? formatDisplayDate(startDate) : 'N/A'
    const end = endDate ? formatDisplayDate(endDate) : 'Present'
    return `${start} - ${end}`
  }

  const EducationFormFields = () => (
    <>
      {editingDegree && <input type='hidden' {...form.register('id')} />}
      <FormField
        control={form.control}
        name='degree'
        render={({ field }) => (
          <FormItem>
            <FormLabel>Degree / Certificate</FormLabel>
            <FormControl>
              <Input placeholder='B.Sc. Computer Science' {...field} disabled={isSubmittingCombined} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name='institution'
        render={({ field }) => (
          <FormItem>
            <FormLabel>Institution</FormLabel>
            <FormControl>
              <Input placeholder='University Name' {...field} disabled={isSubmittingCombined} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name='location'
        render={({ field }) => (
          <FormItem>
            <FormLabel>Location (Optional)</FormLabel>
            <FormControl>
              <Input placeholder='City, Country' {...field} value={field.value ?? ''} disabled={isSubmittingCombined} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
        <FormField
          control={form.control}
          name='startDate'
          render={({ field }) => (
            <FormItem className='flex flex-col'>
              <FormLabel>Start Date</FormLabel>
              <FormControl>
                <DatePicker
                  selected={parseDateString(field.value)}
                  onSelect={(date: Date | undefined) => {
                    field.onChange(formatDateToYYYYMMDD(date))
                  }}
                  disabled={isSubmittingCombined}
                  placeholder='Select start date'
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name='endDate'
          render={({ field }) => (
            <FormItem className='flex flex-col'>
              <FormLabel>End Date (Optional)</FormLabel>
              <FormControl>
                <DatePicker
                  selected={parseDateString(field.value)}
                  onSelect={(date: Date | undefined) => {
                    field.onChange(formatDateToYYYYMMDD(date))
                  }}
                  disabled={isSubmittingCombined}
                  placeholder='Present (or select end date)'
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
      <FormField
        control={form.control}
        name='description'
        render={({ field }) => (
          <FormItem>
            <FormLabel>Description (Optional)</FormLabel>
            <FormControl>
              <Textarea
                placeholder='Relevant coursework, activities, thesis...'
                className='min-h-[100px]'
                {...field}
                value={field.value ?? ''}
                disabled={isSubmittingCombined}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </>
  )

  return (
    <div className='space-y-6'>
      {degrees.length === 0 && !isFormOpen ? (
        <Card className='border-none bg-transparent' flat>
          <CardHeader>
            <CardTitle>Add Your Education</CardTitle>
            <CardDescription>
              Please provide details about your educational background. You can add more entries later.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleFormSubmit)} className='space-y-4'>
                <EducationFormFields />
                <div className='flex justify-end pt-4'>
                  <Button type='submit' disabled={isSubmittingCombined}>
                    {createStatus === 'executing' && submissionSourceRef.current === 'initial_save_button' && (
                      <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                    )}
                    Save Education
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      ) : (
        <div className='space-y-4'>
          {degrees.map((degree) => (
            <Card key={degree.id} className='overflow-hidden shadow-none' flat>
              <CardHeader className='pb-2'>
                <div className='flex justify-between items-start'>
                  <div>
                    <CardTitle>{degree.degree_name || 'N/A'}</CardTitle>
                    <CardDescription>{degree.institution_name || 'N/A'}</CardDescription>
                  </div>
                  <div className='flex gap-2'>
                    <Button
                      variant='ghost'
                      size='icon'
                      onClick={() => openEditDialog(degree)}
                      disabled={isSubmittingCombined}>
                      <Pencil className='h-4 w-4' />
                      <span className='sr-only'>Edit</span>
                    </Button>
                    <AlertDialog
                      open={educationToDeleteId === degree.id}
                      onOpenChange={(isOpen) => {
                        if (!isOpen && educationToDeleteId === degree.id) {
                          setEducationToDeleteId(null)
                        }
                      }}>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant='outline'
                          className='border-destructive-border bg-destructive-subtle hover:bg-destructive-subtle/80 active:bg-destructive-subtle/90'
                          size='icon'
                          onClick={() => setEducationToDeleteId(degree.id)}
                          disabled={isSubmittingCombined}>
                          <Trash2 className='size-4 stroke-destructive-vibrant' />
                          <span className='sr-only'>Delete</span>
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete this education entry.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel
                            onClick={() => setEducationToDeleteId(null)}
                            disabled={deleteStatus === 'executing'}>
                            Cancel
                          </AlertDialogCancel>
                          <AlertDialogAction
                            onClick={confirmDeleteDegree}
                            disabled={deleteStatus === 'executing'}
                            className='bg-destructive text-destructive-foreground hover:bg-destructive/90'>
                            {deleteStatus === 'executing' ? <Loader2 className='mr-2 h-4 w-4 animate-spin' /> : null}
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </CardHeader>
              <CardContent className='pb-2'>
                <div className='flex flex-wrap gap-4 text-sm text-muted-foreground'>
                  {degree.location && (
                    <div className='flex items-center gap-1'>
                      <MapPin className='h-3.5 w-3.5' />
                      <span>{degree.location}</span>
                    </div>
                  )}
                  <div className='flex items-center gap-1'>
                    <CalendarIcon className='h-3.5 w-3.5' />
                    <span>{displayDateRange(degree.start_date, degree.end_date)}</span>
                  </div>
                </div>
                {degree.description && <p className='mt-2 text-sm'>{displayDescription(degree.description)}</p>}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <div className='flex justify-between items-center pt-4'>
        <Button variant='outline' onClick={handlePrevious} disabled={isSubmittingCombined}>
          Previous
        </Button>
        <div className='flex items-center space-x-2'>
          {degrees.length > 0 && (
            <Button variant='outline' onClick={openAddDialog} disabled={isSubmittingCombined}>
              <Plus className='h-4 w-4 mr-2' /> Add Another
            </Button>
          )}
          <Button onClick={handleContinue} disabled={isSubmittingCombined}>
            {createStatus === 'executing' && submissionSourceRef.current === 'continue_implicit_save' && (
              <Loader2 className='mr-2 h-4 w-4 animate-spin' />
            )}
            Continue
          </Button>
        </div>
      </div>

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className='sm:max-w-[550px]'>
          <DialogHeader>
            <DialogTitle>{editingDegree ? 'Edit Education' : 'Add Education'}</DialogTitle>
            <DialogDescription>
              {editingDegree ? 'Update the details for this entry.' : 'Add details about your degree or certification.'}
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleFormSubmit)} className='space-y-4 py-4'>
              <EducationFormFields />
              <DialogFooter className='pt-4'>
                <Button type='button' variant='outline' onClick={closeDialog} disabled={isSubmittingCombined}>
                  Cancel
                </Button>
                <Button type='submit' disabled={isSubmittingCombined}>
                  {isSubmittingCombined && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
                  {editingDegree ? 'Update Education' : 'Add Education'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
