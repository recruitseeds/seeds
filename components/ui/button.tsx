'use client'

import { cn } from '@/lib/utils'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import * as React from 'react'

const buttonVariants = cva(
  [
    'inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium',
    'disabled:pointer-events-none disabled:opacity-50',
    "[&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 [&_svg]:shrink-0",
    'cursor-pointer relative select-none transform-gpu',
    'focus:!outline-none focus:!ring-0 active:!outline-none active:!ring-0',
    'after:pointer-events-none after:absolute after:-inset-[3px] after:border after:opacity-0 after:ring-2 after:ring-brand/20 after:transition-opacity focus-visible:after:opacity-100 active:after:opacity-0 after:border-brand',
    // Remove the fixed after:rounded style to allow dynamic application
    'before:pointer-events-none before:absolute before:inset-0 before:z-[1] before:opacity-0 before:transition-opacity before:bg-gradient-to-b before:from-white/[0.12]',
  ],
  {
    variants: {
      variant: {
        default: [
          'bg-primary text-primary-foreground hover:bg-[var(--primary-hover)] active:bg-primary-active',
        ],
        destructive: [
          'bg-destructive text-destructive-foreground',
          'hover:before:opacity-100 active:before:opacity-30',
        ],
        outline: [
          'border border-input bg-background shadow-xs',
          'hover:bg-secondary hover:text-secondary-foreground',
          'active:bg-secondary-active',
        ],
        secondary: [
          'bg-secondary text-secondary-foreground',
          'hover:bg-secondary-hover active:bg-secondary-active',
        ],
        ghost: [
          'bg-transparent',
          'hover:bg-secondary hover:text-accent-foreground',
          'active:bg-secondary-active',
        ],
        link: [
          'text-primary bg-transparent p-0 h-auto',
          'underline-offset-4 hover:underline',
        ],
        brand: [
          'bg-brand text-brand-foreground',
          'hover:before:opacity-100 active:bg-brand-active',
          'shadow-shadow-accent',
        ],
      },
      size: {
        default: ['h-7.5 text-[14.01px] rounded-md px-2.5'],
        sm: ['h-6.5 text-[13.01px] rounded-md px-2'],
        lg: ['px-4.5 h-10 py-3 text-[15.01px] rounded-md'],
        icon: ['size-9 p-0 rounded-md'],
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
)

const buttonActiveVariants = cva('', {
  variants: {
    variant: {
      default: ['bg-primary/90 text-background', 'before:opacity-0'],
      destructive: [
        'bg-destructive/90 text-destructive-foreground',
        'before:opacity-0',
      ],
      outline: [
        'bg-secondary-active text-secondary-foreground',
        'border border-input',
      ],
      secondary: ['bg-secondary-active text-secondary-foreground'],
      ghost: ['bg-secondary-active text-accent-foreground'],
      link: ['text-primary underline'],
      brand: ['bg-brand-active text-brand-foreground', 'before:opacity-0'],
    },
  },
  defaultVariants: {
    variant: 'default',
  },
})

interface ButtonProps
  extends React.ComponentProps<'button'>,
    VariantProps<typeof buttonVariants> {
  active?: boolean
  activeClassName?: string
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      active = false,
      activeClassName,
      asChild = false,
      ...props
    },
    ref
  ) => {
    const Comp = asChild ? Slot : 'button'

    // Function to extract the border radius from className
    const getButtonRadius = (className: string = '') => {
      if (className.includes('rounded-full')) return 'rounded-full'
      if (className.includes('rounded-xl')) return 'rounded-xl'
      if (className.includes('rounded-lg')) return 'rounded-lg'
      if (className.includes('rounded-md')) return 'rounded-md'
      if (className.includes('rounded-sm')) return 'rounded-sm'
      if (className.includes('rounded-none')) return 'rounded-none'

      // Default radius based on size
      if (size) {
        // All sizes use rounded-md by default in your original code
        return 'rounded-md'
      }

      return 'rounded-md' // Default fallback
    }

    // Get the appropriate radius for both the button and its focus state
    const buttonRadius = getButtonRadius(className)

    return (
      <Comp
        ref={ref}
        data-slot='button'
        data-state={active ? 'active' : 'inactive'}
        style={
          {
            '--button-radius':
              buttonRadius === 'rounded-none'
                ? '0'
                : buttonRadius === 'rounded-sm'
                ? '0.125rem'
                : buttonRadius === 'rounded-md'
                ? '9px'
                : buttonRadius === 'rounded-lg'
                ? '0.5rem'
                : buttonRadius === 'rounded-xl'
                ? '0.75rem'
                : buttonRadius === 'rounded-full'
                ? '9999px'
                : '0.375rem',
          } as React.CSSProperties
        }
        className={cn(
          buttonVariants({ variant, size }),
          active && buttonActiveVariants({ variant }),
          active && activeClassName,
          'after:rounded-[var(--button-radius)]',
          'before:rounded-[var(--button-radius)]',
          className
        )}
        {...props}
      />
    )
  }
)

Button.displayName = 'Button'

export { Button, buttonVariants }
