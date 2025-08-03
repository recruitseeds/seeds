'use client'

import { Button, buttonVariants } from '@seeds/ui/button'
import { Menu, X } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'

interface HeaderProps {
  onAuthRequired?: () => void
}

export function Header({ onAuthRequired }: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const handleSignIn = () => {
    if (onAuthRequired) {
      onAuthRequired()
    }
  }

  return (
    <header className='border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50'>
      <div className='container mx-auto px-4'>
        <div className='flex h-16 items-center justify-between'>
          {/* Logo */}
          <Link href='/' className='flex items-center space-x-2'>
            <div className='h-8 w-8 rounded-lg bg-brand flex items-center justify-center'>
              <span className='text-brand-foreground font-bold text-lg'>R</span>
            </div>
            <span className='font-bold text-xl hidden sm:block'>RecruitSeeds</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className='hidden md:flex items-center space-x-8'>
            <Link href='/browse' className='text-muted-foreground hover:text-foreground transition-colors'>
              Browse Jobs
            </Link>
            <Link href='/companies' className='text-muted-foreground hover:text-foreground transition-colors'>
              Companies
            </Link>
            <Link href='/about' className='text-muted-foreground hover:text-foreground transition-colors'>
              About
            </Link>
          </nav>

          {/* Desktop Auth Buttons */}
          <div className='hidden md:flex items-center space-x-4'>
            <button onClick={handleSignIn} className={buttonVariants({ variant: 'destructive' })}>
              Sign In
            </button>
            <Button onClick={handleSignIn} variant='secondary'>
              Get Started
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <Button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className='md:hidden p-2 rounded-lg hover:bg-muted transition-colors'>
            {mobileMenuOpen ? <X className='h-5 w-5' /> : <Menu className='h-5 w-5' />}
          </Button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className='md:hidden border-t border-border py-4'>
            <nav className='flex flex-col space-y-4'>
              <Link
                href='/browse'
                className='text-muted-foreground hover:text-foreground transition-colors'
                onClick={() => setMobileMenuOpen(false)}>
                Browse Jobs
              </Link>
              <Link
                href='/companies'
                className='text-muted-foreground hover:text-foreground transition-colors'
                onClick={() => setMobileMenuOpen(false)}>
                Companies
              </Link>
              <Link
                href='/about'
                className='text-muted-foreground hover:text-foreground transition-colors'
                onClick={() => setMobileMenuOpen(false)}>
                About
              </Link>
              <div className='flex flex-col space-y-2 pt-4 border-t border-border'>
                <Button onClick={handleSignIn}>Sign In</Button>
                <Button onClick={handleSignIn}>Get Started</Button>
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  )
}
