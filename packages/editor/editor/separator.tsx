import * as React from 'react'

type Orientation = 'horizontal' | 'vertical'

export interface SeparatorProps extends React.HTMLAttributes<HTMLDivElement> {
  orientation?: Orientation
  decorative?: boolean
}

export const Separator = React.forwardRef<HTMLDivElement, SeparatorProps>(
  ({ decorative, orientation = 'vertical', className = '', ...divProps }, ref) => {
    const ariaOrientation = orientation === 'vertical' ? orientation : undefined
    const semanticProps = decorative ? { role: 'none' } : { 'aria-orientation': ariaOrientation, role: 'separator' }

    const orientationClasses = orientation === 'vertical' ? 'h-6 w-px bg-border mx-1' : 'h-px w-full bg-border my-1'

    return (
      <div
        className={`${orientationClasses} ${className}`.trim()}
        data-orientation={orientation}
        {...semanticProps}
        {...divProps}
        ref={ref}
      />
    )
  }
)

Separator.displayName = 'Separator'
