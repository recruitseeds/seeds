'use client'

import { cn } from './lib/utils'
import * as TogglePrimitive from '@radix-ui/react-toggle'
import { cva, type VariantProps } from 'class-variance-authority'
import * as React from 'react'

const toggleVariants = cva(
  [
    
    'inline-flex items-center rounded-full transition-colors disabled:pointer-events-none disabled:opacity-50 relative',

    
    'focus:!outline-none focus:!ring-0 active:!outline-none active:!ring-0',

    
    'after:pointer-events-none after:absolute after:-inset-[3px] after:rounded-full after:border after:opacity-0 after:ring-2 after:ring-brand/20 after:transition-opacity focus-visible:after:opacity-100 active:after:opacity-0 after:border-brand',
  ],
  {
    variants: {
      variant: {
        default:
          'data-[state=off]:bg-secondary data-[state=off]:hover:bg-secondary-hover data-[state=on]:bg-brand data-[state=off]:dark:bg-neutral-800 data-[state=off]:dark:hover:bg-neutral-700 data-[state=on]:dark:bg-primary',
        outline:
          'border border-input bg-background data-[state=off]:hover:bg-accent data-[state=on]:bg-primary data-[state=on]:text-primary-foreground',
        ghost:
          'data-[state=off]:bg-transparent data-[state=off]:hover:bg-accent data-[state=on]:bg-primary data-[state=on]:text-primary-foreground',
      },
      size: {
        sm: 'h-3 w-6 px-0.5',
        default: 'h-5 w-9 px-0.5',
        lg: 'h-6 w-11 px-1',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
)

const toggleThumbVariants = cva(
  'pointer-events-none block rounded-full bg-white dark:bg-black transition-transform',
  {
    variants: {
      size: {
        sm: 'h-2 w-2 data-[state=on]:translate-x-3',
        default: 'h-4 w-4 data-[state=on]:translate-x-4',
        lg: 'h-5 w-5 data-[state=on]:translate-x-5',
      },
    },
    defaultVariants: {
      size: 'default',
    },
  }
)

export interface ToggleProps
  extends React.ComponentPropsWithoutRef<typeof TogglePrimitive.Root>,
    VariantProps<typeof toggleVariants> {
  thumbClassName?: string
}

const Toggle = React.forwardRef<
  React.ElementRef<typeof TogglePrimitive.Root>,
  ToggleProps
>(({ className, variant, size, thumbClassName, ...props }, ref) => {
  const isPressed = props.pressed !== undefined ? props.pressed : false

  return (
    <TogglePrimitive.Root
      ref={ref}
      className={cn(toggleVariants({ variant, size }), className)}
      data-state={isPressed ? 'on' : 'off'}
      role='switch'
      aria-checked={isPressed}
      {...props}>
      <span
        className={cn(
          toggleThumbVariants({ size }),
          'data-[state=off]:translate-x-0',
          thumbClassName
        )}
        data-state={isPressed ? 'on' : 'off'}
      />
    </TogglePrimitive.Root>
  )
})

Toggle.displayName = 'Toggle'

const LegacyToggle = ({
  active = false,
  onChange,
  size = 'default',
  variant = 'default',
  className,
  thumbClassName,
  ...props
}: {
  active?: boolean
  onChange: (active: boolean) => void
  size?: 'sm' | 'default' | 'lg'
  variant?: 'default' | 'outline' | 'ghost'
  className?: string
  thumbClassName?: string
} & Omit<
  React.ComponentPropsWithoutRef<typeof TogglePrimitive.Root>,
  'onChange' | 'pressed'
>) => {
  const mappedSize =
    size === 'sm' ? 'sm' : size === 'default' ? 'default' : 'lg'

  const handleChange = React.useCallback(() => {
    onChange(!active)
  }, [active, onChange])

  return (
    <Toggle
      pressed={active}
      onPressedChange={handleChange}
      size={mappedSize}
      variant={variant}
      className={className}
      thumbClassName={thumbClassName}
      {...props}
    />
  )
}

LegacyToggle.displayName = 'LegacyToggle'

export { LegacyToggle, Toggle, toggleThumbVariants, toggleVariants }
