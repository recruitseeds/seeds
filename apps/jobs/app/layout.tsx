import '@seeds/ui/styles.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { AuthProvider } from '../components/auth-provider'
import { Providers } from '../components/providers'
import { ThemeProvider } from '../components/theme-provider'
import { createClient } from '../lib/supabase/server'
import '../styles/globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Jobs - RecruitSeeds',
  description: 'Find your next opportunity with top companies',
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // Get server-side session to eliminate auth flash
  let initialSession = null
  let initialUser = null
  
  try {
    const supabase = await createClient()
    const { data: { session } } = await supabase.auth.getSession()
    initialSession = session
    initialUser = session?.user ?? null
  } catch (error) {
    // Continue without server session data - client will handle auth
    console.warn('Failed to get server session:', error)
  }

  return (
    <html lang='en' suppressHydrationWarning>
      <body className={`${inter.className} bg-background text-foreground antialiased`}>
        <Providers>
          <AuthProvider initialSession={initialSession} initialUser={initialUser} serverSideAuth={true}>
            <ThemeProvider attribute='class' defaultTheme='system' enableSystem disableTransitionOnChange>
              {children}
            </ThemeProvider>
          </AuthProvider>
        </Providers>
      </body>
    </html>
  )
}
