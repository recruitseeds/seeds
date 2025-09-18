'use client'
import { Button } from './ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from './ui/sheet'
import { useTRPC } from '@/trpc/client'
import { useQuery } from '@tanstack/react-query'
import type { Editor } from '@tiptap/react'
import { SquarePen } from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

const getRoleDisplayName = (role: string): string => {
  const roleMap: Record<string, string> = {
    admin: 'Administrator',
    recruiter: 'Recruiter',
    hiring_manager: 'Hiring Manager',
    member: 'Team Member',
  }
  return roleMap[role] || role
}

const initialFormData = {
  jobTitle: '',
  jobType: '',
  salaryMin: '',
  salaryMax: '',
  salaryType: '',
  hiringManager: '',
  department: '',
  experienceLevel: '',
}

interface JobDetailsFormProps {
  formData: typeof initialFormData
  setFormData: (data: typeof initialFormData) => void
  hiringManagers: Array<{ id: string; user_id: string; role: string }>
}

function JobDetailsForm({ formData, setFormData, hiringManagers }: JobDetailsFormProps) {
  return (
    <div className='space-y-4 px-1'>
      <div className='space-y-2'>
        <Label htmlFor='job-title'>Job Title *</Label>
        <Input
          id='job-title'
          placeholder='e.g. Senior Software Engineer'
          value={formData.jobTitle}
          onChange={(e) => setFormData({ ...formData, jobTitle: e.target.value })}
          required
        />
      </div>
      <div className='space-y-2'>
        <Label>Job Type *</Label>
        <Select value={formData.jobType} onValueChange={(value) => setFormData({ ...formData, jobType: value })}>
          <SelectTrigger>
            <SelectValue placeholder='Select job type' />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectItem value='full_time'>Full-time</SelectItem>
              <SelectItem value='part_time'>Part-time</SelectItem>
              <SelectItem value='contract'>Contract</SelectItem>
              <SelectItem value='internship'>Internship</SelectItem>
              <SelectItem value='temporary'>Temporary</SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>
      <div className='space-y-2'>
        <Label>Salary Range</Label>
        <div className='flex gap-2'>
          <Input
            type='number'
            min={0}
            placeholder='Min'
            value={formData.salaryMin}
            onChange={(e) => setFormData({ ...formData, salaryMin: e.target.value })}
          />
          <Input
            type='number'
            placeholder='Max'
            value={formData.salaryMax}
            onChange={(e) => setFormData({ ...formData, salaryMax: e.target.value })}
          />
        </div>
        <Select value={formData.salaryType} onValueChange={(value) => setFormData({ ...formData, salaryType: value })}>
          <SelectTrigger className='w-full'>
            <SelectValue placeholder='Salary Type' />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectItem value='salary'>Annual Salary</SelectItem>
              <SelectItem value='hourly'>Hourly Rate</SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>
      <div className='space-y-2'>
        <Label>Hiring Manager</Label>
        <Select
          value={formData.hiringManager}
          onValueChange={(value) => setFormData({ ...formData, hiringManager: value })}>
          <SelectTrigger>
            <SelectValue placeholder='Select hiring manager' />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              {hiringManagers
                .filter((manager) => manager.role === 'hiring_manager' || manager.role === 'admin')
                .map((manager) => (
                  <SelectItem key={manager.id} value={manager.id}>
                    User ID: {manager.user_id.slice(0, 8)}... ({getRoleDisplayName(manager.role)})
                  </SelectItem>
                ))}
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>
      <div className='space-y-2'>
        <Label>Department</Label>
        <Select value={formData.department} onValueChange={(value) => setFormData({ ...formData, department: value })}>
          <SelectTrigger>
            <SelectValue placeholder='Select department' />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectItem value='engineering'>Engineering</SelectItem>
              <SelectItem value='product'>Product</SelectItem>
              <SelectItem value='sales'>Sales</SelectItem>
              <SelectItem value='marketing'>Marketing</SelectItem>
              <SelectItem value='customer-support'>Customer Support</SelectItem>
              <SelectItem value='hr'>HR</SelectItem>
              <SelectItem value='finance'>Finance</SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>
      <div className='space-y-2'>
        <Label>Experience Level</Label>
        <Select
          value={formData.experienceLevel}
          onValueChange={(value) => setFormData({ ...formData, experienceLevel: value })}>
          <SelectTrigger>
            <SelectValue placeholder='Select experience level' />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectItem value='entry'>Entry Level</SelectItem>
              <SelectItem value='mid'>Mid-Level</SelectItem>
              <SelectItem value='senior'>Senior</SelectItem>
              <SelectItem value='lead'>Lead</SelectItem>
              <SelectItem value='executive'>Executive</SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}

interface JobData {
  id?: string
  title: string
  job_type: 'full_time' | 'part_time' | 'contract' | 'internship' | 'temporary'
  department?: string | null
  experience_level?: string | null
  hiring_manager_id?: string | null
  salary_min?: number | null
  salary_max?: number | null
  salary_type?: string | null
}

interface JobProfileSheetProps {
  editor?: Editor
  onJobDataChange?: (data: JobData | null) => void
  jobData?: JobData | null
  isEditing?: boolean
}

export function JobProfileSheet({ editor, onJobDataChange, jobData, isEditing = false }: JobProfileSheetProps) {
  const [formData, setFormData] = useState(initialFormData)
  const [open, setOpen] = useState(false)
  const [showDiscardDialog, setShowDiscardDialog] = useState(false)
  const [isInitialized, setIsInitialized] = useState(false)
  const trpcClient = useTRPC()
  const { data: hiringManagers = [] } = useQuery(trpcClient.organization.getOrganizationUsers.queryOptions())

  
  useEffect(() => {
    if (jobData && !isInitialized) {
      const transformedFormData = {
        jobTitle: jobData.title || '',
        jobType: jobData.job_type || '',
        salaryMin: jobData.salary_min?.toString() || '',
        salaryMax: jobData.salary_max?.toString() || '',
        salaryType: jobData.salary_type || '',
        hiringManager: jobData.hiring_manager_id || '',
        department: jobData.department || '',
        experienceLevel: jobData.experience_level || '',
      }
      setFormData(transformedFormData)
      setIsInitialized(true)
    }
  }, [jobData, isInitialized])

  
  useEffect(() => {
    if (!jobData) {
      setIsInitialized(false)
      setFormData(initialFormData)
    }
  }, [jobData])

  const handleSave = () => {
    if (!formData.jobTitle.trim()) {
      toast.error('Job title is required')
      return
    }
    if (!formData.jobType) {
      toast.error('Job type is required')
      return
    }
    const jobData = {
      title: formData.jobTitle,
      job_type: formData.jobType as 'full_time' | 'part_time' | 'contract' | 'internship' | 'temporary',
      department: formData.department || null,
      experience_level: (formData.experienceLevel as 'entry' | 'mid' | 'senior' | 'lead' | 'executive') || null,
      hiring_manager_id: formData.hiringManager || null,
      salary_min: formData.salaryMin ? Number.parseInt(formData.salaryMin, 10) : null,
      salary_max: formData.salaryMax ? Number.parseInt(formData.salaryMax, 10) : null,
      salary_type: (formData.salaryType as 'salary' | 'hourly') || null,
    }
    onJobDataChange?.(jobData)
    setOpen(false)
    toast.success('Job details saved locally')
  }

  const handleDiscard = () => {
    setShowDiscardDialog(true)
  }

  const handleClearAll = () => {
    editor?.commands.clearContent()
    setFormData(initialFormData)
    onJobDataChange?.(null)
    setOpen(false)
    setShowDiscardDialog(false)
    setIsInitialized(false)
    toast.success('Content cleared')
  }

  const handleSaveLocally = () => {
    handleSave()
    setShowDiscardDialog(false)
  }

  return (
    <>
      <div className='fixed bottom-6 right-6 z-50'>
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant='default' size='lg' className='shadow-lg rounded-full px-6'>
              Complete job profile
              <SquarePen className='size-4' />
            </Button>
          </SheetTrigger>
          <SheetContent side='right' className='sm:max-w-2xl w-full h-[100dvh] overflow-y-auto p-6'>
            <SheetHeader className='mb-4'>
              <SheetTitle>Job Details</SheetTitle>
              <SheetDescription>
                {isEditing ? 'Edit the job posting details.' : 'Enter the required information for this job posting.'}
              </SheetDescription>
            </SheetHeader>
            <JobDetailsForm formData={formData} setFormData={setFormData} hiringManagers={hiringManagers} />
            <SheetFooter className='mt-6 flex flex-col gap-2 p-0 px-1'>
              <Button onClick={handleSave} className='w-full'>
                Save Details
              </Button>
              <Button variant='outline' onClick={handleDiscard} className='w-full'>
                Discard
              </Button>
            </SheetFooter>
          </SheetContent>
        </Sheet>
      </div>
      <Dialog open={showDiscardDialog} onOpenChange={setShowDiscardDialog}>
        <DialogContent className='sm:max-w-[425px]'>
          <DialogHeader>
            <DialogTitle>Discard changes?</DialogTitle>
            <DialogDescription>You have unsaved changes. What would you like to do?</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={handleSaveLocally}>Save Locally</Button>
            <Button onClick={handleClearAll} variant='destructive'>
              Clear All
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
