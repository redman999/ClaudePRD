import { forwardRef } from 'react'
import type { InputHTMLAttributes, TextareaHTMLAttributes, LabelHTMLAttributes } from 'react'
import { cn } from './cn'

const fieldBase =
  'w-full rounded-mds border bg-white px-3 py-2 text-sm text-maersk-ink placeholder:text-maersk-slate/60 ' +
  'transition-colors focus:outline-none focus-visible:outline-none ' +
  'focus:ring-2 focus:ring-maersk-blue focus:border-maersk-blue ' +
  'disabled:bg-maersk-surface disabled:cursor-not-allowed'

function fieldClasses(error: boolean, className?: string) {
  return cn(fieldBase, error ? 'border-red-400' : 'border-maersk-steel', className)
}

export interface LabelProps extends LabelHTMLAttributes<HTMLLabelElement> {
  /** Renders a Maersk amber required marker. */
  required?: boolean
}

export function Label({ required, className, children, ...rest }: LabelProps) {
  return (
    <label
      className={cn('mb-1 block text-sm font-medium text-maersk-ink', className)}
      {...rest}
    >
      {children}
      {required && <span className="ml-0.5 text-maersk-amber">*</span>}
    </label>
  )
}

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  /** Apply the error border style. */
  error?: boolean
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { error = false, className, ...rest },
  ref
) {
  return <input ref={ref} className={fieldClasses(error, className)} {...rest} />
})

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  /** Apply the error border style. */
  error?: boolean
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { error = false, className, ...rest },
  ref
) {
  return (
    <textarea ref={ref} className={cn(fieldClasses(error), 'resize-none', className)} {...rest} />
  )
})
