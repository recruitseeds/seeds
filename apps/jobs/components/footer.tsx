'use client'

import { ThemeToggle } from './theme-toggle'

export function Footer() {
  return (
    <footer className='border-t border-border bg-background py-8'>
      <div className='container mx-auto px-4'>
        <div className='flex items-center justify-between'>
          <div className='flex items-center space-x-2'>
            <div className='h-6 w-6 rounded bg-brand flex items-center justify-center'>
              <span className='text-brand-foreground font-bold text-sm'>S</span>
            </div>
            <span className='font-semibold text-foreground'>Seeds</span>
          </div>
          
          <ThemeToggle />
        </div>
        
        <div className='mt-4 pt-4 border-t border-border text-center'>
          <p className='text-sm text-muted-foreground'>
            © 2024 Seeds. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}