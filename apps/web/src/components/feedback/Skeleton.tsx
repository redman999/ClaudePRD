import type { HTMLAttributes } from 'react'
import { cn } from '../../ui/cn'

export interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {
  /** Tailwind height utility (or any extra classes) for a single bar. */
  className?: string
}

/** A single pulsing placeholder bar in Maersk steel tones. */
export function Skeleton({ className, ...rest }: SkeletonProps) {
  return (
    <div
      className={cn('animate-pulse rounded bg-maersk-steel/40', className)}
      aria-hidden="true"
      {...rest}
    />
  )
}

/** A card-shaped skeleton matching the project-card layout used on Home. */
export function SkeletonCard({ className, ...rest }: SkeletonProps) {
  return (
    <div
      className={cn(
        'space-y-3 rounded-mds border border-maersk-steel/50 bg-white p-5 shadow-mds',
        className
      )}
      aria-hidden="true"
      {...rest}
    >
      <Skeleton className="h-5 w-1/3" />
      <Skeleton className="h-4 w-2/3 bg-maersk-steel/30" />
      <Skeleton className="h-3 w-1/4 bg-maersk-steel/30" />
    </div>
  )
}
