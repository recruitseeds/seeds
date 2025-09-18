'use client'

import * as PopoverPrimitive from '@radix-ui/react-popover'
import * as React from 'react'
import { PropsWithChildren } from 'react'
import { Drawer } from 'vaul'

import { useBreakpoint } from '@/hooks/use-breakpoint'
import { cn } from './lib/utils'
import { DismissibleLayer } from './dismissible-layer'

export interface PopoverProps extends PopoverPrimitive.PopoverProps {
  sheetBreakpoint?: 'sm' | 'md' | 'lg'
}

type Props = React.PropsWithChildren & {
  condition: boolean
  wrap: (children: React.ReactNode) => React.ReactNode
}

export const ConditionalWrap: React.FC<Props> = ({
  condition,
  wrap,
  children,
}) => (condition ? wrap(children) : children)

export const CONTAINER_STYLES = {
  base: cn(
    'data-[side=bottom]:data-[align=end]:origin-top-right',
    'data-[side=bottom]:data-[align=start]:origin-top-left',
    'data-[side=bottom]:data-[align=center]:origin-top',
    'data-[side=top]:data-[align=end]:origin-bottom-right',
    'data-[side=top]:data-[align=start]:origin-bottom-left',
    'data-[side=top]:data-[align=center]:origin-bottom',
    'data-[side=left]:data-[align=end]:origin-bottom-right',
    'data-[side=left]:data-[align=start]:origin-top-right',
    'data-[side=left]:data-[align=center]:origin-right',
    'data-[side=right]:data-[align=end]:origin-bottom-left',
    'data-[side=right]:data-[align=start]:origin-top-left',
    'data-[side=right]:data-[align=center]:origin-left'
  ),
  animation: cn(
    'data-[state=open]:animate-in data-[state=closed]:animate-out',
    'data-[state=open]:duration-50 data-[state=closed]:duration-150',
    'data-[state=closed]:ease-in data-[state=open]:ease-out',
    'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
    'data-[state=closed]:zoom-out-[0.98] data-[state=open]:zoom-in-[0.98]',
    'origin-[--radix-context-menu-content-transform-origin] origin-[--radix-popover-content-transform-origin] origin-[--radix-dropdown-menu-content-transform-origin] origin-[--radix-hover-card-content-transform-origin]'
  ),
  borders: 'border-black/50 dark:border',
  background: 'bg-black dark:bg-elevated',
  shadows: 'shadow-popover',
  rounded: 'rounded-lg',
}

export interface PopoverContextValue {
  sheet: boolean
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

const PopoverContext = React.createContext<PopoverContextValue>({
  sheet: false,
  open: false,
  onOpenChange() {
    return
  },
})

const Popover = (props: PopoverProps) => {
  const atBreakpoint = useBreakpoint(props.sheetBreakpoint ?? 'lg', 'max')

  const value = React.useMemo<PopoverContextValue>(
    () => ({
      open: props.open,
      onOpenChange: props.onOpenChange,
      sheet: !!props.sheetBreakpoint && atBreakpoint,
    }),
    [props.onOpenChange, props.open, atBreakpoint, props.sheetBreakpoint]
  )

  const Root = value.sheet ? Drawer.Root : PopoverPrimitive.Root

  return (
    <PopoverContext.Provider value={value}>
      <Root {...props} />
    </PopoverContext.Provider>
  )
}

const PopoverTrigger = React.forwardRef<
  React.ElementRef<typeof PopoverPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof PopoverPrimitive.Trigger>
>(function PopoverTrigger(props, ref) {
  const context = React.useContext(PopoverContext)
  const Trigger = context.sheet ? Drawer.Trigger : PopoverPrimitive.Trigger

  return (
    <Trigger
      ref={ref}
      {...props}
      onPointerDown={(e) => {
        
        
        
        if (!props.disabled) {
          e.preventDefault()
          e.currentTarget.focus()
        }
      }}
      onKeyDownCapture={(evt) => {
        
        if (!evt.defaultPrevented && evt.key === 'Escape' && context.open) {
          evt.preventDefault()
          evt.stopPropagation()
          context.onOpenChange?.(false)
        }
      }}
    />
  )
})

const PopoverPortal = (props: PopoverPrimitive.PopoverPortalProps) => {
  const context = React.useContext(PopoverContext)
  const Portal = context.sheet ? Drawer.Portal : PopoverPrimitive.Portal

  return <Portal {...props} />
}

const PopoverContent = React.forwardRef<
  React.ElementRef<typeof PopoverPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof PopoverPrimitive.Content> & {
    addDismissibleLayer?: boolean
  }
>(
  (
    {
      className,
      align = 'center',
      sideOffset = 4,
      children,
      collisionPadding = 8,
      addDismissibleLayer = false,
      ...props
    },
    ref
  ) => {
    const context = React.useContext(PopoverContext)
    const Content = (
      context.sheet ? Drawer.Content : PopoverPrimitive.Content
    ) as typeof PopoverPrimitive.Content

    const Overlay = context.sheet
      ? Drawer.Overlay
      : ({ children }: PropsWithChildren<unknown>) => (
          <React.Fragment>{children}</React.Fragment>
        )

    return (
      <React.Fragment>
        <Overlay className='fixed inset-0 bg-black/20 dark:bg-black/60' />
        <ConditionalWrap
          condition={addDismissibleLayer}
          wrap={(children) => <DismissibleLayer>{children}</DismissibleLayer>}>
          <Content
            
            disable-escape-layered-hotkeys=''
            ref={ref}
            align={align}
            sideOffset={sideOffset}
            className={cn(
              context.sheet &&
                'bg-elevated pb-safe-offset-1 fixed inset-x-0 bottom-0 -mb-10 rounded-t-xl',
              !context.sheet &&
                'max-h-[--radix-popper-available-height] max-w-[--radix-popper-available-width]',
              CONTAINER_STYLES.animation,
              '!outline-none focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0',
              className
            )}
            collisionPadding={collisionPadding}
            {...props}>
            <div>
              {/* Handle */}
              {context.sheet && (
                <div className='flex cursor-grab justify-center p-3 pt-1'>
                  <div className='h-1 w-8 rounded-full bg-[--text-primary] opacity-20' />
                </div>
              )}

              {children}

              {context.sheet && <div className='h-10' />}
            </div>
          </Content>
        </ConditionalWrap>
      </React.Fragment>
    )
  }
)

PopoverContent.displayName = PopoverPrimitive.Content.displayName

const PopoverAnchor = PopoverPrimitive.Anchor

type PopoverElementAnchorProps = Omit<
  PopoverPrimitive.PopoverAnchorProps,
  'children' | 'virtualRef'
> & {
  element: HTMLElement | null
}

function PopoverElementAnchor({ element, ...rest }: PopoverElementAnchorProps) {
  const ref = React.useRef(element)

  ref.current = element
  return <PopoverAnchor virtualRef={ref} {...rest} />
}

export {
  Popover,
  PopoverAnchor,
  PopoverContent,
  PopoverElementAnchor,
  PopoverPortal,
  PopoverTrigger,
}
