'use client'

import { ThemeProvider } from '@/components/theme-provider'
import { TRPCReactProvider } from '@/trpc/client'
import type { ReactNode } from 'react'

type ProviderProps = {
  children: ReactNode
}

export function Providers({ children }: ProviderProps) {
  return (
    <TRPCReactProvider>
      <ThemeProvider
        attribute='class'
        defaultTheme='system'
        enableSystem
        disableTransitionOnChange>
        {children}
      </ThemeProvider>
    </TRPCReactProvider>
  )
}
