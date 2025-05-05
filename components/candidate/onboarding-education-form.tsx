'use client'

import { createCandidateEducationAction } from '@/actions/create-candidate-education-action'
import {
  candidateEducationFormSchema,
  createCandidateEducationSchema,
  updateCandidateEducationSchema,
} from '@/actions/schema'
import { updateCandidateEducationAction } from '@/actions/update-candidate-education'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import DatePicker from '@/components/ui/date-picker'
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { CandidateEducation } from '@/supabase/queries'
import type { Json } from '@/supabase/types/db'
import { zodResolver } from '@hookform/resolvers/zod'
import { format, parse } from 'date-fns'
import {
  Calendar as CalendarIcon,
  GraduationCap,
  Loader2,
  MapPin,
  Pencil,
  Plus,
  Trash2,
} from 'lucide-react'
import { useAction } from 'next-safe-action/hooks'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

type EducationFormValues = z.infer<typeof candidateEducationFormSchema>

interface OnboardingEducationFormProps {
  initialData: CandidateEducation[]
}

const parseYearMonth = (
  dateStr: string | null | undefined
): Date | undefined => {
  if (!dateStr) return undefined
  try {
    const date = parse(dateStr, 'yyyy-MM-dd', new Date())
    return isNaN(date.getTime()) ? undefined : date
  } catch {
    return undefined
  }
}

const formatYearMonth = (date: Date | null | undefined): string => {
  if (!date) return ''
  try {
    return format(date, 'yyyy-MM-dd')
  } catch {
    return ''
  }
}

export function OnboardingEducationForm({
  initialData,
}: OnboardingEducationFormProps) {
  const router = useRouter()
  const [degrees, setDegrees] = useState<CandidateEducation[]>(initialData)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingDegree, setEditingDegree] = useState<CandidateEducation | null>(
    null
  )

  const form = useForm<EducationFormValues>({
    resolver: zodResolver(candidateEducationFormSchema),
    defaultValues: {
      degree: '',
      institution: '',
      location: '',
      startDate: '',
      endDate: '',
      description: '',
    },
  })

  const { execute: createEducation, status: createStatus } = useAction(
    createCandidateEducationAction,
    {
      onSuccess: (result) => {
        console.log(
          'Create education success response:',
          JSON.stringify(result)
        )
        const actionResult = result.data

        if (actionResult?.success && actionResult.data) {
          const newEducationRecord = actionResult.data as CandidateEducation
          setDegrees((prev) => [...prev, newEducationRecord])
          closeDialog()
        } else {
          console.error('Create error response:', JSON.stringify(result))
        }
      },
      onError: (error) => {
        console.error('Create education hook error:', JSON.stringify(error))
        const serverErrorMessage = error.error?.serverError
        const validationErrors = error.error?.validationErrors
        if (serverErrorMessage) {
          console.error('Server Error:', serverErrorMessage)
        } else if (validationErrors) {
          console.error('Validation Errors:', validationErrors)
        }
      },
    }
  )

  const { execute: updateEducation, status: updateStatus } = useAction(
    updateCandidateEducationAction,
    {
      onSuccess: (result) => {
        const actionResult = result.data
        if (actionResult?.success && actionResult.data) {
          const updatedRecord = actionResult.data
          setDegrees((prev) =>
            prev.map((d) => (d.id === updatedRecord.id ? updatedRecord : d))
          )
          closeDialog()
        } else {
          console.error('Update error response:', JSON.stringify(result))
        }
      },
      onError: (error) => {
        console.error('Update education hook error:', JSON.stringify(error))
      },
    }
  )

  const isSubmitting =
    createStatus === 'executing' || updateStatus === 'executing'

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
        return ''
      }
    }
    return String(description)
  }

  const resetForm = (degreeData: CandidateEducation | null = null) => {
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
    let descriptionValue: string | { text: string } | null | undefined =
      values.description

    if (
      typeof descriptionValue === 'string' &&
      descriptionValue.trim() !== ''
    ) {
      try {
        JSON.parse(descriptionValue)
      } catch {
        descriptionValue = { text: descriptionValue }
      }
    } else if (descriptionValue === '') {
      descriptionValue = null
    }

    const basePayload = {
      degree_name: values.degree,
      institution_name: values.institution,
      location: values.location || null,
      start_date: values.startDate,
      end_date: values.endDate || null,
      description: descriptionValue,
      achievements: values.achievements || null,
    }

    if (editingDegree && values.id) {
      const updatePayload = {
        ...basePayload,
        id: values.id,
      }

      Object.keys(updatePayload).forEach((key) => {
        if (updatePayload[key as keyof typeof updatePayload] === undefined) {
          delete updatePayload[key as keyof typeof updatePayload]
        }
      })

      const validation = updateCandidateEducationSchema.safeParse(updatePayload)
      if (!validation.success) {
        console.error(
          'Zod Update Validation Errors:',
          validation.error.format()
        )
        validation.error.issues.forEach((issue) => {
          const fieldName =
            issue.path[0] === 'degree_name'
              ? 'degree'
              : issue.path[0] === 'institution_name'
              ? 'institution'
              : issue.path[0] === 'start_date'
              ? 'startDate'
              : issue.path[0] === 'end_date'
              ? 'endDate'
              : (issue.path[0] as keyof EducationFormValues)
          form.setError(fieldName, { message: issue.message })
        })
        return
      }
      updateEducation(validation.data)
    } else {
      const createPayload = { ...basePayload }

      const validation = createCandidateEducationSchema.safeParse(createPayload)
      if (!validation.success) {
        console.error(
          'Zod Create Validation Errors:',
          validation.error.format()
        )
        validation.error.issues.forEach((issue) => {
          const fieldName =
            issue.path[0] === 'degree_name'
              ? 'degree'
              : issue.path[0] === 'institution_name'
              ? 'institution'
              : issue.path[0] === 'start_date'
              ? 'startDate'
              : issue.path[0] === 'end_date'
              ? 'endDate'
              : (issue.path[0] as keyof EducationFormValues)
          form.setError(fieldName, { message: issue.message })
        })
        return
      }
      createEducation(validation.data)
    }
  }

  const handleDeleteDegree = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this entry?')) return
    console.log('Attempting to delete degree ID:', id)
    // Add actual delete logic here using a safe action
  }

  const handleContinue = () => {
    router.push('/candidate-onboarding/experience')
  }

  const handlePrevious = () => {
    router.push('/candidate-onboarding/personal')
  }

  const formatDisplayDate = (dateStr: string | null): string => {
    if (!dateStr) return ''
    const date = parseYearMonth(dateStr)
    return date ? format(date, 'MMM yyyy') : dateStr
  }

  const displayDateRange = (
    startDate: string | null,
    endDate: string | null
  ) => {
    const start = startDate ? formatDisplayDate(startDate) : 'N/A'
    const end = endDate ? formatDisplayDate(endDate) : 'Present'
    return `${start} - ${end}`
  }

  return (
    <div className='space-y-6'>
      {degrees.length > 0 ? (
        <div className='space-y-4'>
          {degrees.map((degree) => (
            <Card key={degree.id} className='overflow-hidden shadow-none' flat>
              <CardHeader className='pb-2'>
                <div className='flex justify-between items-start'>
                  <div>
                    <CardTitle>{degree.degree_name}</CardTitle>
                    <CardDescription>{degree.institution_name}</CardDescription>
                  </div>
                  <div className='flex gap-2'>
                    <Button
                      variant='ghost'
                      size='icon'
                      onClick={() => openEditDialog(degree)}
                      disabled={isSubmitting}>
                      <Pencil className='h-4 w-4' />
                      <span className='sr-only'>Edit</span>
                    </Button>
                    <Button
                      variant='outline'
                      className='border-destructive-border bg-destructive-subtle hover:bg-destructive-subtle/80 active:bg-destructive-subtle/90'
                      size='icon'
                      onClick={() => handleDeleteDegree(degree.id)}
                      disabled={isSubmitting}>
                      <Trash2 className='size-4 stroke-destructive-vibrant' />
                      <span className='sr-only'>Delete</span>
                    </Button>
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
                    <span>
                      {displayDateRange(degree.start_date, degree.end_date)}
                    </span>
                  </div>
                </div>
                {degree.description && (
                  <p className='mt-2 text-sm'>
                    {displayDescription(degree.description)}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className='flex flex-col items-center justify-center p-8 border border-dashed rounded-lg'>
          <GraduationCap className='h-12 w-12 text-muted-foreground mb-4' />
          <h4 className='text-lg font-medium mb-2'>No Education Added</h4>
          <p className='text-muted-foreground text-center mb-4'>
            Add your educational background to start.
          </p>
          <Button onClick={openAddDialog} disabled={isSubmitting}>
            <Plus className='h-4 w-4 mr-2' /> Add Education
          </Button>
        </div>
      )}

      <div className='flex justify-between items-center pt-4'>
        <Button
          variant='outline'
          onClick={handlePrevious}
          disabled={isSubmitting}>
          Previous
        </Button>
        <div className='flex items-center space-x-2'>
          {degrees.length > 0 && (
            <Button
              variant='outline'
              onClick={openAddDialog}
              disabled={isSubmitting}>
              <Plus className='h-4 w-4 mr-2' /> Add Another
            </Button>
          )}
          <Button onClick={handleContinue} disabled={isSubmitting}>
            {isSubmitting ? (
              <Loader2 className='mr-2 h-4 w-4 animate-spin' />
            ) : null}
            Continue
          </Button>
        </div>
      </div>

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className='sm:max-w-[550px]'>
          <DialogHeader>
            <DialogTitle>
              {editingDegree ? 'Edit Education' : 'Add Education'}
            </DialogTitle>
            <DialogDescription>
              {editingDegree
                ? 'Update the details for this entry.'
                : 'Add details about your degree or certification.'}
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(handleFormSubmit)}
              className='space-y-4'>
              {editingDegree && (
                <input type='hidden' {...form.register('id')} />
              )}

              <FormField
                control={form.control}
                name='degree'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Degree / Certificate</FormLabel>
                    <FormControl>
                      <Input
                        placeholder='B.Sc. Computer Science'
                        {...field}
                        disabled={isSubmitting}
                      />
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
                      <Input
                        placeholder='University Name'
                        {...field}
                        disabled={isSubmitting}
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
                        disabled={isSubmitting}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className='grid grid-cols-2 gap-4'>
                <FormField
                  control={form.control}
                  name='startDate'
                  render={({ field }) => (
                    <FormItem className='flex flex-col'>
                      <FormLabel>Start Date</FormLabel>
                      <FormControl>
                        <DatePicker
                          selected={parseYearMonth(field.value)}
                          onSelect={(date: Date | undefined) =>
                            field.onChange(formatYearMonth(date))
                          }
                          disabled={isSubmitting}
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
                          selected={parseYearMonth(field.value)}
                          onSelect={(date: Date | undefined) =>
                            field.onChange(formatYearMonth(date))
                          }
                          disabled={isSubmitting}
                          placeholder='Select end date'
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
                        disabled={isSubmitting}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className='flex justify-end gap-2'>
                <Button
                  type='button'
                  variant='outline'
                  onClick={closeDialog}
                  disabled={isSubmitting}>
                  Cancel
                </Button>
                <Button type='submit' disabled={isSubmitting}>
                  {isSubmitting && (
                    <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                  )}
                  {editingDegree ? 'Update Education' : 'Add Education'}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
