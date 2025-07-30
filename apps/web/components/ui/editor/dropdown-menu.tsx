import { Separator } from '@seeds/editor/separator'
import type { Placement } from '@floating-ui/react'
import {
  FloatingFocusManager,
  FloatingList,
  FloatingPortal,
  autoUpdate,
  flip,
  offset,
  shift,
  useClick,
  useDismiss,
  useFloating,
  useInteractions,
  useListItem,
  useListNavigation,
  useMergeRefs,
  useRole,
  useTypeahead,
} from '@floating-ui/react'
import * as React from 'react'

interface DropdownMenuOptions {
  initialOpen?: boolean
  open?: boolean
  onOpenChange?: (open: boolean) => void
  side?: 'top' | 'right' | 'bottom' | 'left'
  align?: 'start' | 'center' | 'end'
}

interface DropdownMenuProps extends DropdownMenuOptions {
  children: React.ReactNode
}

type ContextType = ReturnType<typeof useDropdownMenu> & {
  updatePosition: (side: 'top' | 'right' | 'bottom' | 'left', align: 'start' | 'center' | 'end') => void
}

const DropdownMenuContext = React.createContext<ContextType | null>(null)

function useDropdownMenuContext() {
  const context = React.useContext(DropdownMenuContext)
  if (!context) {
    throw new Error('DropdownMenu components must be wrapped in <DropdownMenu />')
  }
  return context
}

function useDropdownMenu({
  initialOpen = false,
  open: controlledOpen,
  onOpenChange: setControlledOpen,
  side = 'bottom',
  align = 'start',
}: DropdownMenuOptions) {
  const [uncontrolledOpen, setUncontrolledOpen] = React.useState(initialOpen)
  const [currentPlacement, setCurrentPlacement] = React.useState<Placement>(`${side}-${align}` as Placement)
  const [activeIndex, setActiveIndex] = React.useState<number | null>(null)

  const open = controlledOpen ?? uncontrolledOpen
  const setOpen = setControlledOpen ?? setUncontrolledOpen

  const elementsRef = React.useRef<Array<HTMLElement | null>>([])
  const labelsRef = React.useRef<Array<string | null>>([])

  const floating = useFloating({
    open,
    onOpenChange: setOpen,
    placement: currentPlacement,
    middleware: [offset({ mainAxis: 4 }), flip(), shift({ padding: 4 })],
    whileElementsMounted: autoUpdate,
  })

  const { context } = floating

  const interactions = useInteractions([
    useClick(context, {
      event: 'mousedown',
      toggle: true,
      ignoreMouse: false,
    }),
    useRole(context, { role: 'menu' }),
    useDismiss(context, {
      outsidePress: true,
      outsidePressEvent: 'mousedown',
    }),
    useListNavigation(context, {
      listRef: elementsRef,
      activeIndex,
      onNavigate: setActiveIndex,
      loop: true,
    }),
    useTypeahead(context, {
      listRef: labelsRef,
      onMatch: open ? setActiveIndex : undefined,
      activeIndex,
    }),
  ])

  const updatePosition = React.useCallback(
    (newSide: 'top' | 'right' | 'bottom' | 'left', newAlign: 'start' | 'center' | 'end') => {
      setCurrentPlacement(`${newSide}-${newAlign}` as Placement)
    },
    []
  )

  return React.useMemo(
    () => ({
      open,
      setOpen,
      activeIndex,
      setActiveIndex,
      elementsRef,
      labelsRef,
      updatePosition,
      ...interactions,
      ...floating,
    }),
    [open, setOpen, activeIndex, interactions, floating, updatePosition]
  )
}

export function DropdownMenu({ children, ...options }: DropdownMenuProps) {
  const dropdown = useDropdownMenu(options)
  return (
    <DropdownMenuContext.Provider value={dropdown}>
      <FloatingList elementsRef={dropdown.elementsRef} labelsRef={dropdown.labelsRef}>
        {children}
      </FloatingList>
    </DropdownMenuContext.Provider>
  )
}

interface DropdownMenuTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean
}

export const DropdownMenuTrigger = React.forwardRef<HTMLButtonElement, DropdownMenuTriggerProps>(
  ({ children, asChild = false, ...props }, propRef) => {
    const context = useDropdownMenuContext()
    const childrenRef = React.isValidElement(children)
      ? Number.parseInt(React.version, 10) >= 19
        ? (children as { props: { ref?: React.Ref<HTMLElement> } }).props.ref
        : (children as { ref?: React.Ref<HTMLElement> }).ref
      : undefined
    const ref = useMergeRefs([context.refs.setReference, propRef, childrenRef])

    if (asChild && React.isValidElement(children)) {
      const dataAttributes = {
        'data-state': context.open ? 'open' : 'closed',
      }

      return React.cloneElement(
        children,
        context.getReferenceProps({
          ref,
          ...props,
          ...(typeof children.props === 'object' ? children.props : {}),
          'aria-expanded': context.open,
          'aria-haspopup': 'menu' as const,
          ...dataAttributes,
        })
      )
    }

    return (
      <button
        ref={ref}
        aria-expanded={context.open}
        aria-haspopup='menu'
        data-state={context.open ? 'open' : 'closed'}
        {...context.getReferenceProps(props)}>
        {children}
      </button>
    )
  }
)

DropdownMenuTrigger.displayName = 'DropdownMenuTrigger'

interface DropdownMenuContentProps extends React.HTMLAttributes<HTMLDivElement> {
  orientation?: 'vertical' | 'horizontal'
  side?: 'top' | 'right' | 'bottom' | 'left'
  align?: 'start' | 'center' | 'end'
  portal?: boolean
  portalProps?: Omit<React.ComponentProps<typeof FloatingPortal>, 'children'>
}

export const DropdownMenuContent = React.forwardRef<HTMLDivElement, DropdownMenuContentProps>(
  (
    {
      style,
      className,
      orientation = 'vertical',
      side = 'bottom',
      align = 'start',
      portal = true,
      portalProps = {},
      ...props
    },
    propRef
  ) => {
    const context = useDropdownMenuContext()
    const ref = useMergeRefs([context.refs.setFloating, propRef])

    React.useEffect(() => {
      context.updatePosition(side, align)
    }, [context, side, align])

    if (!context.open) return null

    const content = (
      <FloatingFocusManager context={context.context} modal={false} initialFocus={0} returnFocus={true}>
        <div
          ref={ref}
          className={`z-50 min-w-[8rem] overflow-hidden rounded-lg border  p-1 text-foreground bg-background 
          data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 
          data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 
          data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 
          data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 outline-none
          ${className || ''}`}
          style={{
            position: context.strategy,
            top: context.y ?? 0,
            left: context.x ?? 0,
            ...style,
          }}
          aria-orientation={orientation}
          data-orientation={orientation}
          data-state={context.open ? 'open' : 'closed'}
          data-side={side}
          data-align={align}
          {...context.getFloatingProps(props)}>
          {props.children}
        </div>
      </FloatingFocusManager>
    )

    if (portal) {
      return <FloatingPortal {...portalProps}>{content}</FloatingPortal>
    }

    return content
  }
)

DropdownMenuContent.displayName = 'DropdownMenuContent'

interface DropdownMenuItemProps extends React.HTMLAttributes<HTMLDivElement> {
  asChild?: boolean
  disabled?: boolean
  onSelect?: () => void
}

export const DropdownMenuItem = React.forwardRef<HTMLDivElement, DropdownMenuItemProps>(
  ({ children, disabled, asChild = false, onSelect, className, ...props }, ref) => {
    const context = useDropdownMenuContext()
    const item = useListItem({ label: disabled ? null : children?.toString() })
    const isActive = context.activeIndex === item.index

    const handleSelect = React.useCallback(
      (event: React.MouseEvent<HTMLDivElement>) => {
        if (disabled) return
        onSelect?.()
        props.onClick?.(event)
        context.setOpen(false)
      },
      [context, disabled, onSelect, props]
    )

    const itemProps: React.HTMLAttributes<HTMLDivElement> & {
      ref: React.Ref<HTMLDivElement>
      role: string
      tabIndex: number
      'aria-disabled'?: boolean
      'data-highlighted'?: boolean
    } = {
      ref: useMergeRefs([item.ref, ref]),
      role: 'menuitem',
      className: `relative flex w-full cursor-pointer select-none items-center rounded-md px-2 py-1.5 text-sm outline-none transition-colors 
        hover:shadow-[inset_0px_0px_0px_0.5px_rgb(255_255_255_/_0.02),inset_0px_0.5px_0px_rgb(255_255_255_/_0.04),_inset_0px_0px_0px_1px_rgb(255_255_255_/_0.02),_0px_0px_0px_0.5px_rgb(0_0_0_/_0.24)]
        ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        ${className || ''}`,
      tabIndex: isActive ? 0 : -1,
      'data-highlighted': isActive,
      'aria-disabled': disabled,
      ...context.getItemProps({
        ...props,
        onClick: handleSelect,
      }),
    }

    if (asChild && React.isValidElement(children)) {
      const childProps = children.props as {
        onClick?: (event: React.MouseEvent<HTMLElement>) => void
        onKeyDown?: (event: React.KeyboardEvent<HTMLElement>) => void
        className?: string
      }

      const mergedProps = {
        ...itemProps,
        ...(typeof children.props === 'object' ? children.props : {}),
        className: `${itemProps.className} ${childProps.className || ''}`,
      }

      const eventHandlers = {
        onClick: (event: React.MouseEvent<HTMLElement>) => {
          handleSelect(event as unknown as React.MouseEvent<HTMLDivElement>)
          childProps.onClick?.(event)
        },
        onKeyDown: (event: React.KeyboardEvent<HTMLElement>) => {
          itemProps.onKeyDown?.(event as unknown as React.KeyboardEvent<HTMLDivElement>)
          childProps.onKeyDown?.(event)
        },
      }

      return React.cloneElement(children, {
        ...mergedProps,
        ...eventHandlers,
      })
    }

    return <div {...itemProps}>{children}</div>
  }
)

DropdownMenuItem.displayName = 'DropdownMenuItem'

interface DropdownMenuGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  label?: string
}

export const DropdownMenuGroup = React.forwardRef<HTMLDivElement, DropdownMenuGroupProps>(
  ({ children, label, className, ...props }, ref) => {
    return (
      <div {...props} ref={ref} role='group' aria-label={label} className={`${className || ''}`}>
        {children}
      </div>
    )
  }
)

DropdownMenuGroup.displayName = 'DropdownMenuGroup'

export const DropdownMenuSeparator = React.forwardRef<
  React.ElementRef<typeof Separator>,
  React.ComponentPropsWithoutRef<typeof Separator>
>(({ className, ...props }, ref) => (
  <Separator ref={ref} className={`-mx-1 my-1 h-px bg-gray-100 dark:bg-gray-800 ${className || ''}`} {...props} />
))
DropdownMenuSeparator.displayName = Separator.displayName

export const DropdownMenuLabel = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={`px-2 py-1.5 text-sm font-semibold text-gray-950 dark:text-gray-50 ${className || ''}`}
      {...props}
    />
  )
)

DropdownMenuLabel.displayName = 'DropdownMenuLabel'
