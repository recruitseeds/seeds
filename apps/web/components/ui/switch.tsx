'use client'
import { cn } from '@seeds/ui/lib/utils'
import * as SwitchPrimitive from '@radix-ui/react-switch'
import * as React from 'react'

function Switch({
  className,
  ...props
}: React.ComponentProps<typeof SwitchPrimitive.Root>) {
  return (
    <SwitchPrimitive.Root
      data-slot='switch'
      className={cn(
        'peer data-[state=checked]:bg-brand data-[state=unchecked]:bg-input inline-flex h-5 w-9 shrink-0 items-center rounded-full border-2 border-transparent shadow-xs transition-all outline-none disabled:cursor-not-allowed disabled:opacity-50',
        'relative',
        'after:pointer-events-none after:absolute after:-inset-[5px] after:rounded-full after:border after:opacity-0 after:ring-2 after:ring-brand/20 after:transition-opacity focus-visible:after:opacity-100 active:after:opacity-0 after:border-brand',
        className
      )}
      {...props}>
      <SwitchPrimitive.Thumb
        data-slot='switch-thumb'
        className={cn(
          'bg-background pointer-events-none block size-4 rounded-full ring-0 shadow-lg transition-transform data-[state=checked]:translate-x-4 data-[state=unchecked]:translate-x-0'
        )}
      />
    </SwitchPrimitive.Root>
  )
}

export { Switch }
