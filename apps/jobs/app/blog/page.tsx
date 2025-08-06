import { Header } from '../../components/header'
import Link from 'next/link'

const blogPosts = [
  {
    id: '1',
    title: 'The Future of AI in Recruiting',
    excerpt: 'How artificial intelligence is transforming the way companies find and hire talent.',
    author: 'Sarah Johnson',
    date: 'January 15, 2024',
    readTime: '5 min read',
    category: 'AI & Technology',
  },
  {
    id: '2',
    title: 'Building Inclusive Hiring Practices',
    excerpt: 'Best practices for creating a diverse and inclusive recruitment process.',
    author: 'Michael Chen',
    date: 'January 10, 2024',
    readTime: '7 min read',
    category: 'Best Practices',
  },
  {
    id: '3',
    title: 'Remote Hiring: Tips and Strategies',
    excerpt: 'Everything you need to know about hiring remote employees effectively.',
    author: 'Emily Davis',
    date: 'January 5, 2024',
    readTime: '6 min read',
    category: 'Remote Work',
  },
  {
    id: '4',
    title: 'Optimizing Your Job Descriptions',
    excerpt: 'How to write job descriptions that attract the right candidates.',
    author: 'David Wilson',
    date: 'December 28, 2023',
    readTime: '4 min read',
    category: 'Recruitment Tips',
  },
]

export default function BlogPage() {
  return (
    <div className='min-h-screen bg-background'>
      <Header />
      
      <main className='container mx-auto px-4 py-16'>
        <div className='max-w-6xl mx-auto'>
          <div className='mb-12'>
            <h1 className='text-4xl font-bold mb-4'>Blog</h1>
            <p className='text-muted-foreground text-lg'>
              Insights, tips, and best practices for modern recruiting
            </p>
          </div>

          <div className='grid gap-8 md:grid-cols-2 lg:grid-cols-3'>
            {blogPosts.map((post) => (
              <article key={post.id} className='group cursor-pointer'>
                <Link href={`/blog/${post.id}`}>
                  <div className='space-y-3'>
                    <div className='aspect-video bg-muted rounded-lg' />
                    
                    <div className='space-y-2'>
                      <div className='flex items-center gap-2 text-xs text-muted-foreground'>
                        <span className='px-2 py-1 bg-muted rounded-md'>{post.category}</span>
                        <span>{post.readTime}</span>
                      </div>
                      
                      <h2 className='text-xl font-semibold group-hover:text-primary transition-colors'>
                        {post.title}
                      </h2>
                      
                      <p className='text-muted-foreground line-clamp-2'>
                        {post.excerpt}
                      </p>
                      
                      <div className='flex items-center justify-between pt-2'>
                        <span className='text-sm text-muted-foreground'>{post.author}</span>
                        <span className='text-sm text-muted-foreground'>{post.date}</span>
                      </div>
                    </div>
                  </div>
                </Link>
              </article>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}