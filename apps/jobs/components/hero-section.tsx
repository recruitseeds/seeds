'use client'

import { Badge } from '@seeds/ui/badge'
import { Button } from '@seeds/ui/button'
import { Input } from '@seeds/ui/input'
import { Label } from '@seeds/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@seeds/ui/select'
import {
  Bell,
  Briefcase,
  Building2,
  Clock,
  DollarSign,
  Filter,
  GraduationCap,
  MapPin,
  Search,
  Star,
  Upload,
  Zap,
} from 'lucide-react'
import { useState } from 'react'
const quickTags = ['React', 'Python', 'Remote OK', 'Startup', 'AI/ML', 'Design']

const quickFilters = [
  { icon: Briefcase, label: 'Job Type', options: ['Full-time', 'Part-time', 'Contract'] },
  { icon: MapPin, label: 'Remote', options: ['Remote', 'Hybrid', 'On-site'] },
  { icon: DollarSign, label: 'Salary', options: ['$50k+', '$100k+', '$150k+'] },
  { icon: Clock, label: 'Experience', options: ['Entry', 'Mid', 'Senior'] },
]

const topCompanies = [
  { name: 'OpenAI', logo: '🤖', jobs: 42, rating: 4.8 },
  { name: 'Stripe', logo: '💳', jobs: 28, rating: 4.9 },
  { name: 'Vercel', logo: '▲', jobs: 15, rating: 4.7 },
  { name: 'Linear', logo: '📐', jobs: 8, rating: 4.9 },
  { name: 'Supabase', logo: '⚡', jobs: 12, rating: 4.8 },
  { name: 'Framer', logo: '🎨', jobs: 6, rating: 4.6 },
]

export function HeroSection() {
  const [searchQuery, setSearchQuery] = useState('')
  const [location, setLocation] = useState('')
  const [selectedFilters, setSelectedFilters] = useState<Record<string, string>>({})

  const handleSearch = () => {
    console.log('Searching for:', searchQuery, 'in', location, 'with filters:', selectedFilters)
  }

  const handleFilterSelect = (category: string, value: string) => {
    setSelectedFilters((prev) => ({
      ...prev,
      [category]: prev[category] === value ? '' : value,
    }))
  }

  return (
    <section className='relative overflow-hidden py-6'>
      <div className='mx-auto px-4'>
        <div className='max-w-6xl mx-auto mb-16'>
          <div className='grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6'>
            <div className='lg:col-span-2 bg-card border border-border rounded-2xl p-6'>
              <div className='mb-4'>
                <h3 className='font-semibold text-lg mb-2'>Search Jobs</h3>
                <p className='text-muted-foreground text-sm'>Find your perfect role with AI-powered matching</p>
              </div>

              <div className='flex flex-col sm:flex-row gap-3 mb-4'>
                <div className='flex-1 relative'>
                  <Search className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none' />
                  <Input
                    type='text'
                    placeholder='Job title, skills, or company'
                    value={searchQuery}
                    className='h-7.5 !pl-10 pr-3'
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <div className='sm:w-48 relative'>
                  <MapPin className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground' />
                  <Input
                    type='text'
                    placeholder='Location'
                    value={location}
                    className='h-7.5 !pl-10 pr-3'
                    onChange={(e) => setLocation(e.target.value)}
                  />
                </div>
                <Button onClick={handleSearch} variant='brand'>
                  <Search className='mr-2' />
                  Search
                </Button>
              </div>

              <div className='mb-6'>
                <p className='text-sm text-muted-foreground mb-3'>Popular searches:</p>
                <div className='flex flex-wrap gap-2'>
                  {quickTags.map((tag) => (
                    <Badge key={tag} onClick={() => setSearchQuery(tag)} variant='secondary' className='cursor-pointer'>
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>

              <div>
                <p className='text-sm text-muted-foreground mb-3'>Quick actions:</p>
                <div className='grid grid-cols-1 sm:grid-cols-2 gap-3'>
                  <div className='p-4 bg-card border rounded-lg cursor-pointer'>
                    <div className='flex items-start'>
                      <div className='p-2 bg-brand/20 rounded-lg mr-3 group-hover:bg-brand/30 transition-colors'>
                        <Upload className='h-4 w-4 text-brand' />
                      </div>
                      <div>
                        <h4 className='font-medium text-sm mb-1 group-hover:text-brand transition-colors'>
                          Upload Resume
                        </h4>
                        <p className='text-xs text-muted-foreground'>Let companies find you with our AI matching</p>
                      </div>
                    </div>
                  </div>
                  <div className='p-4 bg-card border rounded-lg cursor-pointer'>
                    <div className='flex items-start'>
                      <div className='p-2 bg-purple-500/20 rounded-lg mr-3 group-hover:bg-purple-500/30 transition-colors'>
                        <Bell className='h-4 w-4 text-purple-600' />
                      </div>
                      <div>
                        <h4 className='font-medium text-sm mb-1 group-hover:text-purple-600 transition-colors'>
                          Set Job Alerts
                        </h4>
                        <p className='text-xs text-muted-foreground'>Never miss your dream job</p>
                      </div>
                    </div>
                  </div>
                  <div className='p-4 bg-card border rounded-lg cursor-pointer'>
                    <div className='flex items-start'>
                      <div className='p-2 bg-orange-500/20 rounded-lg mr-3 group-hover:bg-orange-500/30 transition-colors'>
                        <Zap className='h-4 w-4 text-orange-600' />
                      </div>
                      <div>
                        <h4 className='font-medium text-sm mb-1 group-hover:text-orange-600 transition-colors'>
                          Browse by Skill
                        </h4>
                        <p className='text-xs text-muted-foreground'>Find jobs that match your expertise</p>
                      </div>
                    </div>
                  </div>
                  <div className='p-4 bg-card border rounded-lg cursor-pointer'>
                    <div className='flex items-start'>
                      <div className='p-2 bg-emerald-500/20 rounded-lg mr-3 group-hover:bg-emerald-500/30 transition-colors'>
                        <GraduationCap className='h-4 w-4 text-emerald-600' />
                      </div>
                      <div>
                        <h4 className='font-medium text-sm mb-1 group-hover:text-emerald-600 transition-colors'>
                          New Grad Jobs
                        </h4>
                        <p className='text-xs text-muted-foreground'>Entry-level positions for recent graduates</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className='bg-card border border-border rounded-2xl p-6'>
              <div className='mb-6'>
                <h3 className='font-semibold text-lg mb-2 flex items-center'>
                  <Filter className='mr-2 h-5 w-5' />
                  Quick Filters
                </h3>
                <p className='text-muted-foreground text-sm'>Refine your search instantly</p>
              </div>

              <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 gap-4 mb-6 w-full'>
                {quickFilters.map((filter) => (
                  <div key={filter.label} className='w-full'>
                    <Label className='text-foreground/90 flex items-center mb-2'>
                      <filter.icon className='size-4 mr-2' />
                      {filter.label}
                    </Label>
                    <Select
                      value={selectedFilters[filter.label] || undefined}
                      onValueChange={(value) => handleFilterSelect(filter.label, value)}>
                      <SelectTrigger className='w-full'>
                        <SelectValue placeholder={`Any ${filter.label.toLowerCase()}`} />
                      </SelectTrigger>
                      <SelectContent>
                        {filter.options.map((option) => (
                          <SelectItem key={option} value={option}>
                            {option}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ))}
              </div>

              <Button variant='default' className='w-full'>
                Apply filters
              </Button>
            </div>
          </div>

          <div className='bg-card border border-border rounded-2xl p-6'>
            <div className='mb-6'>
              <h3 className='font-semibold text-lg mb-2 flex items-center'>
                <Building2 className='mr-2 size-5' />
                Browse by Company
              </h3>
              <p className='text-muted-foreground text-sm'>Explore opportunities at top-rated companies</p>
            </div>

            <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4'>
              {topCompanies.map((company) => (
                <button
                  key={company.name}
                  type='button'
                  className='p-4 border hover:border-primary/30 rounded-xl transition-all text-left'>
                  <div className='flex items-center mb-2'>
                    <span className='text-2xl mr-3'>{company.logo}</span>
                    <div className='flex-1 min-w-0'>
                      <p className='font-medium truncate'>{company.name}</p>
                      <div className='flex items-center text-xs text-muted-foreground'>
                        <Star className='h-3 w-3 mr-1 fill-yellow-400 text-yellow-400' />
                        {company.rating}
                      </div>
                    </div>
                  </div>
                  <p className='text-sm text-muted-foreground'>{company.jobs} open positions</p>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
