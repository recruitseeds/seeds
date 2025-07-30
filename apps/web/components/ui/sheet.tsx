'use client'

import * as SheetPrimitive from '@radix-ui/react-dialog'
import { type VariantProps, cva } from 'class-variance-authority'
import { X } from 'lucide-react'
import * as React from 'react'
import { type ReactNode, useState } from 'react'

import {
  DropdownMenu as BaseDropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@seeds/ui/dropdown-menu'
import { cn } from '@seeds/ui/lib/utils'

const Sheet = SheetPrimitive.Root

const SheetTrigger = SheetPrimitive.Trigger

const SheetClose = SheetPrimitive.Close

const SheetPortal = SheetPrimitive.Portal

const SheetOverlay = React.forwardRef<
  React.ElementRef<typeof SheetPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof SheetPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <SheetPrimitive.Overlay
    className={cn(
      'fixed inset-0 z-50 bg-black/80 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:pointer-events-none',
      className
    )}
    {...props}
    ref={ref}
  />
))
SheetOverlay.displayName = SheetPrimitive.Overlay.displayName

const sheetVariants = cva(
  'fixed z-50 gap-4 bg-background p-6 shadow-lg transition ease-in-out data-[state=closed]:duration-300 data-[state=open]:duration-500 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:pointer-events-none',
  {
    variants: {
      side: {
        top: 'inset-x-0 top-0 border-b data-[state=closed]:slide-out-to-top data-[state=open]:slide-in-from-top',
        bottom:
          'inset-x-0 bottom-0 border-t data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom',
        left: 'inset-y-0 left-0 h-full w-3/4 border-r data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left sm:max-w-sm',
        right:
          'inset-y-0 right-0 h-full w-3/4 border-l data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right sm:max-w-sm',
      },
    },
    defaultVariants: {
      side: 'right',
    },
  }
)

interface SheetContentProps
  extends React.ComponentPropsWithoutRef<typeof SheetPrimitive.Content>,
    VariantProps<typeof sheetVariants> {}

const SheetContent = React.forwardRef<React.ElementRef<typeof SheetPrimitive.Content>, SheetContentProps>(
  ({ side = 'right', className, children, ...props }, ref) => {
    const hasTitle = React.Children.toArray(children).some((child) => {
      return React.isValidElement(child) && child.type === SheetTitle
    })

    return (
      <SheetPortal>
        <SheetOverlay />
        <SheetPrimitive.Content
          ref={ref}
          className={cn(sheetVariants({ side }), className)}
          {...props}
          onCloseAutoFocus={(e) => {
            e.preventDefault()
            document.body.focus()
            props.onCloseAutoFocus?.(e)
          }}>
          {!hasTitle && <SheetTitle className='sr-only'>Sheet Dialog</SheetTitle>}
          <SheetPrimitive.Close className="ring-offset-background data-[state=open]:bg-accent data-[state=open]:text-muted-foreground absolute top-4 right-4 rounded-sm focus:outline-2 focus:outline-offset-1 focus:outline-brand-subtle focus:ring-brand focus:ring-[1px] disabled:pointer-events-none [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4">
            <X className='size-4' />
            <span className='sr-only'>Close</span>
          </SheetPrimitive.Close>
          {children}
        </SheetPrimitive.Content>
      </SheetPortal>
    )
  }
)

SheetContent.displayName = SheetPrimitive.Content.displayName

const SheetHeader = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('flex flex-col space-y-2 text-center sm:text-left', className)} {...props} />
)
SheetHeader.displayName = 'SheetHeader'

const SheetFooter = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2', className)} {...props} />
)
SheetFooter.displayName = 'SheetFooter'

const SheetTitle = React.forwardRef<
  React.ElementRef<typeof SheetPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof SheetPrimitive.Title>
>(({ className, ...props }, ref) => (
  <SheetPrimitive.Title ref={ref} className={cn('text-lg font-semibold text-foreground', className)} {...props} />
))
SheetTitle.displayName = SheetPrimitive.Title.displayName

const SheetDescription = React.forwardRef<
  React.ElementRef<typeof SheetPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof SheetPrimitive.Description>
>(({ className, ...props }, ref) => (
  <SheetPrimitive.Description ref={ref} className={cn('text-sm text-muted-foreground', className)} {...props} />
))
SheetDescription.displayName = SheetPrimitive.Description.displayName

interface SheetConfig {
  sheetContent: ReactNode | ((api: { closeSheet: () => void }) => ReactNode)
  side?: 'top' | 'bottom' | 'left' | 'right'
  width?: string
  onOpen?: () => void
  onClose?: () => void
}

interface BaseItem {
  label: string
  leftSlot?: ReactNode
  disabled?: boolean
  className?: string
  shortcut?: string
}

interface RegularDropdownItem extends BaseItem {
  type: 'item'
  onSelect?: (e: Event) => void
  sheet?: never
}

interface SheetDropdownItem extends BaseItem {
  type: 'item'
  onSelect?: (e: Event) => void
  sheet: SheetConfig
}

interface SeparatorItem {
  type: 'separator'
}

interface HeaderItem {
  type: 'header'
  label: string
  className?: string
}

type SheetDropdownMenuItemType = RegularDropdownItem | SheetDropdownItem | SeparatorItem | HeaderItem

interface SheetDropdownMenuProps {
  align?: 'start' | 'center' | 'end'
  side?: 'top' | 'bottom' | 'left' | 'right'
  sideOffset?: number
  trigger: ReactNode
  disabled?: boolean
  items: SheetDropdownMenuItemType[]
  header?: ReactNode
  desktop?: boolean
  onSheetOpen?: (index: number) => void
  onSheetClose?: () => void
  className?: string
}

function SheetDropdownMenu({
  align,
  side,
  sideOffset,
  trigger,
  disabled,
  items,
  header,
  onSheetOpen,
  onSheetClose,
  ...props
}: SheetDropdownMenuProps) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [activeSheet, setActiveSheet] = useState<number | null>(null)

  const handleCloseSheet = () => {
    const previousIndex = activeSheet
    setActiveSheet(null)
    document.body.style.pointerEvents = ''
    setTimeout(() => {
      document.body.focus()
      onSheetClose?.()
      if (
        previousIndex !== null &&
        items[previousIndex].type === 'item' &&
        (items[previousIndex] as SheetDropdownItem).sheet
      ) {
        ;(items[previousIndex] as SheetDropdownItem).sheet?.onClose?.()
      }
    }, 100)
  }

  const processedItems = items.map((item, index) => {
    if (item.type === 'item' && (item as SheetDropdownItem).sheet) {
      const sheetItem = item as SheetDropdownItem
      return {
        ...sheetItem,
        onSelect: (e: Event) => {
          e.preventDefault()
          setActiveSheet(index)
          setIsDropdownOpen(false)
          onSheetOpen?.(index)
          sheetItem.sheet?.onOpen?.()
          if (sheetItem.onSelect) {
            sheetItem.onSelect(e)
          }
        },
      }
    }
    return item
  })

  const currentSheetItem =
    activeSheet !== null && items[activeSheet].type === 'item' ? (items[activeSheet] as SheetDropdownItem) : null

  return (
    <>
      <BaseDropdownMenu open={isDropdownOpen} onOpenChange={setIsDropdownOpen} {...props}>
        <DropdownMenuTrigger asChild disabled={disabled}>
          {trigger}
        </DropdownMenuTrigger>
        <DropdownMenuContent align={align} side={side} sideOffset={sideOffset} className={props.className}>
          {header && <DropdownMenuLabel>{header}</DropdownMenuLabel>}
          {processedItems.map((item, index) => {
            if (item.type === 'separator') {
              return <DropdownMenuSeparator key={`sep-${index}`} />
            }
            if (item.type === 'header') {
              return (
                <DropdownMenuLabel key={`header-${index}`} className={item.className}>
                  {item.label}
                </DropdownMenuLabel>
              )
            }
            const regularItem = item as RegularDropdownItem | SheetDropdownItem
            return (
              <DropdownMenuItem
                key={regularItem.label || `item-${index}`}
                onSelect={regularItem.onSelect}
                disabled={regularItem.disabled}
                className={regularItem.className}>
                {regularItem.leftSlot}
                <span>{regularItem.label}</span>
                {regularItem.shortcut && (
                  <span className='ml-auto text-xs tracking-widest opacity-60'>{regularItem.shortcut}</span>
                )}
              </DropdownMenuItem>
            )
          })}
        </DropdownMenuContent>
      </BaseDropdownMenu>

      {currentSheetItem && currentSheetItem.sheet && (
        <Sheet
          open={activeSheet !== null}
          onOpenChange={(open) => {
            if (!open) handleCloseSheet()
          }}>
          <SheetContent
            side={currentSheetItem.sheet?.side || 'right'}
            className={currentSheetItem.sheet?.width ? `w-full ${currentSheetItem.sheet.width}` : undefined}>
            {typeof currentSheetItem.sheet.sheetContent === 'function'
              ? currentSheetItem.sheet.sheetContent({
                  closeSheet: handleCloseSheet,
                })
              : currentSheetItem.sheet.sheetContent}
          </SheetContent>
        </Sheet>
      )}
    </>
  )
}

export {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetDropdownMenu,
  SheetFooter,
  SheetHeader,
  SheetOverlay,
  SheetPortal,
  SheetTitle,
  SheetTrigger,
  type SheetDropdownMenuItemType,
}
