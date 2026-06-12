import { cn } from './cn'

const sizeMap = {
  sm: 'h-4 w-4',
  md: 'h-5 w-5',
  lg: 'h-8 w-8',
} as const

export interface SpinnerProps {
  /** Diameter preset. @default 'md' */
  size?: keyof typeof sizeMap
  className?: string
  /** Accessible label for screen readers. @default 'Loading' */
  label?: string
}

/** Maersk Blue spinner — uses currentColor so it inherits the parent text color. */
export function Spinner({ size = 'md', className, label = 'Loading' }: SpinnerProps) {
  return (
    <svg
      className={cn('animate-spin text-maersk-blue', sizeMap[size], className)}
      viewBox="0 0 24 24"
      fill="none"
      role="status"
      aria-label={label}
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
    </svg>
  )
}
