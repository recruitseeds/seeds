'use client'

import { Button, buttonVariants } from '@seeds/ui/button'
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from '@seeds/ui/navigation-menu'
import { Sheet, SheetContent, SheetTrigger } from '@seeds/ui/sheet'
import { Menu } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'

interface JobNavigationProps {
  onAuthRequired?: () => void
}

export function JobNavigation({ onAuthRequired }: JobNavigationProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const handleSignIn = () => {
    if (onAuthRequired) {
      onAuthRequired()
    }
  }

  return (
    <>
      <NavigationMenu className='hidden md:flex' viewport={false}>
        <NavigationMenuList>
          <NavigationMenuItem>
            <Link href='/browse' legacyBehavior passHref>
              <NavigationMenuLink className={buttonVariants({ variant: 'ghost' })}>Browse Jobs</NavigationMenuLink>
            </Link>
          </NavigationMenuItem>

          <NavigationMenuItem>
            <Link href='/companies' legacyBehavior passHref>
              <NavigationMenuLink className={buttonVariants({ variant: 'ghost' })}>Companies</NavigationMenuLink>
            </Link>
          </NavigationMenuItem>

          <NavigationMenuItem>
            <NavigationMenuTrigger className={buttonVariants({ variant: 'ghost' })}>About</NavigationMenuTrigger>
            <NavigationMenuContent className='!rounded-xl'>
              <ul className='grid w-[250px] gap-2'>
                <li>
                  <NavigationMenuLink asChild>
                    <Link
                      href='/blog'
                      className='block select-none space-y-1 !rounded-lg leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground hover:shadow-[inset_0px_0px_0px_0.5px_rgb(255_255_255_/_0.02),inset_0px_0.5px_0px_rgb(255_255_255_/_0.04),_inset_0px_0px_0px_1px_rgb(255_255_255_/_0.02),_0px_0px_0px_0.5px_rgb(0_0_0_/_0.24)]'>
                      <div className='text-sm font-medium leading-none'>Blog</div>
                      <p className='line-clamp-2 text-sm leading-snug text-muted-foreground'>
                        Career tips and insights
                      </p>
                    </Link>
                  </NavigationMenuLink>
                </li>
                <li>
                  <NavigationMenuLink asChild>
                    <Link
                      href='/about'
                      className='block select-none space-y-1 !rounded-lg leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground hover:shadow-[inset_0px_0px_0px_0.5px_rgb(255_255_255_/_0.02),inset_0px_0.5px_0px_rgb(255_255_255_/_0.04),_inset_0px_0px_0px_1px_rgb(255_255_255_/_0.02),_0px_0px_0px_0.5px_rgb(0_0_0_/_0.24)]'>
                      <div className='text-sm font-medium leading-none'>About</div>
                      <p className='line-clamp-2 text-sm leading-snug text-muted-foreground'>Learn more about Seeds</p>
                    </Link>
                  </NavigationMenuLink>
                </li>
              </ul>
            </NavigationMenuContent>
          </NavigationMenuItem>
        </NavigationMenuList>
      </NavigationMenu>

      <div className='hidden md:flex items-center space-x-4'>
        <Button onClick={handleSignIn} variant='ghost' size='sm'>
          Sign In
        </Button>
        <Button onClick={handleSignIn} variant='default' size='sm'>
          Get Started
        </Button>
      </div>

      <div className='md:hidden'>
        <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
          <SheetTrigger asChild>
            <Button variant='ghost' size='icon' className='size-7'>
              <Menu />
            </Button>
          </SheetTrigger>
          <SheetContent side='right'>
            <div className='flex flex-col space-y-6 mt-6'>
              <nav className='flex flex-col space-y-4'>
                <Link
                  href='/browse'
                  className='hover:text-foreground text-foreground/90 transition-colors py-2'
                  onClick={() => setMobileMenuOpen(false)}>
                  Browse Jobs
                </Link>
                <Link
                  href='/companies'
                  className='hover:text-foreground text-foreground/90 transition-colors py-2'
                  onClick={() => setMobileMenuOpen(false)}>
                  Companies
                </Link>
                <Link
                  href='/about'
                  className='hover:text-foreground text-foreground/90 transition-colors py-2'
                  onClick={() => setMobileMenuOpen(false)}>
                  About
                </Link>
                <Link
                  href='/blog'
                  className='hover:text-foreground text-foreground/90 transition-colors py-2'
                  onClick={() => setMobileMenuOpen(false)}>
                  Blog
                </Link>
              </nav>

              <div className='flex flex-col space-y-3 pt-6 border-t border-border'>
                <Button
                  onClick={() => {
                    handleSignIn()
                    setMobileMenuOpen(false)
                  }}
                  variant='default'>
                  Get Started
                </Button>
                <Button
                  onClick={() => {
                    handleSignIn()
                    setMobileMenuOpen(false)
                  }}
                  variant='secondary'>
                  Sign In
                </Button>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </>
  )
}
