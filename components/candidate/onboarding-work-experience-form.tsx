'use client'

import { createCandidateWorkExperienceAction } from '@/actions/create-candidate-work-experience-action'
import { deleteCandidateWorkExperienceAction } from '@/actions/delete-candidate-work-experience-action'
import {
  candidateWorkExperienceFormSchema,
  createCandidateWorkExperienceSchema,
  updateCandidateWorkExperienceSchema,
} from '@/actions/schema'
import { updateCandidateWorkExperienceAction } from '@/actions/update-candidate-work-experience-action'
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
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import DatePicker from '@/components/ui/date-picker'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  displayDateRange,
  formatDateToYYYYMMDD,
  parseDateString,
} from '@/lib/dates'
import type { CandidateWorkExperience } from '@/supabase/queries'
import type { Json } from '@/supabase/types/db'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  Calendar as CalendarIcon,
  Loader2,
  MapPin,
  Pencil,
  Plus,
  Trash2,
} from 'lucide-react'
import { useAction } from 'next-safe-action/hooks'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import type { z } from 'zod'

type WorkExperienceFormValues = z.infer<
  typeof candidateWorkExperienceFormSchema
>

type CandidateWorkExperienceInternal = CandidateWorkExperience & {
  is_current?: boolean | null
}

interface OnboardingWorkExperienceFormProps {
  initialData: CandidateWorkExperience[]
}

export function OnboardingWorkExperienceForm({
  initialData,
}: OnboardingWorkExperienceFormProps) {
  const router = useRouter()
  const [experiences, setExperiences] = useState<
    CandidateWorkExperienceInternal[]
  >(
    initialData
      ? initialData.map((exp) => exp as CandidateWorkExperienceInternal)
      : []
  )
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingExperience, setEditingExperience] =
    useState<CandidateWorkExperienceInternal | null>(null)
  const [experienceToDeleteId, setExperienceToDeleteId] = useState<
    string | null
  >(null)
  const submissionSourceRef = useRef<
    'initial_save_button' | 'continue_implicit_save' | null
  >(null)

  const form = useForm<WorkExperienceFormValues>({
    resolver: zodResolver(candidateWorkExperienceFormSchema),
    defaultValues: {
      jobTitle: '',
      companyName: '',
      location: '',
      startDate: '',
      endDate: '',
      isCurrent: false,
      description: '',
    },
  })

  const isCurrentValue = useWatch({
    control: form.control,
    name: 'isCurrent',
  })

  const resetForm = useCallback(
    (expData: CandidateWorkExperienceInternal | null = null) => {
      form.reset({
        id: expData?.id ?? undefined,
        jobTitle: expData?.job_title ?? '',
        companyName: expData?.company_name ?? '',
        location: expData?.location ?? '',
        startDate: expData?.start_date ?? '',
        endDate: expData?.is_current ? 'Present' : expData?.end_date ?? '',
        isCurrent: expData?.is_current ?? false,
        description: displayDescription(expData?.description),
      })
      form.clearErrors()
    },
    [form]
  )

  useEffect(() => {
    if (initialData.length === 0 && !editingExperience) {
      resetForm(null)
    }
  }, [initialData, editingExperience, resetForm])

  useEffect(() => {
    if (isCurrentValue) {
      form.setValue('endDate', 'Present', { shouldValidate: true })
    } else {
      if (form.getValues('endDate')?.toUpperCase() === 'PRESENT') {
        form.setValue('endDate', '', { shouldValidate: true })
      }
    }
  }, [isCurrentValue, form])

  const { execute: createExperience, status: createStatus } = useAction(
    createCandidateWorkExperienceAction,
    {
      onSuccess: (hookProvidedResult) => {
        if (
          hookProvidedResult &&
          hookProvidedResult.data &&
          hookProvidedResult.data.success === true &&
          hookProvidedResult.data.data
        ) {
          const newExperienceRecord = hookProvidedResult.data
            .data as CandidateWorkExperienceInternal

          if (
            typeof newExperienceRecord === 'object' &&
            newExperienceRecord !== null &&
            'id' in newExperienceRecord
          ) {
            setExperiences((prev) => [...prev, newExperienceRecord])
            if (isFormOpen) {
              closeDialog()
            } else {
              resetForm(null)
            }
          } else {
            console.error(
              'Create Experience: Action reported success, but its `data.data` field (the actual record) was malformed or missing expected properties.',
              newExperienceRecord
            )
          }
        } else {
          console.error(
            'Create Experience: Action reported failure or returned an invalid structure from the server action.',
            hookProvidedResult
          )
        }
      },
      onError: (response) => {
        const error = response.error
        console.error('Create Experience Hook Error:', response)
        if (error?.serverError)
          console.error('Server Error:', error.serverError)
        else if (error?.validationErrors)
          console.error('Validation Errors:', error.validationErrors)
        else console.error('Unknown Error:', response)
      },
      onSettled: () => {
        submissionSourceRef.current = null
      },
    }
  )

  const { execute: updateExperience, status: updateStatus } = useAction(
    updateCandidateWorkExperienceAction,
    {
      onSuccess: (hookProvidedResult) => {
        if (
          typeof hookProvidedResult !== 'object' ||
          hookProvidedResult === null ||
          typeof hookProvidedResult.data !== 'object' ||
          hookProvidedResult.data === null
        ) {
          return
        }
        const serverActionResponse = hookProvidedResult.data
        if (
          serverActionResponse.success === true &&
          serverActionResponse.data
        ) {
          const updatedRecord =
            serverActionResponse.data as CandidateWorkExperienceInternal
          if (
            typeof updatedRecord === 'object' &&
            updatedRecord !== null &&
            'id' in updatedRecord
          ) {
            setExperiences((prev) =>
              prev.map((exp) =>
                exp.id === updatedRecord.id ? updatedRecord : exp
              )
            )
            closeDialog()
          }
        }
      },
      onError: (hookErrorPayload) => {
        console.error(
          'Update Action: onError - Hook-level error:',
          hookErrorPayload.error
        )
      },
    }
  )

  const { execute: deleteExperience, status: deleteStatus } = useAction(
    deleteCandidateWorkExperienceAction,
    {
      onSuccess: (result: {
        data?:
          | { success: boolean; error?: { code: string; message: string } }
          | undefined
        input: { id: string }
      }) => {
        let idToDelete: string | null = null
        if (result.input && typeof result.input.id === 'string') {
          idToDelete = result.input.id
        }
        const serverResponse = result.data
        if (serverResponse && serverResponse.success === true) {
          if (idToDelete) {
            setExperiences((prev) =>
              prev.filter((exp) => exp.id !== idToDelete)
            )
          }
        }
        setExperienceToDeleteId(null)
      },
      onError: (hookErrorPayload) => {
        console.error(
          'Delete Action: onError - Hook-level error:',
          hookErrorPayload.error
        )
        setExperienceToDeleteId(null)
      },
    }
  )

  const isSubmittingCombined =
    createStatus === 'executing' ||
    updateStatus === 'executing' ||
    deleteStatus === 'executing'

  const displayDescription = (description: Json | null | undefined): string => {
    if (!description) return ''
    if (typeof description === 'string') return description
    if (
      typeof description === 'object' &&
      description !== null &&
      !Array.isArray(description)
    ) {
      if ('text' in description && typeof description.text === 'string') {
        return description.text
      }
      try {
        return JSON.stringify(description)
      } catch {
        return 'Complex object'
      }
    }
    return String(description)
  }

  const openAddDialog = () => {
    setEditingExperience(null)
    resetForm(null)
    setIsFormOpen(true)
  }

  const openEditDialog = (experience: CandidateWorkExperienceInternal) => {
    setEditingExperience(experience)
    resetForm(experience)
    setIsFormOpen(true)
  }

  const closeDialog = () => {
    setIsFormOpen(false)
    setEditingExperience(null)
  }

  const handleFormSubmit = (values: WorkExperienceFormValues) => {
    const payloadForAction: {
      job_title: string
      company_name: string
      location: string | null
      start_date: string
      end_date: string | null
      is_current: boolean
      description: Json | null
      id?: string
    } = {
      job_title: values.jobTitle ?? '',
      company_name: values.companyName ?? '',
      location: values.location || null,
      start_date: values.startDate ?? '',
      end_date:
        values.isCurrent || values.endDate?.toUpperCase() === 'PRESENT'
          ? null
          : values.endDate || null,
      is_current: values.isCurrent ?? false,
      description: values.description || null,
    }

    if (
      typeof payloadForAction.description === 'string' &&
      payloadForAction.description.trim() !== ''
    ) {
      try {
        JSON.parse(payloadForAction.description)
      } catch {
        payloadForAction.description = {
          text: payloadForAction.description,
        } as Json
      }
    } else if (payloadForAction.description === '') {
      payloadForAction.description = null
    }

    if (editingExperience && values.id) {
      const updatePayload = { ...payloadForAction, id: values.id }
      const validation =
        updateCandidateWorkExperienceSchema.safeParse(updatePayload)
      if (!validation.success) {
        validation.error.issues.forEach((issue) => {
          form.setError(issue.path[0] as keyof WorkExperienceFormValues, {
            message: issue.message,
          })
        })
        return
      }
      updateExperience(validation.data)
    } else {
      const validation =
        createCandidateWorkExperienceSchema.safeParse(payloadForAction)
      if (!validation.success) {
        validation.error.issues.forEach((issue) => {
          form.setError(issue.path[0] as keyof WorkExperienceFormValues, {
            message: issue.message,
          })
        })
        return
      }
      if (!isFormOpen && !editingExperience) {
        submissionSourceRef.current = 'initial_save_button'
      }
      createExperience(validation.data)
    }
  }

  const confirmDeleteExperience = () => {
    if (experienceToDeleteId) {
      deleteExperience({ id: experienceToDeleteId })
    }
    setExperienceToDeleteId(null)
  }

  const handleContinue = async () => {
    if (experiences.length === 0 && !isFormOpen) {
      const isValid = await form.trigger()
      if (isValid) {
        const currentValues = form.getValues()
        if (currentValues.jobTitle && currentValues.companyName) {
          submissionSourceRef.current = 'continue_implicit_save'
          handleFormSubmit(currentValues)
        } else {
          router.push('/candidate-onboarding/files')
        }
      } else {
        return
      }
    } else {
      router.push('/candidate-onboarding/files')
    }
  }

  const handlePrevious = () => {
    router.push('/candidate-onboarding/education')
  }

  const ExperienceFormFields = () => (
    <>
      {editingExperience && <input type='hidden' {...form.register('id')} />}
      <FormField
        control={form.control}
        name='jobTitle'
        render={({ field }) => (
          <FormItem>
            <FormLabel>Job Title</FormLabel>
            <FormControl>
              <Input
                placeholder='Software Engineer'
                {...field}
                disabled={isSubmittingCombined}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name='companyName'
        render={({ field }) => (
          <FormItem>
            <FormLabel>Company Name</FormLabel>
            <FormControl>
              <Input
                placeholder='Acme Corp'
                {...field}
                disabled={isSubmittingCombined}
              />
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
              <Input
                placeholder='City, Country'
                {...field}
                value={field.value ?? ''}
                disabled={isSubmittingCombined}
              />
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
              <DatePicker
                selected={parseDateString(field.value)}
                onSelect={(date) => field.onChange(formatDateToYYYYMMDD(date))}
                placeholder='Select start date'
                disabled={isSubmittingCombined}
              />
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
              <DatePicker
                selected={
                  field.value?.toUpperCase() === 'PRESENT'
                    ? undefined
                    : parseDateString(field.value)
                }
                onSelect={(date) => field.onChange(formatDateToYYYYMMDD(date))}
                placeholder={isCurrentValue ? 'Present' : 'Select end date'}
                disabled={isSubmittingCombined || isCurrentValue}
              />
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
      <FormField
        control={form.control}
        name='isCurrent'
        render={({ field }) => (
          <FormItem className='flex flex-row items-center space-x-2 space-y-0 pt-2'>
            <FormControl>
              <Checkbox
                checked={field.value}
                onCheckedChange={field.onChange}
                disabled={isSubmittingCombined}
                id='isCurrentExperience'
              />
            </FormControl>
            <FormLabel
              htmlFor='isCurrentExperience'
              className='font-normal text-sm'>
              I am currently working in this role
            </FormLabel>
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name='description'
        render={({ field }) => (
          <FormItem>
            <FormLabel>Description (Optional)</FormLabel>
            <FormControl>
              <Textarea
                placeholder='Key responsibilities and achievements...'
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
      {experiences.length === 0 && !isFormOpen ? (
        <Card className='border-none bg-transparent' flat>
          <CardHeader>
            <CardTitle>Add Your Work Experience</CardTitle>
            <CardDescription>
              Please provide details about your work experience. You can add
              more entries later.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(handleFormSubmit)}
                className='space-y-4'>
                <ExperienceFormFields />
                <div className='flex justify-end pt-4'>
                  <Button type='submit' disabled={isSubmittingCombined}>
                    {createStatus === 'executing' &&
                      submissionSourceRef.current === 'initial_save_button' && (
                        <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                      )}
                    Save Experience
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      ) : (
        <div className='space-y-4'>
          {experiences.map((exp) => (
            <Card key={exp.id} className='overflow-hidden shadow-none' flat>
              <CardHeader className='pb-2'>
                <div className='flex justify-between items-start'>
                  <div>
                    <CardTitle>{exp.job_title}</CardTitle>
                    <CardDescription>{exp.company_name}</CardDescription>
                  </div>
                  <div className='flex gap-2'>
                    <Button
                      variant='ghost'
                      size='icon'
                      onClick={() => openEditDialog(exp)}
                      disabled={isSubmittingCombined}>
                      <Pencil className='h-4 w-4' />
                    </Button>
                    <AlertDialog
                      open={experienceToDeleteId === exp.id}
                      onOpenChange={(isOpen) => {
                        if (!isOpen && experienceToDeleteId === exp.id) {
                          setExperienceToDeleteId(null)
                        }
                      }}>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant='outline'
                          className='border-destructive-border bg-destructive-subtle hover:bg-destructive-subtle/80 active:bg-destructive-subtle/90'
                          size='icon'
                          onClick={() => setExperienceToDeleteId(exp.id)}
                          disabled={isSubmittingCombined}>
                          <Trash2 className='size-4 stroke-destructive-vibrant' />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>
                            Are you absolutely sure?
                          </AlertDialogTitle>
                          <AlertDialogDescription>
                            This action cannot be undone. This will permanently
                            delete this work experience entry.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel
                            onClick={() => setExperienceToDeleteId(null)}
                            disabled={deleteStatus === 'executing'}>
                            Cancel
                          </AlertDialogCancel>
                          <AlertDialogAction
                            onClick={confirmDeleteExperience}
                            disabled={deleteStatus === 'executing'}
                            className='bg-destructive text-destructive-foreground hover:bg-destructive/90'>
                            {deleteStatus === 'executing' ? (
                              <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                            ) : null}
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
                  {exp.location && (
                    <div className='flex items-center gap-1'>
                      <MapPin className='h-3.5 w-3.5' />
                      <span>{exp.location}</span>
                    </div>
                  )}
                  <div className='flex items-center gap-1'>
                    <CalendarIcon className='h-3.5 w-3.5' />
                    <span>
                      {displayDateRange(
                        exp.start_date,
                        exp.end_date,
                        exp.is_current
                      )}
                    </span>
                  </div>
                </div>
                {exp.description && (
                  <p className='mt-2 text-sm'>
                    {displayDescription(exp.description)}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <div className='flex justify-between items-center pt-4'>
        <Button
          variant='outline'
          onClick={handlePrevious}
          disabled={isSubmittingCombined}>
          Previous
        </Button>
        <div className='flex items-center space-x-2'>
          {experiences.length > 0 && (
            <Button
              variant='outline'
              onClick={openAddDialog}
              disabled={isSubmittingCombined}>
              <Plus className='h-4 w-4 mr-2' /> Add Another
            </Button>
          )}
          <Button onClick={handleContinue} disabled={isSubmittingCombined}>
            {createStatus === 'executing' &&
              submissionSourceRef.current === 'continue_implicit_save' && (
                <Loader2 className='mr-2 h-4 w-4 animate-spin' />
              )}
            Continue
          </Button>
        </div>
      </div>

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className='sm:max-w-[550px]'>
          <DialogHeader>
            <DialogTitle>
              {editingExperience ? 'Edit Experience' : 'Add Experience'}
            </DialogTitle>
            <DialogDescription>
              {editingExperience
                ? 'Update the details for this role.'
                : 'Add a new role to your professional history.'}
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(handleFormSubmit)}
              className='space-y-4 py-4'>
              <ExperienceFormFields />
              <DialogFooter className='pt-4'>
                <Button
                  type='button'
                  variant='outline'
                  onClick={closeDialog}
                  disabled={isSubmittingCombined}>
                  Cancel
                </Button>
                <Button type='submit' disabled={isSubmittingCombined}>
                  {isSubmittingCombined && (
                    <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                  )}
                  {editingExperience ? 'Update Experience' : 'Add Experience'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
