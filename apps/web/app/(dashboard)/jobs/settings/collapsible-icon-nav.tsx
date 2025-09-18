'use client'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { FileText, GitBranch, Mail, MapPin, Settings } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'

const navItems = [
  {
    title: 'General',
    href: '/jobs/settings',
    icon: Settings,
  },
  {
    title: 'Location Templates',
    href: '/jobs/settings/locations',
    icon: MapPin,
  },
  {
    title: 'Pipeline Defaults',
    href: '/jobs/settings/pipelines',
    icon: GitBranch,
  },
  {
    title: 'Email Templates',
    href: '/jobs/settings/emails',
    icon: Mail,
  },
  {
    title: 'Application Form',
    href: '/jobs/settings/application',
    icon: FileText,
  },
]

export function CollapsibleIconNav() {
  const [isExpanded, setIsExpanded] = useState(false)
  const pathname = usePathname()

  useEffect(() => {
    if (isExpanded) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }

    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isExpanded])

  return (
    <div className='relative h-full'>
      <div className='flex flex-col gap-2 p-2 border-r border-dashed bg-background w-14 h-full'>
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href || (
            item.href !== '/jobs/settings' && pathname.startsWith(`${item.href}/`)
          )

          return (
            <Link key={item.href} href={item.href} onMouseEnter={() => setIsExpanded(true)}>
              <Button variant={isActive ? 'secondary' : 'ghost'} size='icon' className='size-10' title={item.title}>
                <Icon className='size-4' />
              </Button>
            </Link>
          )
        })}
      </div>

      {isExpanded && (
        <>
          {/* <div className='fixed inset-0 z-40 bg-black/20' onClick={() => setIsExpanded(false)} /> */}

          <nav
            className={cn(
              'absolute left-0 top-0 z-50 h-full w-64 border-r border-dashed bg-background shadow-lg',
              'transition-all duration-200 ease-in-out'
            )}
            onMouseLeave={() => setIsExpanded(false)}>
            <div className='flex flex-col gap-2 p-2'>
              {navItems.map((item) => {
                const Icon = item.icon
                const isActive = pathname === item.href || (
            item.href !== '/jobs/settings' && pathname.startsWith(`${item.href}/`)
          )

                return (
                  <Link key={item.href} href={item.href} onClick={() => setIsExpanded(false)}>
                    <Button variant={isActive ? 'secondary' : 'ghost'} className='w-full h-10 p-0 justify-start'>
                      <div className='size-10 flex items-center justify-center flex-shrink-0'>
                        <Icon className='size-4' />
                      </div>
                      <span className='pr-2'>{item.title}</span>
                    </Button>
                  </Link>
                )
              })}
            </div>
          </nav>
        </>
      )}
    </div>
  )
}
