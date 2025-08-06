import '@seeds/ui/styles.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { AuthProvider } from '../components/auth-provider'
import { Providers } from '../components/providers'
import { ThemeProvider } from '../components/theme-provider'
import '../styles/globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Jobs - RecruitSeeds',
  description: 'Find your next opportunity with top companies',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang='en' suppressHydrationWarning>
      <body className={`${inter.className} bg-background text-foreground antialiased`}>
        <Providers>
          <AuthProvider>
            <ThemeProvider attribute='class' defaultTheme='system' enableSystem disableTransitionOnChange>
              {children}
            </ThemeProvider>
          </AuthProvider>
        </Providers>
      </body>
    </html>
  )
}
