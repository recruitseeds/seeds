'use client'

import Link from 'next/link'
import { JobNavigation } from './job-navigation'

interface HeaderProps {
  onAuthRequired?: () => void
}

export function Header({ onAuthRequired }: HeaderProps) {
  return (
    <header className='border-b border-dashed bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50'>
      <div className='mx-auto px-4'>
        <div className='flex h-16 items-center justify-between'>
          <Link href='/' className='flex items-center space-x-2'>
            <div className='h-8 w-8 rounded-lg bg-brand flex items-center justify-center'>
              <span className='text-brand-foreground font-bold text-lg'>S</span>
            </div>
            <span className='font-bold text-xl hidden sm:block'>Seeds</span>
          </Link>

          <JobNavigation onAuthRequired={onAuthRequired} />
        </div>
      </div>
    </header>
  )
}
