'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

import { cn } from '@seeds/ui/lib/utils'
import { buttonVariants } from '../ui/button'

interface SidebarNavProps extends React.HTMLAttributes<HTMLElement> {
  items: {
    href: string
    title: string
  }[]
}

export function SidebarNav({ className, items, ...props }: SidebarNavProps) {
  const pathname = usePathname()

  return (
    <nav
      className={cn(
        'flex gap-2 lg:flex-col lg:space-x-0 lg:space-y-1',
        className
      )}
      {...props}>
      {items.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={cn(
            buttonVariants({ variant: 'ghost' }),
            pathname === item.href
              ? 'bg-muted hover:bg-muted active:bg-muted'
              : 'hover:bg-transparent hover:underline active:bg-transparent',
            'justify-start relative',
            'focus:!outline-none focus:!ring-0 active:!outline-none active:!ring-0',
            'focus-visible:after:opacity-100 active:after:opacity-0',
            'after:pointer-events-none after:absolute after:-inset-[3px] after:border after:opacity-0 after:ring-2 after:ring-brand/20 after:transition-opacity after:border-brand after:rounded-lg'
          )}>
          {item.title}
        </Link>
      ))}
    </nav>
  )
}
