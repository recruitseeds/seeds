'use client'

import { Briefcase, Building2, Clock, DollarSign, Filter, MapPin, Search, Star } from 'lucide-react'
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
    <section className='relative overflow-hidden bg-gradient-to-br from-background via-muted/10 to-brand/5 py-8'>
      <div className='container mx-auto px-4'>
        {/* Bento Box Layout */}
        <div className='max-w-6xl mx-auto mb-16'>
          <div className='grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8'>
            {/* Left Section - Search with Tags (2/3 width) */}
            <div className='lg:col-span-2 bg-card border border-border rounded-2xl p-6 shadow-sm'>
              <div className='mb-4'>
                <h3 className='font-semibold text-lg mb-2'>Search Jobs</h3>
                <p className='text-muted-foreground text-sm'>Find your perfect role with AI-powered matching</p>
              </div>

              {/* Search Input */}
              <div className='flex flex-col sm:flex-row gap-3 mb-4'>
                <div className='flex-1 relative'>
                  <Search className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground' />
                  <input
                    type='text'
                    placeholder='Job title, skills, or company'
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className='w-full pl-10 h-11 bg-background border border-border rounded-lg px-3 outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-colors'
                  />
                </div>
                <div className='sm:w-48 relative'>
                  <MapPin className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground' />
                  <input
                    type='text'
                    placeholder='Location'
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className='w-full pl-10 h-11 bg-background border border-border rounded-lg px-3 outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-colors'
                  />
                </div>
                <button
                  onClick={handleSearch}
                  className='h-11 px-6 bg-brand hover:bg-brand-hover text-brand-foreground rounded-lg font-medium transition-colors flex items-center justify-center whitespace-nowrap'>
                  <Search className='mr-2 h-4 w-4' />
                  Search
                </button>
              </div>

              {/* Quick Tags */}
              <div className='mb-6'>
                <p className='text-sm text-muted-foreground mb-3'>Popular searches:</p>
                <div className='flex flex-wrap gap-2'>
                  {quickTags.map((tag) => (
                    <button
                      key={tag}
                      onClick={() => setSearchQuery(tag)}
                      className='px-3 py-1.5 text-sm bg-muted hover:bg-brand hover:text-brand-foreground rounded-full transition-colors'>
                      {tag}
                    </button>
                  ))}
                </div>
              </div>

              {/* Career Tips Cards */}
              <div>
                <p className='text-sm text-muted-foreground mb-3'>Get ahead in your career:</p>
                <div className='grid grid-cols-1 sm:grid-cols-2 gap-3'>
                  <div className='p-4 bg-gradient-to-r from-brand/5 to-brand/10 border border-brand/20 rounded-lg hover:shadow-sm transition-all cursor-pointer group'>
                    <div className='flex items-start'>
                      <div className='p-2 bg-brand/20 rounded-lg mr-3 group-hover:bg-brand/30 transition-colors'>
                        <Star className='h-4 w-4 text-brand' />
                      </div>
                      <div>
                        <h4 className='font-medium text-sm mb-1 group-hover:text-brand transition-colors'>
                          AI Resume Review
                        </h4>
                        <p className='text-xs text-muted-foreground'>Get instant feedback to improve your resume</p>
                      </div>
                    </div>
                  </div>
                  <div className='p-4 bg-gradient-to-r from-purple-500/5 to-purple-500/10 border border-purple-500/20 rounded-lg hover:shadow-sm transition-all cursor-pointer group'>
                    <div className='flex items-start'>
                      <div className='p-2 bg-purple-500/20 rounded-lg mr-3 group-hover:bg-purple-500/30 transition-colors'>
                        <Briefcase className='h-4 w-4 text-purple-600' />
                      </div>
                      <div>
                        <h4 className='font-medium text-sm mb-1 group-hover:text-purple-600 transition-colors'>
                          Interview Tips
                        </h4>
                        <p className='text-xs text-muted-foreground'>Stand out with expert interview strategies</p>
                      </div>
                    </div>
                  </div>
                  <div className='p-4 bg-gradient-to-r from-orange-500/5 to-orange-500/10 border border-orange-500/20 rounded-lg hover:shadow-sm transition-all cursor-pointer group'>
                    <div className='flex items-start'>
                      <div className='p-2 bg-orange-500/20 rounded-lg mr-3 group-hover:bg-orange-500/30 transition-colors'>
                        <DollarSign className='h-4 w-4 text-orange-600' />
                      </div>
                      <div>
                        <h4 className='font-medium text-sm mb-1 group-hover:text-orange-600 transition-colors'>
                          Salary Guide
                        </h4>
                        <p className='text-xs text-muted-foreground'>Know your worth and negotiate better</p>
                      </div>
                    </div>
                  </div>
                  <div className='p-4 bg-gradient-to-r from-emerald-500/5 to-emerald-500/10 border border-emerald-500/20 rounded-lg hover:shadow-sm transition-all cursor-pointer group'>
                    <div className='flex items-start'>
                      <div className='p-2 bg-emerald-500/20 rounded-lg mr-3 group-hover:bg-emerald-500/30 transition-colors'>
                        <Building2 className='h-4 w-4 text-emerald-600' />
                      </div>
                      <div>
                        <h4 className='font-medium text-sm mb-1 group-hover:text-emerald-600 transition-colors'>
                          Company Research
                        </h4>
                        <p className='text-xs text-muted-foreground'>Insider tips to research employers</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Section - Quick Filters (1/3 width) */}
            <div className='bg-card border border-border rounded-2xl p-6 shadow-sm'>
              <div className='mb-6'>
                <h3 className='font-semibold text-lg mb-2 flex items-center'>
                  <Filter className='mr-2 h-5 w-5' />
                  Quick Filters
                </h3>
                <p className='text-muted-foreground text-sm'>Refine your search instantly</p>
              </div>

              <div className='space-y-4 mb-6'>
                {quickFilters.map((filter) => (
                  <div key={filter.label}>
                    <label className='text-sm font-medium mb-2 flex items-center text-muted-foreground'>
                      <filter.icon className='mr-2 h-4 w-4' />
                      {filter.label}
                    </label>
                    <select
                      value={selectedFilters[filter.label] || ''}
                      onChange={(e) => handleFilterSelect(filter.label, e.target.value)}
                      className='w-full h-10 px-3 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-colors'>
                      <option value=''>Any {filter.label.toLowerCase()}</option>
                      {filter.options.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>

              <button className='w-full p-3 bg-gradient-to-r from-brand to-brand-hover text-brand-foreground rounded-lg font-medium text-sm hover:shadow-md transition-all'>
                Set Job Alerts
              </button>
            </div>
          </div>

          {/* Full Width Section - Search by Company */}
          <div className='bg-card border border-border rounded-2xl p-6 shadow-sm'>
            <div className='mb-6'>
              <h3 className='font-semibold text-lg mb-2 flex items-center'>
                <Building2 className='mr-2 h-5 w-5' />
                Browse by Company
              </h3>
              <p className='text-muted-foreground text-sm'>Explore opportunities at top-rated companies</p>
            </div>

            <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4'>
              {topCompanies.map((company) => (
                <button
                  key={company.name}
                  className='p-4 border border-border rounded-xl hover:border-brand hover:shadow-sm transition-all group text-left'>
                  <div className='flex items-center mb-2'>
                    <span className='text-2xl mr-3'>{company.logo}</span>
                    <div className='flex-1 min-w-0'>
                      <p className='font-medium truncate group-hover:text-brand transition-colors'>{company.name}</p>
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
