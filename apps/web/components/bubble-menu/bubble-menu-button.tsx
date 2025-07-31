import { cn } from '@seeds/ui/lib/utils'
import { ChevronDown as ChevronDownIcon } from 'lucide-react'
import { type MouseEvent, forwardRef } from 'react'
import { ConditionalWrap } from '../../lib/conditional-wrap'
import { Button } from '@seeds/ui/button'
import { UIText } from '@seeds/ui/text'
import { Tooltip } from '../ui/tippy'

type BubbleMenuButtonElement = React.ElementRef<'button'>
interface BubbleMenuProps extends React.ComponentPropsWithRef<'button'> {
  onClick?: (evt: MouseEvent) => void
  isActive?: boolean
  icon: React.ReactNode
  title?: string
  tooltip?: string
  shortcut?: string
  dropdown?: boolean
}

export const BubbleMenuButton = forwardRef<BubbleMenuButtonElement, BubbleMenuProps>(function BubbleMenuButton(
  { icon, isActive = false, onClick, title, tooltip, shortcut, dropdown, ...props }: BubbleMenuProps,
  ref
) {
  return (
    <ConditionalWrap
      condition={!!tooltip}
      wrap={(children) => (
        <Tooltip label={tooltip} shortcut={shortcut} sideOffset={8}>
          {children}
        </Tooltip>
      )}>
      <Button
        {...props}
        ref={ref}
        type='button'
        onClick={onClick}
        variant='ghost'
        className={cn('', {
          'bg-important hover:bg-important-hover active:bg-important-active !text-white': isActive,
        })}>
        {icon}
        {title && (
          <UIText weight='font-medium' size='text-sm'>
            {title}
          </UIText>
        )}
        {dropdown && (
          <span className='text-muted-foreground group-hover:text-foreground -ml-1'>
            <ChevronDownIcon />
          </span>
        )}
      </Button>
    </ConditionalWrap>
  )
})
