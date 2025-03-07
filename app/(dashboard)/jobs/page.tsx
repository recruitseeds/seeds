'use client'

import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Briefcase, MapPin, Users } from 'lucide-react'
import { useState } from 'react'

// Mock data
const departments = [
  'Engineering',
  'Product',
  'Design',
  'Marketing',
  'Sales',
  'Customer Success',
]

const positionTypes = ['Full-time', 'Part-time', 'Contract', 'Internship']

const jobs = [
  {
    id: 1,
    title: 'Senior Frontend Engineer',
    department: 'Engineering',
    type: 'Full-time',
    location: 'Remote',
    description:
      "We're looking for a Senior Frontend Engineer to join our team...",
  },
  {
    id: 2,
    title: 'Product Manager',
    department: 'Product',
    type: 'Full-time',
    location: 'New York, NY',
    description:
      'Join our product team to help shape the future of our platform...',
  },
  {
    id: 3,
    title: 'UI/UX Designer',
    department: 'Design',
    type: 'Contract',
    location: 'San Francisco, CA',
    description: 'Help us create beautiful and intuitive user experiences...',
  },
  {
    id: 4,
    title: 'Marketing Manager',
    department: 'Marketing',
    type: 'Full-time',
    location: 'Remote',
    description: 'Lead our marketing initiatives and drive growth...',
  },
  {
    id: 5,
    title: 'Sales Development Representative',
    department: 'Sales',
    type: 'Full-time',
    location: 'London, UK',
    description: 'Join our sales team to help expand our market presence...',
  },
]

export default function Page() {
  const [selectedDepartment, setSelectedDepartment] = useState<string | null>(
    null
  )
  const [selectedType, setSelectedType] = useState<string | null>(null)

  const filteredJobs = jobs.filter((job) => {
    if (selectedDepartment && job.department !== selectedDepartment)
      return false
    if (selectedType && job.type !== selectedType) return false
    return true
  })

  return (
    <div className='min-h-screen bg-background'>
      <div className='max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
        <div className='space-y-6'>
          <div>
            <h1 className='text-3xl font-bold text-foreground'>
              Open Positions
            </h1>
            <p className='mt-2 text-muted-foreground'>
              Browse and manage all open positions across departments
            </p>
          </div>

          <div className='flex gap-4 flex-wrap'>
            <div className='w-48'>
              <Select
                value={selectedDepartment || undefined}
                onValueChange={setSelectedDepartment}>
                <SelectTrigger>
                  <SelectValue placeholder='Department' />
                </SelectTrigger>
                <SelectContent>
                  {departments.map((dept) => (
                    <SelectItem key={dept} value={dept}>
                      {dept}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className='w-48'>
              <Select
                value={selectedType || undefined}
                onValueChange={setSelectedType}>
                <SelectTrigger>
                  <SelectValue placeholder='Position Type' />
                </SelectTrigger>
                <SelectContent>
                  {positionTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className='grid gap-4'>
            {filteredJobs.map((job) => (
              <Card key={job.id} className='p-6'>
                <div className='flex items-start justify-between'>
                  <div className='space-y-3'>
                    <div>
                      <h2 className='text-xl font-semibold'>{job.title}</h2>
                      <div className='flex items-center gap-2 mt-1 text-muted-foreground'>
                        <Users className='h-4 w-4' />
                        <span>{job.department}</span>
                        <span>•</span>
                        <Briefcase className='h-4 w-4' />
                        <span>{job.type}</span>
                        <span>•</span>
                        <MapPin className='h-4 w-4' />
                        <span>{job.location}</span>
                      </div>
                    </div>
                    <p className='text-muted-foreground'>{job.description}</p>
                    <div className='flex gap-2'>
                      <Badge variant='secondary'>{job.department}</Badge>
                      <Badge variant='outline'>{job.type}</Badge>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
