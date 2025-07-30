import type * as React from 'react'

import { cn } from './lib/utils'

interface CardProps extends React.ComponentProps<'div'> {
  flat?: boolean
}

function Card({ className, flat, ...props }: CardProps) {
  return (
    <div
      data-slot='card'
      className={cn(
        'bg-background text-card-foreground flex flex-col gap-6 rounded-xl border py-6',
        flat ? '' : '',
        className
      )}
      {...props}
    />
  )
}
// function Card({ className, flat, ...props }: CardProps) {
//   return (
//     <div
//       data-slot='card'
//       className={cn(
//         'bg-card text-card-foreground flex flex-col gap-6 rounded-xl border py-6 shadow-sm',
//         flat ? '' : 'outline outline-offset-4',
//         className
//       )}
//       {...props}
//     />
//   )
// }

function CardHeader({ className, ...props }: React.ComponentProps<'div'>) {
  return <div data-slot='card-header' className={cn('flex flex-col gap-1.5 px-6', className)} {...props} />
}

function CardTitle({ className, ...props }: React.ComponentProps<'div'>) {
  return <div data-slot='card-title' className={cn('leading-none font-semibold', className)} {...props} />
}

function CardDescription({ className, ...props }: React.ComponentProps<'div'>) {
  return <div data-slot='card-description' className={cn('text-muted-foreground text-sm', className)} {...props} />
}

function CardContent({ className, ...props }: React.ComponentProps<'div'>) {
  return <div data-slot='card-content' className={cn('px-6', className)} {...props} />
}

function CardFooter({ className, ...props }: React.ComponentProps<'div'>) {
  return <div data-slot='card-footer' className={cn('flex items-center px-6', className)} {...props} />
}

export { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle }
