import { CheckCircle, ChevronLeft, Coffee, DollarSign, GraduationCap, Heart, Home, Shield } from 'lucide-react'
import Link from 'next/link'
import { Header } from '../../../components/header'
import { ApplicationForm } from './application-form'
import { ApplyButtons } from './apply-buttons'

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

export default async function JobPage({ params }: JobPageProps) {
  const { orgSlug, jobId } = await params

  return (
    <div className='min-h-screen bg-background'>
      <Header />

      <div className='container mx-auto px-4 py-4'>
        <Link
          href={`/${orgSlug}`}
          className='inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors'>
          <ChevronLeft className='h-4 w-4' />
          <span>Back to all jobs</span>
        </Link>
      </div>

      <div className='container mx-auto px-4 pb-8'>
        <div className='job-layout-container'>
          <aside className='job-layout-sidebar'>
            <div className='job-layout-sidebar-inner'>
              <div className='p-6 space-y-6'>
                <div>
                  <p className='text-muted-foreground text-sm mb-2'>
                    {jobData.department} · {jobData.employmentType} ({jobData.location})
                  </p>
                  <h1 className='text-2xl font-bold mb-4'>{jobData.title}</h1>
                  <p className='text-lg text-muted-foreground'>{jobData.company}</p>
                </div>

                <ApplyButtons />

                {/* Job details temporarily commented out */}
                {/* <div className='space-y-3 pt-6 border-t'>
                  <div className='flex items-center justify-between'>
                    <span className='text-muted-foreground text-sm'>Location</span>
                    <span className='font-medium text-sm'>{jobData.location}</span>
                  </div>
                  <div className='flex items-center justify-between'>
                    <span className='text-muted-foreground text-sm'>Salary Range</span>
                    <span className='font-medium text-sm'>{formatSalary(jobData.salaryMin, jobData.salaryMax)}</span>
                  </div>
                  <div className='flex items-center justify-between'>
                    <span className='text-muted-foreground text-sm'>Experience</span>
                    <span className='font-medium text-sm'>{jobData.experienceLevel}</span>
                  </div>
                  <div className='flex items-center justify-between'>
                    <span className='text-muted-foreground text-sm'>Work Type</span>
                    <span className='font-medium text-sm'>{jobData.remote}</span>
                  </div>
                </div> */}

                {/* <div className='pt-6 border-t'>
                  <h3 className='font-semibold mb-3 text-sm'>Required Skills</h3>
                  <div className='flex flex-wrap gap-2'>
                    {jobData.skills.map((skill, index) => (
                      <Badge key={index} variant='secondary' className='text-xs'>
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div> */}
              </div>
            </div>
          </aside>

          <main className='job-layout-main'>
            <div className='prose prose-neutral dark:prose-invert max-w-none'>
              <section className='mb-8'>
                <h2 className='text-xl font-semibold mb-4'>About {jobData.company}</h2>
                <p className='text-muted-foreground'>{jobData.companyDescription}</p>
              </section>

              <section className='mb-8'>
                <h2 className='text-xl font-semibold mb-4'>Role Overview</h2>
                <p className='text-muted-foreground'>{jobData.roleDescription}</p>
              </section>

              <section className='mb-8'>
                <h2 className='text-xl font-semibold mb-4'>What you'll do</h2>
                <ul className='space-y-3'>
                  {jobData.responsibilities.map((item, index) => (
                    <li key={index} className='flex gap-3'>
                      <CheckCircle className='h-5 w-5 text-primary mt-0.5 shrink-0' />
                      <span className='text-muted-foreground'>{item}</span>
                    </li>
                  ))}
                </ul>
              </section>

              <section className='mb-8'>
                <h2 className='text-xl font-semibold mb-4'>What we're looking for</h2>
                <ul className='space-y-3'>
                  {jobData.requirements.map((item, index) => (
                    <li key={index} className='flex gap-3'>
                      <CheckCircle className='h-5 w-5 text-primary mt-0.5 shrink-0' />
                      <span className='text-muted-foreground'>{item}</span>
                    </li>
                  ))}
                </ul>
              </section>

              <section className='mb-8'>
                <h2 className='text-xl font-semibold mb-4'>Nice to have</h2>
                <ul className='space-y-3'>
                  {jobData.niceToHave.map((item, index) => (
                    <li key={index} className='flex gap-3'>
                      <div className='h-5 w-5 rounded-full border-2 border-muted-foreground/30 mt-0.5 shrink-0' />
                      <span className='text-muted-foreground'>{item}</span>
                    </li>
                  ))}
                </ul>
              </section>

              <section className='mb-8'>
                <h2 className='text-xl font-semibold mb-4'>Benefits & Perks</h2>
                <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
                  {jobData.benefits.map((benefit, index) => {
                    const Icon = benefit.icon
                    return (
                      <div key={index} className='flex gap-3 p-4 rounded-lg border bg-card'>
                        <Icon className='h-5 w-5 text-primary mt-0.5 shrink-0' />
                        <div>
                          <div className='font-medium mb-1'>{benefit.title}</div>
                          <div className='text-sm text-muted-foreground'>{benefit.description}</div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </section>

              <section id='apply' className='mt-16 scroll-mt-24'>
                <div className='border rounded-lg p-8'>
                  <h2 className='text-2xl font-semibold mb-2'>Apply for this position</h2>
                  <p className='text-muted-foreground mb-8'>
                    Fill out the form below and we'll get back to you as soon as possible.
                  </p>
                  <ApplicationForm />
                </div>
              </section>
            </div>
          </main>
        </div>
      </div>
    </div>
  )
}
