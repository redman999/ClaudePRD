import type { HTMLAttributes, ReactNode } from 'react'
import { cn } from '../../ui/cn'

export interface ErrorBannerProps extends HTMLAttributes<HTMLDivElement> {
  /** Error message (string or rich content). */
  children: ReactNode
  /** Optional title shown above the message. @default 'Something went wrong' */
  title?: string
  /** Optional dismiss handler — renders a close control when provided. */
  onDismiss?: () => void
}

/** Inline error banner — clean red surface with a Maersk-rounded edge. */
export function ErrorBanner({
  children,
  title = 'Something went wrong',
  onDismiss,
  className,
  ...rest
}: ErrorBannerProps) {
  return (
    <div
      role="alert"
      className={cn(
        'flex items-start gap-3 rounded-mds border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700',
        className
      )}
      {...rest}
    >
      <span aria-hidden="true" className="mt-0.5 select-none font-semibold">
        !
      </span>
      <div className="min-w-0 flex-1">
        {title && <p className="font-medium text-red-800">{title}</p>}
        <p className="mt-0.5 break-words">{children}</p>
      </div>
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss"
          className="shrink-0 rounded p-0.5 text-red-500 transition-colors hover:text-red-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-maersk-blue"
        >
          ×
        </button>
      )}
    </div>
  )
}
