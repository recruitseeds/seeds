'use client'

import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
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
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { zodResolver } from '@hookform/resolvers/zod'
import { Briefcase, Calendar, MapPin, Pencil, Plus, Trash2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { v4 as uuidv4 } from 'uuid'
import { z } from 'zod'

// Define the work experience entry schema
const workExperienceEntrySchema = z.object({
  id: z.string().optional(),
  title: z
    .string()
    .min(2, { message: 'Job title must be at least 2 characters.' }),
  company: z
    .string()
    .min(2, { message: 'Company name must be at least 2 characters.' }),
  location: z.string().optional(),
  startDate: z.string().min(1, { message: 'Start date is required.' }),
  endDate: z.string().optional(),
  description: z.string().optional(),
})

type WorkExperienceEntryFormValues = z.infer<typeof workExperienceEntrySchema>

export default function WorkExperiencePage() {
  const router = useRouter()
  // TODO: Fetch existing work experience data if resuming
  const [jobs, setJobs] = useState<WorkExperienceEntryFormValues[]>([])
  const [isAddingJob, setIsAddingJob] = useState(false)
  const [editingJob, setEditingJob] =
    useState<WorkExperienceEntryFormValues | null>(null)

  const form = useForm<WorkExperienceEntryFormValues>({
    resolver: zodResolver(workExperienceEntrySchema),
    defaultValues: {
      title: '',
      company: '',
      location: '',
      startDate: '',
      endDate: '',
      description: '',
    },
  })

  const openAddDialog = () => {
    form.reset()
    setEditingJob(null)
    setIsAddingJob(true)
  }

  const openEditDialog = (job: WorkExperienceEntryFormValues) => {
    form.reset(job)
    setEditingJob(job)
    setIsAddingJob(true)
  }

  const closeDialog = () => {
    setIsAddingJob(false)
    setEditingJob(null)
  }

  const onSubmitJob = (values: WorkExperienceEntryFormValues) => {
    if (editingJob) {
      // Update existing job
      setJobs(
        jobs.map((j) => (j.id === editingJob.id ? { ...values, id: j.id } : j))
      )
    } else {
      // Add new job
      setJobs([...jobs, { ...values, id: uuidv4() }])
    }
    closeDialog()
  }

  const deleteJob = (id: string) => {
    setJobs(jobs.filter((j) => j.id !== id))
  }

  // Handle final submission for this step
  const handleContinue = () => {
    // TODO: Implement data saving logic here (e.g., call server action with 'jobs' state)
    console.log('Saving work experience:', jobs)
    router.push('/candidate-onboarding/files') // Navigate to next step
  }

  // Handle skipping this step
  const handleSkip = () => {
    // Optionally save an indicator that this step was skipped
    console.log('Skipping work experience step')
    router.push('/candidate-onboarding/files') // Navigate to next step
  }

  // Handle going back
  const handlePrevious = () => {
    router.push('/candidate-onboarding/education') // Navigate to previous step
  }

  return (
    <div className='space-y-6'>
      {jobs.length > 0 ? (
        <div className='space-y-4'>
          {jobs.map((job) => (
            <Card key={job.id} className='overflow-hidden'>
              <CardHeader className='pb-2'>
                <div className='flex justify-between items-start'>
                  <div>
                    <CardTitle>{job.title}</CardTitle>
                    <CardDescription>{job.company}</CardDescription>
                  </div>
                  <div className='flex gap-2'>
                    <Button
                      variant='ghost'
                      size='icon'
                      onClick={() => openEditDialog(job)}>
                      <Pencil className='h-4 w-4' />
                      <span className='sr-only'>Edit</span>
                    </Button>
                    <Button
                      variant='ghost'
                      size='icon'
                      onClick={() => deleteJob(job.id!)}>
                      <Trash2 className='h-4 w-4' />
                      <span className='sr-only'>Delete</span>
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className='pb-2'>
                <div className='flex flex-wrap gap-4 text-sm text-muted-foreground'>
                  {job.location && (
                    <div className='flex items-center gap-1'>
                      <MapPin className='h-3.5 w-3.5' />
                      <span>{job.location}</span>
                    </div>
                  )}
                  <div className='flex items-center gap-1'>
                    <Calendar className='h-3.5 w-3.5' />
                    <span>
                      {job.startDate} - {job.endDate || 'Present'}
                    </span>
                  </div>
                </div>
                {job.description && (
                  <p className='mt-2 text-sm'>{job.description}</p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className='flex flex-col items-center justify-center p-8 border border-dashed rounded-lg'>
          <Briefcase className='h-12 w-12 text-muted-foreground mb-4' />
          <h4 className='text-lg font-medium mb-2'>No Work Experience Added</h4>
          <p className='text-muted-foreground text-center mb-4'>
            Add your work history to showcase your professional experience to
            employers.
          </p>
          <Button onClick={openAddDialog}>
            <Plus className='h-4 w-4 mr-2' /> Add Work Experience
          </Button>
        </div>
      )}

      <div className='flex justify-between'>
        {/* Previous Button */}
        <Button variant='outline' onClick={handlePrevious}>
          Previous
        </Button>
        <div className='space-x-2'>
          {/* Add Another Button */}
          {jobs.length > 0 && (
            <Button variant='outline' onClick={openAddDialog}>
              <Plus className='h-4 w-4 mr-2' /> Add Another
            </Button>
          )}
          {/* Skip Button */}
          <Button variant='outline' onClick={handleSkip}>
            Fill out later
          </Button>
          {/* Continue Button */}
          <Button onClick={handleContinue}>Continue</Button>
        </div>
      </div>

      {/* Add/Edit Work Experience Dialog */}
      <Dialog open={isAddingJob} onOpenChange={setIsAddingJob}>
        <DialogContent className='sm:max-w-[550px]'>
          <DialogHeader>
            <DialogTitle>
              {editingJob ? 'Edit Work Experience' : 'Add Work Experience'}
            </DialogTitle>
            <DialogDescription>
              Add details about your professional experience and
              responsibilities.
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmitJob)}
              className='space-y-4'>
              <FormField
                control={form.control}
                name='title'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Job Title</FormLabel>
                    <FormControl>
                      <Input placeholder='Software Engineer' {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name='company'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Company</FormLabel>
                    <FormControl>
                      <Input placeholder='Acme Inc.' {...field} />
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
                      <Input placeholder='San Francisco, CA' {...field} />
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
                    <FormItem>
                      <FormLabel>Start Date</FormLabel>
                      <FormControl>
                        <Input type='month' {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name='endDate'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>End Date (Optional)</FormLabel>
                      <FormControl>
                        <Input type='month' {...field} />
                      </FormControl>
                      <FormDescription>
                        Leave blank if currently employed
                      </FormDescription>
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
                        placeholder='Describe your responsibilities, achievements, and skills used...'
                        className='min-h-[100px]'
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button type='button' variant='outline' onClick={closeDialog}>
                  Cancel
                </Button>
                <Button type='submit'>{editingJob ? 'Update' : 'Add'}</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
