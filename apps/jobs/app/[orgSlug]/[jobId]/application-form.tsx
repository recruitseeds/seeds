'use client'

import { Button } from '@seeds/ui/button'
import { Input } from '@seeds/ui/input'
import { Label } from '@seeds/ui/label'
import { Textarea } from '@seeds/ui/textarea'
import { Check, Upload } from 'lucide-react'
import { useState } from 'react'

export function ApplicationForm() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [resumeFile, setResumeFile] = useState<File | null>(null)
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    linkedin: '',
    portfolio: '',
    coverLetter: '',
    additionalInfo: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    await new Promise((resolve) => setTimeout(resolve, 2000))

    setIsSubmitting(false)
    setIsSubmitted(true)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setResumeFile(file)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }))
  }

  if (isSubmitted) {
    return (
      <div className='text-center py-12'>
        <div className='inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4'>
          <Check className='h-8 w-8 text-green-600' />
        </div>
        <h3 className='text-2xl font-semibold mb-2'>Application Submitted!</h3>
        <p className='text-muted-foreground'>
          Thank you for your interest. We'll review your application and get back to you soon.
        </p>
      </div>
    )
  }

  return (
    <div>
      <form onSubmit={handleSubmit} className='space-y-6'>
        <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
          <div className='space-y-2'>
            <Label htmlFor='firstName'>First Name *</Label>
            <Input
              id='firstName'
              name='firstName'
              value={formData.firstName}
              onChange={handleInputChange}
              required
              placeholder='John'
              className='w-full'
            />
          </div>

          <div className='space-y-2'>
            <Label htmlFor='lastName'>Last Name *</Label>
            <Input
              id='lastName'
              name='lastName'
              value={formData.lastName}
              onChange={handleInputChange}
              required
              placeholder='Doe'
              className='w-full'
            />
          </div>
        </div>

        <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
          <div className='space-y-2'>
            <Label htmlFor='email'>Email *</Label>
            <Input
              id='email'
              name='email'
              type='email'
              value={formData.email}
              onChange={handleInputChange}
              required
              placeholder='john.doe@example.com'
              className='w-full'
            />
          </div>

          <div className='space-y-2'>
            <Label htmlFor='phone'>Phone</Label>
            <Input
              id='phone'
              name='phone'
              type='tel'
              value={formData.phone}
              onChange={handleInputChange}
              placeholder='+1 (555) 000-0000'
              className='w-full'
            />
          </div>
        </div>

        <div className='space-y-2'>
          <Label htmlFor='resume'>Resume/CV *</Label>
          <div className='relative'>
            <input
              id='resume'
              name='resume'
              type='file'
              accept='.pdf,.doc,.docx'
              onChange={handleFileChange}
              required
              className='hidden'
            />
            <label
              htmlFor='resume'
              className='flex items-center justify-center gap-2 p-4 border-2 border-dashed rounded-lg cursor-pointer hover:border-primary transition-colors'>
              <Upload className='h-5 w-5 text-muted-foreground' />
              <span className='text-sm text-muted-foreground'>
                {resumeFile ? resumeFile.name : 'Drop your resume here or click to browse'}
              </span>
            </label>
          </div>
          <p className='text-xs text-muted-foreground'>PDF, DOC, or DOCX (max 5MB)</p>
        </div>

        <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
          <div className='space-y-2'>
            <Label htmlFor='linkedin'>LinkedIn Profile</Label>
            <Input
              id='linkedin'
              name='linkedin'
              type='url'
              value={formData.linkedin}
              onChange={handleInputChange}
              placeholder='https://linkedin.com/in/johndoe'
              className='w-full'
            />
          </div>

          <div className='space-y-2'>
            <Label htmlFor='portfolio'>Portfolio/Website</Label>
            <Input
              id='portfolio'
              name='portfolio'
              type='url'
              value={formData.portfolio}
              onChange={handleInputChange}
              placeholder='https://johndoe.com'
              className='w-full'
            />
          </div>
        </div>

        <div className='space-y-2'>
          <Label htmlFor='coverLetter'>Cover Letter</Label>
          <Textarea
            id='coverLetter'
            name='coverLetter'
            value={formData.coverLetter}
            onChange={handleInputChange}
            placeholder="Tell us why you're interested in this role and what makes you a great fit..."
            className='min-h-[120px] w-full'
          />
        </div>

        <div className='space-y-2'>
          <Label htmlFor='additionalInfo'>Additional Information</Label>
          <Textarea
            id='additionalInfo'
            name='additionalInfo'
            value={formData.additionalInfo}
            onChange={handleInputChange}
            placeholder="Anything else you'd like us to know? (availability, salary expectations, etc.)"
            className='min-h-[80px] w-full'
          />
        </div>

        <div className='flex items-center justify-between pt-4'>
          <p className='text-sm text-muted-foreground'>* Required fields</p>
          <Button type='submit' disabled={isSubmitting} size='lg' loading={isSubmitting}>
            Submit Application
          </Button>
        </div>
      </form>
    </div>
  )
}
