import { Header } from '../../../../components/header'
import { Button } from '@seeds/ui/button'
import { Badge } from '@seeds/ui/badge'
import { MapPin, Users, Calendar, Globe, Play } from 'lucide-react'
import Link from 'next/link'

interface CompanyProfilePageProps {
  params: Promise<{
    companySlug: string
  }>
}

// Mock data - replace with API call
const mockCompanyProfiles = {
  techcorp: {
    name: 'TechCorp',
    slug: 'techcorp',
    tagline: 'Building the future of technology',
    description: 'TechCorp is a leading technology company focused on creating innovative solutions that transform how businesses operate. With over 500 employees across 3 offices, we are committed to excellence and innovation.',
    founded: '2015',
    size: '500-1000 employees',
    locations: ['San Francisco, CA', 'New York, NY', 'Austin, TX'],
    website: 'https://techcorp.example.com',
    industry: 'Technology',
    values: [
      { title: 'Innovation', description: 'We push boundaries and think outside the box' },
      { title: 'Collaboration', description: 'We work together to achieve great things' },
      { title: 'Integrity', description: 'We do the right thing, always' },
      { title: 'Excellence', description: 'We strive for the highest quality in everything' },
    ],
    benefits: [
      'Health, dental, and vision insurance',
      'Unlimited PTO',
      '$2,500 annual learning budget',
      '401(k) with 6% match',
      'Flexible work arrangements',
      'Free lunch and snacks',
    ],
    culture: {
      description: 'At TechCorp, we foster a culture of innovation, collaboration, and continuous learning. Our diverse team brings together brilliant minds from around the world.',
      photos: [
        { url: '/placeholder1.jpg', caption: 'Our modern office space' },
        { url: '/placeholder2.jpg', caption: 'Team hackathon event' },
        { url: '/placeholder3.jpg', caption: 'Company retreat 2023' },
        { url: '/placeholder4.jpg', caption: 'Holiday party' },
      ],
    },
    testimonials: [
      {
        name: 'Sarah Johnson',
        role: 'Senior Engineer',
        content: 'TechCorp has been an amazing place to grow my career. The opportunities for learning and the supportive team make it truly special.',
        avatar: '/avatar1.jpg',
      },
      {
        name: 'Michael Chen',
        role: 'Product Manager',
        content: 'The culture here is unmatched. We truly care about making a difference and supporting each other along the way.',
        avatar: '/avatar2.jpg',
      },
    ],
    videos: [
      { title: 'Day in the Life at TechCorp', url: 'https://youtube.com/example', thumbnail: '/video1.jpg' },
      { title: 'Meet Our Team', url: 'https://youtube.com/example', thumbnail: '/video2.jpg' },
    ],
    openPositions: 12,
  },
}

export default async function CompanyProfilePage({ params }: CompanyProfilePageProps) {
  const { companySlug } = await params
  const company = mockCompanyProfiles[companySlug as keyof typeof mockCompanyProfiles] || mockCompanyProfiles.techcorp

  return (
    <div className='min-h-screen bg-background'>
      <Header />
      
      {/* Hero Section */}
      <section className='relative bg-gradient-to-b from-muted/50 to-background'>
        <div className='container mx-auto px-4 py-20'>
          <div className='max-w-4xl'>
            <h1 className='text-5xl font-bold mb-4'>{company.name}</h1>
            <p className='text-2xl text-muted-foreground mb-6'>{company.tagline}</p>
            <div className='flex flex-wrap gap-4 mb-8'>
              <Badge variant='secondary' className='px-3 py-1'>
                <Users className='w-4 h-4 mr-2' />
                {company.size}
              </Badge>
              <Badge variant='secondary' className='px-3 py-1'>
                <Calendar className='w-4 h-4 mr-2' />
                Founded {company.founded}
              </Badge>
              <Badge variant='secondary' className='px-3 py-1'>
                <MapPin className='w-4 h-4 mr-2' />
                {company.locations.length} offices
              </Badge>
              <Badge variant='secondary' className='px-3 py-1'>
                <Globe className='w-4 h-4 mr-2' />
                {company.industry}
              </Badge>
            </div>
            <Link href={`/companies/${companySlug}/browse`}>
              <Button size='lg'>View {company.openPositions} Open Positions</Button>
            </Link>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section className='container mx-auto px-4 py-16'>
        <div className='max-w-4xl'>
          <h2 className='text-3xl font-bold mb-6'>About {company.name}</h2>
          <p className='text-lg text-muted-foreground'>{company.description}</p>
        </div>
      </section>

      {/* Values Section */}
      <section className='bg-muted/30'>
        <div className='container mx-auto px-4 py-16'>
          <div className='max-w-6xl mx-auto'>
            <h2 className='text-3xl font-bold mb-8'>Our Values</h2>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
              {company.values.map((value, index) => (
                <div key={index} className='bg-background p-6 rounded-lg'>
                  <h3 className='text-xl font-semibold mb-2'>{value.title}</h3>
                  <p className='text-muted-foreground'>{value.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Culture Section */}
      <section className='container mx-auto px-4 py-16'>
        <div className='max-w-6xl mx-auto'>
          <h2 className='text-3xl font-bold mb-6'>Our Culture</h2>
          <p className='text-lg text-muted-foreground mb-8'>{company.culture.description}</p>
          
          {/* Photo Gallery */}
          <div className='grid grid-cols-2 md:grid-cols-4 gap-4 mb-12'>
            {company.culture.photos.map((photo, index) => (
              <div key={index} className='aspect-square bg-muted rounded-lg overflow-hidden'>
                <div className='w-full h-full flex items-center justify-center text-muted-foreground'>
                  [Photo]
                </div>
              </div>
            ))}
          </div>

          {/* Videos */}
          {company.videos.length > 0 && (
            <div className='space-y-4'>
              <h3 className='text-2xl font-semibold mb-4'>Videos</h3>
              <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                {company.videos.map((video, index) => (
                  <div key={index} className='relative aspect-video bg-muted rounded-lg overflow-hidden group cursor-pointer'>
                    <div className='absolute inset-0 flex items-center justify-center'>
                      <div className='w-16 h-16 bg-background/80 rounded-full flex items-center justify-center group-hover:bg-background transition-colors'>
                        <Play className='w-8 h-8 text-foreground ml-1' />
                      </div>
                    </div>
                    <div className='absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/60 to-transparent'>
                      <p className='text-white font-medium'>{video.title}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Testimonials */}
      <section className='bg-muted/30'>
        <div className='container mx-auto px-4 py-16'>
          <div className='max-w-6xl mx-auto'>
            <h2 className='text-3xl font-bold mb-8'>What Our Team Says</h2>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-8'>
              {company.testimonials.map((testimonial, index) => (
                <div key={index} className='bg-background p-6 rounded-lg'>
                  <p className='text-lg mb-4 italic'>"{testimonial.content}"</p>
                  <div className='flex items-center gap-3'>
                    <div className='w-12 h-12 bg-muted rounded-full' />
                    <div>
                      <p className='font-semibold'>{testimonial.name}</p>
                      <p className='text-sm text-muted-foreground'>{testimonial.role}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className='container mx-auto px-4 py-16'>
        <div className='max-w-4xl mx-auto'>
          <h2 className='text-3xl font-bold mb-8'>Benefits & Perks</h2>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            {company.benefits.map((benefit, index) => (
              <div key={index} className='flex gap-3'>
                <div className='h-1.5 w-1.5 rounded-full bg-foreground mt-2 shrink-0' />
                <span className='text-lg text-muted-foreground'>{benefit}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className='bg-muted/30'>
        <div className='container mx-auto px-4 py-16 text-center'>
          <h2 className='text-3xl font-bold mb-4'>Ready to Join Our Team?</h2>
          <p className='text-lg text-muted-foreground mb-8'>
            Explore our open positions and find your next career opportunity
          </p>
          <Link href={`/companies/${companySlug}/browse`}>
            <Button size='lg'>View Open Positions</Button>
          </Link>
        </div>
      </section>
    </div>
  )
}