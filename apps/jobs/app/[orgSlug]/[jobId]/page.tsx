'use client'

import { Badge } from '@seeds/ui/badge'
import { Button } from '@seeds/ui/button'
import {
  Bookmark,
  Briefcase,
  Building2,
  CheckCircle,
  ChevronLeft,
  Clock,
  Coffee,
  DollarSign,
  GraduationCap,
  Heart,
  Home,
  MapPin,
  Share2,
  Shield,
  Zap,
} from 'lucide-react'
import Link from 'next/link'
import { useState, useEffect, useRef } from 'react'

interface JobPageProps {
  params: Promise<{
    orgSlug: string
    jobId: string
  }>
}

const jobData = {
  id: '1',
  title: 'Senior Frontend Developer',
  company: 'TechCorp',
  companySlug: 'techcorp',
  department: 'Engineering',
  employmentType: 'Full-time',
  location: 'San Francisco, CA',
  remote: 'Hybrid',
  salaryMin: 120000,
  salaryMax: 180000,
  experienceLevel: '5+ years',
  postedDate: '2024-01-15',
  companyDescription:
    "TechCorp is a leading technology company focused on building innovative solutions that transform how businesses operate. With over 500 employees across 3 offices, we're committed to creating a diverse and inclusive workplace where everyone can thrive.",
  roleDescription:
    "We're looking for a Senior Frontend Developer to join our growing team and help us build the next generation of our product platform. You'll work closely with designers, backend engineers, and product managers to deliver exceptional user experiences.",
  responsibilities: [
    'Build and maintain high-quality, scalable frontend applications using React and TypeScript',
    'Collaborate with designers to implement pixel-perfect, responsive user interfaces',
    'Optimize application performance and ensure smooth user experiences across devices',
    'Mentor junior developers and contribute to technical architecture decisions',
    'Participate in code reviews and help maintain high code quality standards',
    'Work with product teams to understand requirements and deliver features on time',
  ],
  requirements: [
    '5+ years of experience with modern JavaScript frameworks (React preferred)',
    'Strong proficiency in TypeScript and modern CSS',
    'Experience with state management solutions (Redux, MobX, or similar)',
    'Understanding of web performance optimization techniques',
    'Excellent problem-solving and communication skills',
    "Bachelor's degree in Computer Science or equivalent experience",
  ],
  niceToHave: [
    'Experience with Next.js and server-side rendering',
    'Knowledge of GraphQL and Apollo Client',
    'Familiarity with design systems and component libraries',
    'Experience with testing frameworks (Jest, React Testing Library)',
    'Contributions to open source projects',
  ],
  benefits: [
    { icon: DollarSign, title: 'Competitive Salary', description: '$120k - $180k based on experience' },
    { icon: Heart, title: 'Health Insurance', description: '100% coverage for you and your family' },
    { icon: Home, title: 'Remote Work', description: 'Flexible hybrid work arrangement' },
    { icon: GraduationCap, title: 'Learning Budget', description: '$2,500 annual professional development' },
    { icon: Coffee, title: 'Unlimited PTO', description: 'Take the time you need to recharge' },
    { icon: Shield, title: '401(k) Match', description: '6% company match on retirement savings' },
  ],
  skills: ['React', 'TypeScript', 'Node.js', 'GraphQL', 'CSS', 'Jest'],
}

function formatSalary(min: number, max: number): string {
  const format = (num: number) => `$${(num / 1000).toFixed(0)}k`
  return `${format(min)} - ${format(max)}`
}

function formatDate(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))

  if (diffDays === 0) return 'Posted today'
  if (diffDays === 1) return 'Posted yesterday'
  if (diffDays < 7) return `Posted ${diffDays} days ago`
  if (diffDays < 30) return `Posted ${Math.floor(diffDays / 7)} weeks ago`
  return `Posted ${Math.floor(diffDays / 30)} months ago`
}

export default function JobPage({ params }: JobPageProps) {
  const [isSaved, setIsSaved] = useState(false)
  const [showShareMenu, setShowShareMenu] = useState(false)
  const [isSticky, setIsSticky] = useState(false)
  const headerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleScroll = () => {
      if (headerRef.current) {
        const headerBottom = headerRef.current.getBoundingClientRect().bottom
        setIsSticky(headerBottom <= 0)
      }
    }
    
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const handleApply = () => {
    // Navigate to application flow
    // window.location.href = `/${params.orgSlug}/${params.jobId}/apply`
  }

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${jobData.title} at ${jobData.company}`,
          text: `Check out this job opportunity: ${jobData.title}`,
          url: window.location.href,
        })
      } catch (error) {
        console.log('Share failed:', error)
      }
    } else {
      setShowShareMenu(!showShareMenu)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Back Navigation - Mobile optimized */}
      <div ref={headerRef} className="container mx-auto px-4 py-4 lg:py-6">
        <Link
          href="/jobs"
          className="inline-flex items-center text-muted-foreground hover:text-foreground transition-colors text-sm lg:text-base">
          <ChevronLeft className="mr-1 lg:mr-2 h-4 w-4" />
          Back to all jobs
        </Link>
      </div>

      {/* Main Content Container */}
      <div className="container mx-auto px-4 pb-12 lg:pb-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
          
          {/* Mobile Header - Shown only on mobile, hidden on desktop */}
          <div className="lg:hidden mb-8">
            <p className="text-muted-foreground text-sm mb-3">
              {jobData.department}, {jobData.employmentType} ({jobData.location})
            </p>
            <h1 className="text-3xl sm:text-4xl font-bold mb-6 leading-tight">
              {jobData.title}
            </h1>
            
            {/* Compact Action Buttons */}
            <div className="flex gap-3">
              <Button 
                variant="default" 
                size="default"
                onClick={handleApply}
              >
                Apply
              </Button>
              <Button 
                variant="outline" 
                size="default"
              >
                Refer someone
              </Button>
            </div>
          </div>

          {/* Desktop Sidebar - Hidden on mobile, conditionally sticky on desktop */}
          <div className="hidden lg:block lg:col-span-4">
            <div className={`space-y-6 transition-all duration-200 ${isSticky ? 'lg:sticky lg:top-8' : ''}`}>
              {/* Job Meta Information */}
              <div>
                <p className="text-muted-foreground text-sm mb-2">
                  {jobData.department} · {jobData.employmentType} ({jobData.location})
                </p>
                <h1 className="text-3xl font-bold mb-4">{jobData.title}</h1>
                <p className="text-lg text-muted-foreground">{jobData.company}</p>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 mt-6">
                <Button variant="default" size="lg" className="flex-1" onClick={handleApply}>
                  Apply
                </Button>
                <Button variant="outline" size="lg" className="flex-1">
                  Refer someone
                </Button>
              </div>

              {/* Key Details Section */}
              <div className="space-y-3 pt-6 border-t mt-6">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Location</span>
                  <span className="font-medium">{jobData.location}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Salary Range</span>
                  <span className="font-medium">
                    {formatSalary(jobData.salaryMin, jobData.salaryMax)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Experience</span>
                  <span className="font-medium">{jobData.experienceLevel}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content Area - Full width on mobile, 2/3 width on desktop */}
          <div className="lg:col-span-8">
            {/* Mobile Key Details - Shown only on mobile */}
            <div className="lg:hidden mb-8 space-y-2 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <DollarSign className="h-4 w-4" />
                {formatSalary(jobData.salaryMin, jobData.salaryMax)}
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Briefcase className="h-4 w-4" />
                {jobData.experienceLevel}
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Clock className="h-4 w-4" />
                {formatDate(jobData.postedDate)}
              </div>
            </div>

            <div className="prose prose-gray dark:prose-invert max-w-none">
              <section className="mb-8 lg:mb-10">
                <h2 className="text-xl lg:text-2xl font-semibold mb-3 lg:mb-4 flex items-center gap-2">
                  <Building2 className="h-5 w-5 hidden lg:inline" />
                  About {jobData.company}
                </h2>
                <p className="text-muted-foreground leading-relaxed text-base">{jobData.companyDescription}</p>
              </section>

              <section className="mb-8 lg:mb-10">
                <h2 className="text-xl lg:text-2xl font-semibold mb-3 lg:mb-4">About the Role</h2>
                <p className="text-muted-foreground leading-relaxed text-base">{jobData.roleDescription}</p>
              </section>

              <section className="mb-8 lg:mb-10">
                <h2 className="text-xl lg:text-2xl font-semibold mb-3 lg:mb-4">What You'll Do</h2>
                <ul className="space-y-2 lg:space-y-3">
                  {jobData.responsibilities.map((item, i) => (
                    <li key={`resp-${i}`} className="flex items-start gap-2 lg:gap-3">
                      <CheckCircle className="h-4 w-4 lg:h-5 lg:w-5 text-green-500 mt-0.5 flex-shrink-0" />
                      <span className="text-muted-foreground text-sm lg:text-base">{item}</span>
                    </li>
                  ))}
                </ul>
              </section>

              <section className="mb-8 lg:mb-10">
                <h2 className="text-xl lg:text-2xl font-semibold mb-3 lg:mb-4">What We're Looking For</h2>
                <ul className="space-y-2 lg:space-y-3">
                  {jobData.requirements.map((item, i) => (
                    <li key={`req-${i}`} className="flex items-start gap-2 lg:gap-3">
                      <div className="h-1.5 w-1.5 rounded-full bg-primary mt-1.5 lg:mt-2 flex-shrink-0" />
                      <span className="text-muted-foreground text-sm lg:text-base">{item}</span>
                    </li>
                  ))}
                </ul>
              </section>

              <section className="mb-8 lg:mb-10">
                <h2 className="text-xl lg:text-2xl font-semibold mb-3 lg:mb-4">Nice to Have</h2>
                <ul className="space-y-2 lg:space-y-3">
                  {jobData.niceToHave.map((item, i) => (
                    <li key={`nice-${i}`} className="flex items-start gap-2 lg:gap-3">
                      <div className="h-1.5 w-1.5 rounded-full bg-muted-foreground/50 mt-1.5 lg:mt-2 flex-shrink-0" />
                      <span className="text-muted-foreground text-sm lg:text-base">{item}</span>
                    </li>
                  ))}
                </ul>
              </section>

              <section className="mb-8 lg:mb-10">
                <h2 className="text-xl lg:text-2xl font-semibold mb-4 lg:mb-6">Benefits & Perks</h2>
                <div className="space-y-3 lg:grid lg:grid-cols-2 lg:gap-4 lg:space-y-0">
                  {jobData.benefits.map((benefit, i) => (
                    <div key={`benefit-${i}`} className="flex gap-3 lg:gap-4 lg:p-4 lg:rounded-lg lg:border lg:bg-card">
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 lg:w-10 lg:h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                          <benefit.icon className="h-4 w-4 lg:h-5 lg:w-5 text-primary" />
                        </div>
                      </div>
                      <div>
                        <p className="font-medium text-sm lg:text-base lg:mb-1">{benefit.title}</p>
                        <p className="text-xs lg:text-sm text-muted-foreground">{benefit.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              {/* Desktop CTA - Hidden on mobile */}
              <section className="hidden lg:block mt-12 p-8 bg-muted/50 rounded-xl border">
                <h3 className="text-xl font-semibold mb-3">Ready to Apply?</h3>
                <p className="text-muted-foreground mb-6">
                  Join our team and help us build the future of technology. We can't wait to hear from you!
                </p>
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button variant="default" size="lg" onClick={handleApply}>
                    Apply Now
                  </Button>
                  <Button variant="outline" size="lg">
                    Refer Someone
                  </Button>
                </div>
              </section>

              {/* Mobile CTA - Shown only on mobile */}
              <section className="lg:hidden pt-8 border-t mt-8">
                <h3 className="text-lg font-semibold mb-2">Ready to Apply?</h3>
                <p className="text-muted-foreground text-sm mb-4">
                  Join our team and help build the future.
                </p>
                <Button variant="default" className="w-full" onClick={handleApply}>
                  Apply Now
                </Button>
              </section>

              <section className="mt-12">
                <h3 className="text-xl font-semibold mb-4">Similar Opportunities</h3>
                <div className="space-y-3">
                  <div className="p-4 border rounded-lg hover:border-primary/30 transition-colors cursor-pointer">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-medium mb-1">Frontend Engineer</h4>
                        <p className="text-sm text-muted-foreground">Engineering · Full-time · Remote</p>
                      </div>
                      <Badge variant="secondary" className="text-xs">
                        New
                      </Badge>
                    </div>
                  </div>
                  <div className="p-4 border rounded-lg hover:border-primary/30 transition-colors cursor-pointer">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-medium mb-1">Full Stack Developer</h4>
                        <p className="text-sm text-muted-foreground">Engineering · Full-time · Hybrid</p>
                      </div>
                      <Badge variant="secondary" className="text-xs">
                        2 days ago
                      </Badge>
                    </div>
                  </div>
                </div>
              </section>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}