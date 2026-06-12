import type { HTMLAttributes } from 'react'
import { cn } from './cn'

export type BadgeColor = 'blue' | 'green' | 'amber' | 'slate'

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  /** Status color. @default 'slate' */
  color?: BadgeColor
}

const colors: Record<BadgeColor, string> = {
  blue: 'bg-primary-50 text-primary-700',
  green: 'bg-green-100 text-green-700',
  amber: 'bg-amber-100 text-amber-700',
  slate: 'bg-maersk-steel/30 text-maersk-slate',
}

/** Small pill badge for statuses (e.g. session state). */
export function Badge({ color = 'slate', className, children, ...rest }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
        colors[color],
        className
      )}
      {...rest}
    >
      {children}
    </span>
  )
}
