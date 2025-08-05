'use client'

import { Button } from '@seeds/ui/button'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@seeds/ui/collapsible'
import { Checkbox } from '@seeds/ui/checkbox'
import { ChevronDown } from 'lucide-react'
import { useState } from 'react'

const jobTypes = ['Full-time', 'Part-time', 'Contract', 'Internship']
const experienceLevels = ['Entry Level', 'Junior', 'Mid-Level', 'Senior', 'Lead']
const remoteOptions = ['Remote', 'Hybrid', 'On-site']
const departments = ['Engineering', 'Product', 'Design', 'Marketing', 'Sales', 'Operations']

export function JobFilters() {
  const [selectedTypes, setSelectedTypes] = useState<string[]>([])
  const [selectedLevels, setSelectedLevels] = useState<string[]>([])
  const [selectedRemote, setSelectedRemote] = useState<string[]>([])
  const [selectedDepartments, setSelectedDepartments] = useState<string[]>([])

  const [openSections, setOpenSections] = useState({
    location: false,
    department: false,
    type: false,
    experience: false,
  })

  const toggleFilter = (filter: string, category: string[], setCategory: (val: string[]) => void) => {
    if (category.includes(filter)) {
      setCategory(category.filter((f) => f !== filter))
    } else {
      setCategory([...category, filter])
    }
  }

  const clearAll = () => {
    setSelectedTypes([])
    setSelectedLevels([])
    setSelectedRemote([])
    setSelectedDepartments([])
  }

  const hasFilters =
    selectedTypes.length > 0 || selectedLevels.length > 0 || selectedRemote.length > 0 || selectedDepartments.length > 0

  return (
    <div className='space-y-1'>
      {hasFilters && (
        <div className='mb-4'>
          <Button
            onClick={clearAll}
            variant='ghost'
            size='sm'
            className='text-xs text-muted-foreground hover:text-foreground'>
            Clear all filters
          </Button>
        </div>
      )}

      <Collapsible
        open={openSections.location}
        onOpenChange={(open) => setOpenSections((prev) => ({ ...prev, location: open }))}>
        <CollapsibleTrigger className='flex items-center justify-between w-full py-3 text-sm font-medium hover:text-foreground transition-colors group'>
          <span>Location</span>
          <ChevronDown className={`h-4 w-4 transition-transform ${openSections.location ? 'rotate-180' : ''}`} />
        </CollapsibleTrigger>
        <CollapsibleContent className='pb-4'>
          <div className='space-y-2 pt-2'>
            {remoteOptions.map((option) => (
              <label key={option} className='flex items-center cursor-pointer hover:text-foreground transition-colors'>
                <Checkbox
                  checked={selectedRemote.includes(option)}
                  onCheckedChange={() => toggleFilter(option, selectedRemote, setSelectedRemote)}
                  className='mr-3'
                />
                <span className='text-sm'>{option}</span>
              </label>
            ))}
          </div>
        </CollapsibleContent>
      </Collapsible>

      <div className='border-t border-border' />

      <Collapsible
        open={openSections.department}
        onOpenChange={(open) => setOpenSections((prev) => ({ ...prev, department: open }))}>
        <CollapsibleTrigger className='flex items-center justify-between w-full py-3 text-sm font-medium hover:text-foreground transition-colors group'>
          <span>Department</span>
          <ChevronDown className={`h-4 w-4 transition-transform ${openSections.department ? 'rotate-180' : ''}`} />
        </CollapsibleTrigger>
        <CollapsibleContent className='pb-4'>
          <div className='space-y-2 pt-2'>
            {departments.map((dept) => (
              <label key={dept} className='flex items-center cursor-pointer hover:text-foreground transition-colors'>
                <Checkbox
                  checked={selectedDepartments.includes(dept)}
                  onCheckedChange={() => toggleFilter(dept, selectedDepartments, setSelectedDepartments)}
                  className='mr-3'
                />
                <span className='text-sm'>{dept}</span>
              </label>
            ))}
          </div>
        </CollapsibleContent>
      </Collapsible>

      <div className='border-t border-border' />

      <Collapsible
        open={openSections.type}
        onOpenChange={(open) => setOpenSections((prev) => ({ ...prev, type: open }))}>
        <CollapsibleTrigger className='flex items-center justify-between w-full py-3 text-sm font-medium hover:text-foreground transition-colors group'>
          <span>Job Type</span>
          <ChevronDown className={`h-4 w-4 transition-transform ${openSections.type ? 'rotate-180' : ''}`} />
        </CollapsibleTrigger>
        <CollapsibleContent className='pb-4'>
          <div className='space-y-2 pt-2'>
            {jobTypes.map((type) => (
              <label key={type} className='flex items-center cursor-pointer hover:text-foreground transition-colors'>
                <Checkbox
                  checked={selectedTypes.includes(type)}
                  onCheckedChange={() => toggleFilter(type, selectedTypes, setSelectedTypes)}
                  className='mr-3'
                />
                <span className='text-sm'>{type}</span>
              </label>
            ))}
          </div>
        </CollapsibleContent>
      </Collapsible>

      <div className='border-t border-border' />

      <Collapsible
        open={openSections.experience}
        onOpenChange={(open) => setOpenSections((prev) => ({ ...prev, experience: open }))}>
        <CollapsibleTrigger className='flex items-center justify-between w-full py-3 text-sm font-medium hover:text-foreground transition-colors group'>
          <span>Experience Level</span>
          <ChevronDown className={`h-4 w-4 transition-transform ${openSections.experience ? 'rotate-180' : ''}`} />
        </CollapsibleTrigger>
        <CollapsibleContent className='pb-4'>
          <div className='space-y-2 pt-2'>
            {experienceLevels.map((level) => (
              <label key={level} className='flex items-center cursor-pointer hover:text-foreground transition-colors'>
                <Checkbox
                  checked={selectedLevels.includes(level)}
                  onCheckedChange={() => toggleFilter(level, selectedLevels, setSelectedLevels)}
                  className='mr-3'
                />
                <span className='text-sm'>{level}</span>
              </label>
            ))}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  )
}
