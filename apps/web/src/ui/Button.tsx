import { forwardRef } from 'react'
import type { ButtonHTMLAttributes } from 'react'
import { cn } from './cn'
import { Spinner } from './Spinner'

export type ButtonVariant = 'primary' | 'secondary' | 'ghost'
export type ButtonSize = 'sm' | 'md'

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Visual style. @default 'primary' */
  variant?: ButtonVariant
  /** @default 'md' */
  size?: ButtonSize
  /** Shows a spinner and disables the button. */
  loading?: boolean
}

const base =
  'inline-flex items-center justify-center gap-2 rounded-mds font-medium transition-colors ' +
  'disabled:opacity-60 disabled:cursor-not-allowed focus-visible:outline-none'

const variants: Record<ButtonVariant, string> = {
  primary: 'bg-maersk-blue text-white hover:bg-primary-500 active:bg-primary-600',
  secondary:
    'border border-maersk-steel bg-white text-maersk-ink hover:bg-maersk-surface active:bg-primary-50',
  ghost: 'text-maersk-slate hover:bg-maersk-surface hover:text-maersk-ink',
}

const sizes: Record<ButtonSize, string> = {
  sm: 'text-xs px-3 py-1.5',
  md: 'text-sm px-4 py-2.5',
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'primary', size = 'md', loading = false, disabled, className, children, ...rest },
  ref
) {
  return (
    <button
      ref={ref}
      className={cn(base, variants[variant], sizes[size], className)}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...rest}
    >
      {loading && <Spinner size="sm" className="text-current" />}
      {children}
    </button>
  )
})
