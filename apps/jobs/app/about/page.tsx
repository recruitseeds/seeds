import { Header } from '../../components/header'

export default function AboutPage() {
  return (
    <div className='min-h-screen bg-background'>
      <Header />
      
      <main className='container mx-auto px-4 py-16'>
        <div className='max-w-4xl mx-auto'>
          <h1 className='text-4xl font-bold mb-8'>About RecruitSeeds</h1>
          
          <div className='prose prose-neutral dark:prose-invert max-w-none space-y-6'>
            <section>
              <h2 className='text-2xl font-semibold mb-4'>Our Mission</h2>
              <p className='text-muted-foreground mb-4'>
                RecruitSeeds is revolutionizing the hiring process with AI-powered resume parsing and skill matching. 
                We help companies find the best talent faster while providing candidates with a seamless application experience.
              </p>
            </section>

            <section>
              <h2 className='text-2xl font-semibold mb-4'>Why RecruitSeeds?</h2>
              <ul className='space-y-3'>
                <li className='flex gap-3'>
                  <div className='h-1.5 w-1.5 rounded-full bg-foreground mt-2 shrink-0' />
                  <span className='text-muted-foreground'>Advanced AI-powered resume parsing and scoring</span>
                </li>
                <li className='flex gap-3'>
                  <div className='h-1.5 w-1.5 rounded-full bg-foreground mt-2 shrink-0' />
                  <span className='text-muted-foreground'>Automated candidate screening and ranking</span>
                </li>
                <li className='flex gap-3'>
                  <div className='h-1.5 w-1.5 rounded-full bg-foreground mt-2 shrink-0' />
                  <span className='text-muted-foreground'>Customizable hiring pipelines for every company</span>
                </li>
                <li className='flex gap-3'>
                  <div className='h-1.5 w-1.5 rounded-full bg-foreground mt-2 shrink-0' />
                  <span className='text-muted-foreground'>Beautiful, branded job boards that convert</span>
                </li>
              </ul>
            </section>

            <section>
              <h2 className='text-2xl font-semibold mb-4'>Get Started</h2>
              <p className='text-muted-foreground'>
                Ready to transform your hiring process? Contact us to learn more about how RecruitSeeds can help you find and hire the best talent.
              </p>
            </section>
          </div>
        </div>
      </main>
    </div>
  )
}