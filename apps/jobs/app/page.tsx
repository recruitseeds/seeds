// 'use client'

// import { Button } from '@seeds/ui/button'
// import { useState } from 'react'
// import { Footer } from '../components/footer'
// import { Header } from '../components/header'
// import { HeroSection } from '../components/hero-section'
// import { JobsSection } from '../components/jobs-section'

// export default function HomePage() {
//   const [showAuthModal, setShowAuthModal] = useState(false)

//   const handleAuthRequired = () => {
//     setShowAuthModal(true)
//   }

//   return (
//     <div className='min-h-screen bg-background flex flex-col'>
//       <Header onAuthRequired={handleAuthRequired} />
//       <main className='flex-1'>
//         <HeroSection />
//         <JobsSection onAuthRequired={handleAuthRequired} />
//       </main>
//       <Footer />

//       {/* TODO: Add auth modal component */}
//       {showAuthModal && (
//         <div
//           className='fixed inset-0 bg-black/50 flex items-center justify-center z-50'
//           onClick={() => setShowAuthModal(false)}>
//           <div className='bg-background p-8 rounded-lg max-w-md w-full mx-4' onClick={(e) => e.stopPropagation()}>
//             <h2 className='text-2xl font-bold mb-4'>Sign in to continue</h2>
//             <p className='text-muted-foreground mb-6'>Create an account or sign in to save jobs and apply.</p>
//             <div className='space-y-3'>
//               <Button className='w-full px-4 py-2 bg-brand hover:bg-brand-hover text-brand-foreground rounded-lg font-medium transition-colors'>
//                 Create Account
//               </Button>
//               <Button className='w-full px-4 py-2 border border-border hover:bg-muted rounded-lg font-medium transition-colors'>
//                 Sign In
//               </Button>
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   )
// }
import { Button } from '@seeds/ui/button'
export default function HomePage() {
  return (
    <div>
      <Button>Click me</Button>
    </div>
  )
}
