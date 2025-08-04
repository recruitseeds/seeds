'use client'

import { Button } from '@seeds/ui/button'
import { useState } from 'react'

const jobTypes = ['Full-time', 'Part-time', 'Contract', 'Internship']
const experienceLevels = ['Entry Level', 'Junior', 'Mid-Level', 'Senior', 'Lead']
const remoteOptions = ['Remote', 'Hybrid', 'On-site']
const salaryRanges = ['$0 - $50k', '$50k - $100k', '$100k - $150k', '$150k+']

export function JobFilters() {
  const [selectedTypes, setSelectedTypes] = useState<string[]>([])
  const [selectedLevels, setSelectedLevels] = useState<string[]>([])
  const [selectedRemote, setSelectedRemote] = useState<string[]>([])
  const [selectedSalary, setSelectedSalary] = useState<string[]>([])

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
    setSelectedSalary([])
  }

  const hasFilters =
    selectedTypes.length > 0 || selectedLevels.length > 0 || selectedRemote.length > 0 || selectedSalary.length > 0

  return (
    <div className='bg-card rounded-lg border border-border p-6'>
      <div className='flex items-center justify-between mb-6'>
        <h3 className='font-semibold text-lg'>Filters</h3>
        {hasFilters && (
          <Button onClick={clearAll} className='text-sm text-muted-foreground hover:text-foreground transition-colors'>
            Clear all
          </Button>
        )}
      </div>

      <div className='space-y-6'>
        {/* Job Type */}
        <div>
          <h4 className='font-medium mb-3'>Job Type</h4>
          <div className='space-y-2'>
            {jobTypes.map((type) => (
              <label key={type} className='flex items-center cursor-pointer'>
                <input
                  type='checkbox'
                  checked={selectedTypes.includes(type)}
                  onChange={() => toggleFilter(type, selectedTypes, setSelectedTypes)}
                  className='mr-2 h-4 w-4 rounded border-border text-brand focus:ring-brand'
                />
                <span className='text-sm'>{type}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Experience Level */}
        <div>
          <h4 className='font-medium mb-3'>Experience Level</h4>
          <div className='space-y-2'>
            {experienceLevels.map((level) => (
              <label key={level} className='flex items-center cursor-pointer'>
                <input
                  type='checkbox'
                  checked={selectedLevels.includes(level)}
                  onChange={() => toggleFilter(level, selectedLevels, setSelectedLevels)}
                  className='mr-2 h-4 w-4 rounded border-border text-brand focus:ring-brand'
                />
                <span className='text-sm'>{level}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Work Location */}
        <div>
          <h4 className='font-medium mb-3'>Work Location</h4>
          <div className='space-y-2'>
            {remoteOptions.map((option) => (
              <label key={option} className='flex items-center cursor-pointer'>
                <input
                  type='checkbox'
                  checked={selectedRemote.includes(option)}
                  onChange={() => toggleFilter(option, selectedRemote, setSelectedRemote)}
                  className='mr-2 h-4 w-4 rounded border-border text-brand focus:ring-brand'
                />
                <span className='text-sm'>{option}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Salary Range */}
        <div>
          <h4 className='font-medium mb-3'>Salary Range</h4>
          <div className='space-y-2'>
            {salaryRanges.map((range) => (
              <label key={range} className='flex items-center cursor-pointer'>
                <input
                  type='checkbox'
                  checked={selectedSalary.includes(range)}
                  onChange={() => toggleFilter(range, selectedSalary, setSelectedSalary)}
                  className='mr-2 h-4 w-4 rounded border-border text-brand focus:ring-brand'
                />
                <span className='text-sm'>{range}</span>
              </label>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
