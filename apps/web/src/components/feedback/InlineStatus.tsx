import type { HTMLAttributes, ReactNode } from 'react'
import { cn } from '../../ui/cn'
import { Spinner } from '../../ui/Spinner'

export type InlineStatusTone = 'info' | 'success' | 'busy'

export interface InlineStatusProps extends HTMLAttributes<HTMLDivElement> {
  /** Visual tone. @default 'info' */
  tone?: InlineStatusTone
  children: ReactNode
}

const tones: Record<InlineStatusTone, string> = {
  info: 'text-maersk-slate',
  success: 'text-green-700',
  busy: 'text-maersk-slate',
}

/** Lightweight inline status line (e.g. "Saving…", "Synced") — not a floating toast. */
export function InlineStatus({ tone = 'info', children, className, ...rest }: InlineStatusProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={cn('inline-flex items-center gap-2 text-sm', tones[tone], className)}
      {...rest}
    >
      {tone === 'busy' && <Spinner size="sm" className="text-maersk-blue" />}
      <span>{children}</span>
    </div>
  )
}
