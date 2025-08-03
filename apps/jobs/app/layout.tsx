import '@seeds/tailwind/globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Jobs - RecruitSeeds',
  description: 'Find your next opportunity with top companies',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang='en'>
      <body className={inter.className}>
        <main className='min-h-screen bg-background text-foreground'>{children}</main>
      </body>
    </html>
  )
}
