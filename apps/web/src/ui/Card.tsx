import type { HTMLAttributes, ReactNode } from 'react'
import { cn } from './cn'

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  /** Optional header content rendered above a steel divider. */
  header?: ReactNode
  /** Padding around the card body. @default true */
  padded?: boolean
}

/** White surface card with Maersk radius + shadow and an optional header. */
export function Card({ header, padded = true, className, children, ...rest }: CardProps) {
  return (
    <div
      className={cn(
        'rounded-mds border border-maersk-steel/50 bg-white shadow-mds',
        className
      )}
      {...rest}
    >
      {header != null && (
        <div className="border-b border-maersk-steel/40 px-6 py-4">
          {typeof header === 'string' ? (
            <h2 className="text-base font-semibold text-maersk-ink">{header}</h2>
          ) : (
            header
          )}
        </div>
      )}
      <div className={cn(padded && 'px-6 py-5')}>{children}</div>
    </div>
  )
}
