'use client'

import { Button } from '@seeds/ui/button'
import { Checkbox } from '@seeds/ui/checkbox'
import { DatePicker } from '@seeds/ui/date-picker'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@seeds/ui/dialog'
import { Input } from '@seeds/ui/input'
import { Label } from '@seeds/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@seeds/ui/select'
import { Textarea } from '@seeds/ui/textarea'
import { parseNextSteps } from '@/lib/next-steps'
import { useTRPC } from '@/trpc/client'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Loader2, Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { ApplicationDialogTimeline } from './application-dialog-timeline'

type Application = {
  id: string
  job_title: string | null
  company_name: string | null
  status: string | null
  application_date: string | null
  next_step_description?: string | null
  next_step_date?: string | null
  next_steps?: Array<{
    id: string
    description: string
    date: string | null
    completed: boolean
  }> | null
  source: 'manual' | 'import' | 'platform' | null
  application_url?: string | null
  contact_person?: string | null
  contact_email?: string | null
  salary_range?: string | null
}

interface EditExperienceDialogProps {
  application: Application
  triggerButton?: React.ReactNode
}

const statusOptions = [
  { value: 'applied', label: 'Applied' },
  { value: 'in-review', label: 'In Review' },
  { value: 'interview', label: 'Interview' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'offer', label: 'Offer' },
]

interface NextStep {
  id: string
  description: string
  date: Date | undefined
  completed?: boolean
}

export function EditExperienceDialog({ application, triggerButton }: EditExperienceDialogProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const trpc = useTRPC()
  const queryClient = useQueryClient()

  const [formData, setFormData] = useState({
    job_title: application.job_title || '',
    company_name: application.company_name || '',
    status: application.status || 'applied',
    application_date: application.application_date ? new Date(application.application_date) : undefined,
    application_url: application.application_url || '',
    contact_person: application.contact_person || '',
    contact_email: application.contact_email || '',
    salary_range: application.salary_range || '',
    notes: '',
  })

  const [nextSteps, setNextSteps] = useState<NextStep[]>(() => {
    const parsedSteps = parseNextSteps(application.next_steps ?? null)

    if (parsedSteps && parsedSteps.length > 0) {
      return parsedSteps.map((step) => ({
        id: step.id,
        description: step.description,
        date: step.date ? new Date(step.date) : undefined,
        completed: step.completed,
      }))
    }

    if (application.next_step_description && application.next_step_date) {
      return [
        {
          id: '1',
          description: application.next_step_description,
          date: new Date(application.next_step_date),
          completed: false,
        },
      ]
    }

    return [
      {
        id: '1',
        description: '',
        date: undefined,
        completed: false,
      },
    ]
  })

  const updateApplicationMutation = useMutation(
    trpc.candidate.updateApplication.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries(trpc.candidate.listApplications.queryFilter())
        handleOpenChange(false)
      },
      onError: (error) => {
        console.error('Update failed:', error.message)
      },
    })
  )

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open)
    if (!open) {
      setIsEditing(false)
    }
  }

  const handleSaveChanges = () => {
    const updateData: {
      id: string
      job_title: string
      company_name: string
      status: 'applied' | 'in-review' | 'interview' | 'rejected' | 'offer'
      application_date?: string
      application_url: string | null
      contact_person: string | null
      contact_email: string | null
      salary_range: string | null
      next_steps?: Array<{
        id: string
        description: string
        date: string | null
        completed: boolean
      }> | null
      next_step_description?: string | null
      next_step_date?: string | null
    } = {
      id: application.id,
      job_title: formData.job_title,
      company_name: formData.company_name,
      status: formData.status as 'applied' | 'in-review' | 'interview' | 'rejected' | 'offer',
      application_date: formData.application_date?.toISOString(),
      application_url: formData.application_url || null,
      contact_person: formData.contact_person || null,
      contact_email: formData.contact_email || null,
      salary_range: formData.salary_range || null,
    }

    if (canEditNextSteps) {
      const validNextSteps = nextSteps
        .filter((step) => step.description.trim() !== '')
        .map((step) => ({
          id: step.id,
          description: step.description,
          date: step.date?.toISOString() || null,
          completed: step.completed || false,
        }))

      updateData.next_steps = validNextSteps.length > 0 ? validNextSteps : null

      if (validNextSteps.length > 0) {
        updateData.next_step_description = validNextSteps[0].description
        updateData.next_step_date = validNextSteps[0].date
      } else {
        updateData.next_step_description = null
        updateData.next_step_date = null
      }
    }

    updateApplicationMutation.mutate(updateData)
  }

  const handleInputChange = (field: string, value: string | Date | undefined) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const addNextStep = () => {
    const newStep: NextStep = {
      id: Math.random().toString(36).substr(2, 9),
      description: '',
      date: undefined,
      completed: false,
    }
    setNextSteps((prev) => [...prev, newStep])
  }

  const removeNextStep = (stepId: string) => {
    if (nextSteps.length === 1) {
      setNextSteps((prev) =>
        prev.map((step) =>
          step.id === stepId ? { ...step, description: '', date: undefined, completed: false } : step
        )
      )
    } else {
      setNextSteps((prev) => prev.filter((step) => step.id !== stepId))
    }
  }

  const updateNextStep = (
    stepId: string,
    field: 'description' | 'date' | 'completed',
    value: string | Date | boolean | undefined
  ) => {
    setNextSteps((prev) => prev.map((step) => (step.id === stepId ? { ...step, [field]: value } : step)))
  }

  const canEditNextSteps =
    application.source === 'manual' || application.source === 'import' || application.source === null

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
      <DialogContent className='flex flex-col gap-0 p-0 sm:max-w-2xl [&>button:last-child]:top-3.5'>
        <DialogHeader className='contents space-y-0 text-left'>
          <DialogTitle className='border-b px-6 py-4 text-base'>
            {isEditing ? 'Edit Application' : 'Application Details'}
          </DialogTitle>
        </DialogHeader>
        <DialogDescription className='sr-only'>
          {isEditing
            ? 'Make changes to your application here.'
            : `Details for your application to ${application.job_title || 'N/A'} at ${
                application.company_name || 'N/A'
              }.`}
        </DialogDescription>

        {isEditing ? (
          <div className='overflow-y-auto max-h-[70vh]'>
            <div className='px-6 py-4'>
              <form className='space-y-4' onSubmit={(e) => e.preventDefault()}>
                <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                  <div className='space-y-2'>
                    <Label htmlFor='job_title'>Job Title</Label>
                    <Input
                      id='job_title'
                      value={formData.job_title}
                      onChange={(e) => handleInputChange('job_title', e.target.value)}
                      placeholder='Software Engineer'
                    />
                  </div>
                  <div className='space-y-2'>
                    <Label htmlFor='company_name'>Company Name</Label>
                    <Input
                      id='company_name'
                      value={formData.company_name}
                      onChange={(e) => handleInputChange('company_name', e.target.value)}
                      placeholder='Acme Corp'
                    />
                  </div>
                </div>

                <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                  <div className='space-y-2'>
                    <Label htmlFor='status'>Status</Label>
                    <Select value={formData.status} onValueChange={(value) => handleInputChange('status', value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className='z-50'>
                        {statusOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className='space-y-2'>
                    <Label htmlFor='application_date'>Application Date</Label>
                    <DatePicker
                      selected={formData.application_date}
                      onSelect={(date) => handleInputChange('application_date', date)}
                      placeholder='Select application date'
                      disabled={updateApplicationMutation.isPending}
                    />
                  </div>
                </div>

                <div className='space-y-2'>
                  <Label htmlFor='application_url'>Application URL</Label>
                  <Input
                    id='application_url'
                    value={formData.application_url}
                    onChange={(e) => handleInputChange('application_url', e.target.value)}
                    placeholder='https://company.com/jobs/123'
                  />
                </div>

                <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                  <div className='space-y-2'>
                    <Label htmlFor='contact_person'>Contact Person</Label>
                    <Input
                      id='contact_person'
                      value={formData.contact_person}
                      onChange={(e) => handleInputChange('contact_person', e.target.value)}
                      placeholder='John Doe'
                    />
                  </div>
                  <div className='space-y-2'>
                    <Label htmlFor='contact_email'>Contact Email</Label>
                    <Input
                      id='contact_email'
                      type='email'
                      value={formData.contact_email}
                      onChange={(e) => handleInputChange('contact_email', e.target.value)}
                      placeholder='john@company.com'
                    />
                  </div>
                </div>

                <div className='space-y-2'>
                  <Label htmlFor='salary_range'>Salary Range</Label>
                  <Input
                    id='salary_range'
                    value={formData.salary_range}
                    onChange={(e) => handleInputChange('salary_range', e.target.value)}
                    placeholder='$80k - $120k'
                  />
                </div>

                {canEditNextSteps && (
                  <div className='border-t pt-4'>
                    <div className='flex items-center justify-between mb-3'>
                      <h4 className='font-medium'>Next Steps</h4>
                      <div className='flex gap-2'>
                        <Button
                          type='button'
                          variant='secondary'
                          size='sm'
                          onClick={addNextStep}
                          className='flex items-center gap-1'>
                          <Plus className='h-4 w-4' />
                          Add Step
                        </Button>
                      </div>
                    </div>

                    <div className='space-y-4'>
                      {nextSteps.map((step, index) => (
                        <div key={step.id} className='p-4 border rounded-lg space-y-3'>
                          <div className='flex items-center justify-between'>
                            <h5 className='font-medium text-sm'>Step {index + 1}</h5>
                            <Button
                              type='button'
                              variant='ghost'
                              size='icon'
                              onClick={() => removeNextStep(step.id)}
                              className='text-red-600 hover:text-red-700 hover:bg-red-50'>
                              <Trash2 className='size-4' />
                            </Button>
                          </div>

                          <div className='grid grid-cols-1 md:grid-cols-2 gap-3'>
                            <div className='space-y-2'>
                              <Label htmlFor={`step_description_${step.id}`}>Description</Label>
                              <Input
                                id={`step_description_${step.id}`}
                                value={step.description}
                                onChange={(e) => updateNextStep(step.id, 'description', e.target.value)}
                                placeholder='Phone interview with HR'
                              />
                            </div>
                            <div className='space-y-2'>
                              <Label htmlFor={`step_date_${step.id}`}>Date</Label>
                              <DatePicker
                                selected={step.date}
                                onSelect={(date) => updateNextStep(step.id, 'date', date)}
                                placeholder='Select date'
                                disabled={updateApplicationMutation.isPending}
                              />
                            </div>
                          </div>
                          <div className='flex items-center space-x-2'>
                            <Checkbox
                              id={`step_completed_${step.id}`}
                              checked={step.completed || false}
                              onCheckedChange={(checked) => updateNextStep(step.id, 'completed', checked)}
                            />
                            <Label htmlFor={`step_completed_${step.id}`} className='text-sm'>
                              Mark as completed
                            </Label>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className='space-y-2'>
                  <Label htmlFor='notes'>Notes</Label>
                  <Textarea
                    id='notes'
                    value={formData.notes}
                    onChange={(e) => handleInputChange('notes', e.target.value)}
                    placeholder='Any additional notes about this application...'
                    rows={3}
                  />
                </div>
              </form>
            </div>
          </div>
        ) : (
          <ApplicationDialogTimeline application={application} />
        )}

        <DialogFooter className='border-t px-6 py-4'>
          {isEditing ? (
            <Button
              type='button'
              onClick={handleSaveChanges}
              disabled={updateApplicationMutation.isPending}
              className='flex items-center gap-2'>
              {updateApplicationMutation.isPending && <Loader2 className='h-4 w-4 animate-spin' />}
              Save changes
            </Button>
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
