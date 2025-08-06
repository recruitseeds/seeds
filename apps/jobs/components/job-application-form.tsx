'use client'

import { Button } from '@seeds/ui/button'
import { Input } from '@seeds/ui/input'
import { Label } from '@seeds/ui/label'
import { Textarea } from '@seeds/ui/textarea'
import { Upload, FileText, X } from 'lucide-react'
import { useState, useRef } from 'react'
import { formatSalary } from '../lib/api'
import type { JobPostingDetail } from '../lib/api'

interface JobApplicationFormProps {
  job: JobPostingDetail
}

interface FormData {
  firstName: string
  lastName: string
  email: string
  phone: string
  coverLetter: string
  resumeFile: File | null
}

export function JobApplicationForm({ job }: JobApplicationFormProps) {
  const [formData, setFormData] = useState<FormData>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    coverLetter: '',
    resumeFile: null,
  })
  
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleFileSelect = (file: File | null) => {
    setFormData(prev => ({ ...prev, resumeFile: file }))
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    
    const files = Array.from(e.dataTransfer.files)
    const file = files[0]
    
    if (file && isValidFileType(file)) {
      handleFileSelect(file)
    }
  }

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && isValidFileType(file)) {
      handleFileSelect(file)
    }
  }

  const isValidFileType = (file: File) => {
    const validTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain'
    ]
    return validTypes.includes(file.type) && file.size <= 5 * 1024 * 1024 // 5MB limit
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      // TODO: Check for authentication first
      // If not authenticated, show login modal or redirect
      // If authenticated, proceed with application submission
      
      console.log('Form data:', formData)
      console.log('Job ID:', job.id)
      
      // Placeholder for authentication check and submission logic
      await new Promise(resolve => setTimeout(resolve, 2000)) // Simulate API call
      
      alert('Application submitted successfully!')
    } catch (error) {
      console.error('Application submission failed:', error)
      alert('Failed to submit application. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const isFormValid = formData.firstName && formData.lastName && formData.email && formData.resumeFile

  return (
    <div className='bg-card border border-border rounded-lg p-6'>
      <div className='mb-6'>
        <h2 className='text-xl font-semibold mb-2'>Apply for this position</h2>
        <div className='text-sm text-muted-foreground space-y-1'>
          <p><strong>{job.title}</strong></p>
          <p>{job.organization.name}</p>
          <p>{formatSalary(job.salary_min, job.salary_max, job.salary_type)}</p>
          <p className='capitalize'>{job.job_type.replace('_', ' ')}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className='space-y-4'>
        {/* Name Fields */}
        <div className='grid grid-cols-2 gap-3'>
          <div>
            <Label htmlFor='firstName'>First Name *</Label>
            <Input
              id='firstName'
              type='text'
              value={formData.firstName}
              onChange={(e) => handleInputChange('firstName', e.target.value)}
              placeholder='John'
              required
            />
          </div>
          <div>
            <Label htmlFor='lastName'>Last Name *</Label>
            <Input
              id='lastName'
              type='text'
              value={formData.lastName}
              onChange={(e) => handleInputChange('lastName', e.target.value)}
              placeholder='Doe'
              required
            />
          </div>
        </div>

        {/* Email */}
        <div>
          <Label htmlFor='email'>Email Address *</Label>
          <Input
            id='email'
            type='email'
            value={formData.email}
            onChange={(e) => handleInputChange('email', e.target.value)}
            placeholder='john@example.com'
            required
          />
        </div>

        {/* Phone */}
        <div>
          <Label htmlFor='phone'>Phone Number</Label>
          <Input
            id='phone'
            type='tel'
            value={formData.phone}
            onChange={(e) => handleInputChange('phone', e.target.value)}
            placeholder='+1 (555) 123-4567'
          />
        </div>

        {/* Resume Upload */}
        <div>
          <Label>Resume *</Label>
          <div
            className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
              dragOver 
                ? 'border-primary bg-primary/5' 
                : 'border-border hover:border-primary/50'
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            {formData.resumeFile ? (
              <div className='flex items-center justify-between'>
                <div className='flex items-center space-x-3'>
                  <FileText className='h-8 w-8 text-primary' />
                  <div className='text-left'>
                    <p className='font-medium text-sm'>{formData.resumeFile.name}</p>
                    <p className='text-xs text-muted-foreground'>
                      {(formData.resumeFile.size / 1024).toFixed(1)} KB
                    </p>
                  </div>
                </div>
                <Button
                  type='button'
                  variant='ghost'
                  size='sm'
                  onClick={() => handleFileSelect(null)}
                >
                  <X className='h-4 w-4' />
                </Button>
              </div>
            ) : (
              <div className='space-y-2'>
                <Upload className='h-8 w-8 mx-auto text-muted-foreground' />
                <div>
                  <p className='font-medium'>Drop your resume here, or</p>
                  <Button
                    type='button'
                    variant='link'
                    className='p-0 h-auto'
                    onClick={() => fileInputRef.current?.click()}
                  >
                    browse files
                  </Button>
                </div>
                <p className='text-xs text-muted-foreground'>
                  PDF, DOC, DOCX, or TXT files up to 5MB
                </p>
              </div>
            )}
            <input
              ref={fileInputRef}
              type='file'
              className='hidden'
              accept='.pdf,.doc,.docx,.txt'
              onChange={handleFileInputChange}
            />
          </div>
        </div>

        {/* Cover Letter */}
        <div>
          <Label htmlFor='coverLetter'>Cover Letter (Optional)</Label>
          <Textarea
            id='coverLetter'
            value={formData.coverLetter}
            onChange={(e) => handleInputChange('coverLetter', e.target.value)}
            placeholder='Tell us why you\'re interested in this position...'
            rows={4}
            className='resize-none'
          />
        </div>

        {/* Submit Button */}
        <Button 
          type='submit' 
          className='w-full' 
          disabled={!isFormValid || isSubmitting}
        >
          {isSubmitting ? 'Submitting...' : 'Apply Now'}
        </Button>

        {/* Form Requirements */}
        <div className='text-xs text-muted-foreground space-y-1'>
          <p>* Required fields</p>
          <p>By applying, you agree to our Terms of Service and Privacy Policy.</p>
        </div>
      </form>
    </div>
  )
}