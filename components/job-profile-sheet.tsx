'use client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { SquarePen } from 'lucide-react'
import { useState } from 'react'

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

function JobDetailsForm({ formData, setFormData }) {
  return (
    <div className='space-y-4 px-1'>
      <div className='space-y-2'>
        <Label htmlFor='job-title'>Job Title</Label>
        <Input
          id='job-title'
          placeholder='e.g. Senior Software Engineer'
          value={formData.jobTitle}
          onChange={(e) =>
            setFormData({ ...formData, jobTitle: e.target.value })
          }
        />
      </div>
      <div className='space-y-2'>
        <Label>Job Type</Label>
        <Select
          value={formData.jobType}
          onValueChange={(value) =>
            setFormData({ ...formData, jobType: value })
          }>
          <SelectTrigger>
            <SelectValue placeholder='Select job type' />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectItem value='full-time'>Full-time</SelectItem>
              <SelectItem value='part-time'>Part-time</SelectItem>
              <SelectItem value='contract'>Contract</SelectItem>
              <SelectItem value='freelance'>Freelance</SelectItem>
              <SelectItem value='internship'>Internship</SelectItem>
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
            onChange={(e) =>
              setFormData({ ...formData, salaryMin: e.target.value })
            }
          />
          <Input
            type='number'
            placeholder='Max'
            value={formData.salaryMax}
            onChange={(e) =>
              setFormData({ ...formData, salaryMax: e.target.value })
            }
          />
        </div>
        <Select
          value={formData.salaryType}
          onValueChange={(value) =>
            setFormData({ ...formData, salaryType: value })
          }>
          <SelectTrigger className='w-full'>
            <SelectValue placeholder='Salary Type' />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectItem value='annual'>Annual</SelectItem>
              <SelectItem value='hourly'>Hourly</SelectItem>
              <SelectItem value='monthly'>Monthly</SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>
      <div className='space-y-2'>
        <Label>Hiring Manager</Label>
        <Select
          value={formData.hiringManager}
          onValueChange={(value) =>
            setFormData({ ...formData, hiringManager: value })
          }>
          <SelectTrigger>
            <SelectValue placeholder='Select hiring manager' />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectItem value='john-doe'>John Doe</SelectItem>
              <SelectItem value='jane-smith'>Jane Smith</SelectItem>
              <SelectItem value='alex-johnson'>Alex Johnson</SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>
      <div className='space-y-2'>
        <Label>Department</Label>
        <Select
          value={formData.department}
          onValueChange={(value) =>
            setFormData({ ...formData, department: value })
          }>
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
          onValueChange={(value) =>
            setFormData({ ...formData, experienceLevel: value })
          }>
          <SelectTrigger>
            <SelectValue placeholder='Select experience level' />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectItem value='entry'>Entry Level</SelectItem>
              <SelectItem value='mid'>Mid-Level</SelectItem>
              <SelectItem value='senior'>Senior</SelectItem>
              <SelectItem value='executive'>Executive</SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}

export function JobProfileSheet() {
  const [formData, setFormData] = useState(initialFormData)
  const [open, setOpen] = useState(false)

  const handleSave = () => {
    console.log('Saving form data:', formData)
    setOpen(false)
  }

  return (
    <div className='fixed bottom-6 right-6 z-50'>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button
            variant='default'
            size='lg'
            className='shadow-lg rounded-full px-6'>
            Complete job profile
            <SquarePen className='size-4' />
          </Button>
        </SheetTrigger>
        <SheetContent
          side='right'
          className='sm:max-w-2xl w-full h-[100dvh] overflow-y-auto p-6'>
          <SheetHeader className='mb-4'>
            <SheetTitle>Job Details</SheetTitle>
            <SheetDescription>
              Enter the required information for this job posting.
            </SheetDescription>
          </SheetHeader>
          <JobDetailsForm formData={formData} setFormData={setFormData} />
          <SheetFooter className='mt-6 flex flex-col gap-2 p-0 px-1'>
            <Button onClick={handleSave} className='w-full'>
              Save
            </Button>
            <SheetClose asChild>
              <Button variant='outline' className='w-full'>
                Cancel
              </Button>
            </SheetClose>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  )
}
