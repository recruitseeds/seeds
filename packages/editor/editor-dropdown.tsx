import { Slot } from '@radix-ui/react-slot'
import { cn } from '@seeds/ui'
import React from 'react'

export const DropdownCategoryTitle = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className='text-[.65rem] font-semibold mb-1 uppercase text-neutral-500 dark:text-neutral-400 px-1.5'>
      {children}
    </div>
  )
}

export const DropdownButton = React.forwardRef<
  HTMLButtonElement,
  {
    children: React.ReactNode
    isActive?: boolean
    onClick?: () => void
    disabled?: boolean
    className?: string
    asChild?: boolean
  }
>(function DropdownButtonInner({ children, isActive, onClick, disabled, className, asChild = false }, ref) {
  const buttonClass = cn(
    'flex items-center gap-2 p-1.5 text-sm font-medium text-neutral-500 dark:text-neutral-400 text-left bg-transparent w-full rounded hover:shadow-[inset_0px_0px_0px_0.5px_rgb(255_255_255_/_0.02),inset_0px_0.5px_0px_rgb(255_255_255_/_0.04),_inset_0px_0px_0px_1px_rgb(255_255_255_/_0.02),_0px_0px_0px_0.5px_rgb(0_0_0_/_0.24)]',
    !isActive && !disabled,
    'hover:bg-neutral-100 hover:text-neutral-800 dark:hover:bg-neutral-900 dark:hover:text-neutral-200',
    isActive &&
      !disabled &&
      'bg-neutral-100 text-neutral-800 dark:bg-neutral-900 dark:text-neutral-200 shadow-[inset_0px_0px_0px_0.5px_rgb(255_255_255_/_0.02),inset_0px_0.5px_0px_rgb(255_255_255_/_0.04),_inset_0px_0px_0px_1px_rgb(255_255_255_/_0.02),_0px_0px_0px_0.5px_rgb(0_0_0_/_0.24)]',
    disabled && 'text-neutral-400 cursor-not-allowed dark:text-neutral-600',
    className
  )

  const Comp = asChild ? Slot : 'button'

  return (
    <Comp className={buttonClass} disabled={disabled} onClick={onClick} ref={ref}>
      {children}
    </Comp>
  )
})
