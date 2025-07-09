import { cn } from '@/lib/utils'
import { type ButtonHTMLAttributes, type HTMLProps, forwardRef } from 'react'
import { Button } from './button'
import { Surface } from './surface'
import { Tooltip } from './tooltip'

export type ToolbarWrapperProps = {
  shouldShowContent?: boolean
  isVertical?: boolean
} & HTMLProps<HTMLDivElement>

const ToolbarWrapper = forwardRef<HTMLDivElement, ToolbarWrapperProps>(
  ({ shouldShowContent = true, children, isVertical = false, className, ...rest }, ref) => {
    const toolbarClassName = cn(
      'text-foreground bg-background inline-flex h-full leading-none gap-0.5',
      isVertical ? 'flex-col p-2' : 'flex-row p-1 items-center',
      className
    )
    return (
      shouldShowContent && (
        <Surface className={toolbarClassName} {...rest} ref={ref}>
          {children}
        </Surface>
      )
    )
  }
)
ToolbarWrapper.displayName = 'Toolbar'

export type ToolbarDividerProps = {
  horizontal?: boolean
} & HTMLProps<HTMLDivElement>

const ToolbarDivider = forwardRef<HTMLDivElement, ToolbarDividerProps>(({ horizontal, className, ...rest }, ref) => {
  const dividerClassName = cn(
    'bg-border',
    horizontal
      ? 'w-full min-w-[1.5rem] h-[1px] my-1 first:mt-0 last:mt-0'
      : 'h-full min-h-[1.5rem] w-[1px] mx-1 first:ml-0 last:mr-0',
    className
  )
  return <div className={dividerClassName} ref={ref} {...rest} />
})
ToolbarDivider.displayName = 'Toolbar.Divider'

export type ToolbarButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  active?: boolean
  activeClassName?: string
  tooltip?: string
  tooltipShortcut?: string[]
  size?: 'default' | 'sm' | 'lg' | 'icon'
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link' | 'brand'
}

const ToolbarButton = forwardRef<HTMLButtonElement, ToolbarButtonProps>(
  (
    {
      children,
      size = 'icon',
      variant = 'ghost',
      className,
      tooltip,
      tooltipShortcut,
      activeClassName,
      active,
      ...rest
    },
    ref
  ) => {
    const buttonClass = cn('h-7', className)

    const content = (
      <Button
        active={active}
        activeClassName={activeClassName}
        className={buttonClass}
        variant={variant}
        size={size}
        ref={ref}
        {...rest}>
        {children}
      </Button>
    )

    if (tooltip) {
      return (
        <Tooltip title={tooltip} shortcut={tooltipShortcut}>
          {content}
        </Tooltip>
      )
    }

    return content
  }
)
ToolbarButton.displayName = 'ToolbarButton'

export const Toolbar = {
  Wrapper: ToolbarWrapper,
  Divider: ToolbarDivider,
  Button: ToolbarButton,
}
