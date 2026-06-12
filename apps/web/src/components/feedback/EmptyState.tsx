import type { HTMLAttributes, ReactNode } from 'react'
import { cn } from '../../ui/cn'

export interface EmptyStateProps extends HTMLAttributes<HTMLDivElement> {
  /** Headline shown in Maersk ink. */
  title: string
  /** Optional supporting line in slate. */
  description?: ReactNode
  /** Optional icon/illustration rendered above the title. */
  icon?: ReactNode
  /** Optional call-to-action (e.g. a Button or Link) rendered below. */
  action?: ReactNode
}

/** Centered placeholder for an empty list/collection — Maersk steel/slate tones. */
export function EmptyState({
  title,
  description,
  icon,
  action,
  className,
  ...rest
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center rounded-mds border border-dashed border-maersk-steel/60 bg-white/60 px-6 py-16 text-center',
        className
      )}
      {...rest}
    >
      {icon != null && <div className="mb-4 text-maersk-blue">{icon}</div>}
      <p className="text-lg font-semibold text-maersk-ink">{title}</p>
      {description != null && (
        <p className="mt-1 max-w-md text-sm text-maersk-slate">{description}</p>
      )}
      {action != null && <div className="mt-6">{action}</div>}
    </div>
  )
}
