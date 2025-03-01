'use client'

import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
} from '@/components/ui/sidebar'
import { Expand } from 'lucide-react'
import { useState } from 'react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'

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
      {/* Job Title */}
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

      {/* Job Type */}
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

      {/* Salary Range */}
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

      {/* Hiring Manager */}
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

      {/* Department */}
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

      {/* Experience Level */}
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

export function RightAppSidebar(props: React.ComponentProps<typeof Sidebar>) {
  const [formData, setFormData] = useState(initialFormData)

  return (
    <Sidebar {...props}>
      <SidebarHeader>
        <SidebarMenu className='flex items-center justify-between'>
          <div className='flex justify-between items-center w-full'>
            <p className='text-sm ml-2 font-bold'>Job Details</p>
            <Dialog>
              <DialogTrigger asChild>
                <Button variant='ghost' size='icon' className='size-6'>
                  <Expand className='size-4' />
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Job Details</DialogTitle>
                </DialogHeader>
                <JobDetailsForm formData={formData} setFormData={setFormData} />
                <DialogFooter>
                  <DialogClose asChild>
                    <Button type='submit'>Save</Button>
                  </DialogClose>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent className='space-y-4 px-1'>
            <JobDetailsForm formData={formData} setFormData={setFormData} />
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  )
}
