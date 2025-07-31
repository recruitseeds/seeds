import { cn } from './ui/lib/utils'

export function Container({
  children,
  className,
  fullWidth = false,
}: {
  children: React.ReactNode
  className?: string
  fullWidth?: boolean
}) {
  return (
    <div
      className={cn(
        'w-full px-4 sm:px-6 lg:px-8',
        fullWidth ? 'max-w-full' : 'container mx-auto',
        className
      )}>
      {children}
    </div>
  )
}
