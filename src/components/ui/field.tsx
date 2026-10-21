import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface FieldProps {
  label: ReactNode
  htmlFor?: string
  hint?: ReactNode
  error?: string
  errorId?: string
  optional?: boolean
  className?: string
  children: ReactNode
  as?: 'div' | 'fieldset'
}

/** Label + control + hint/error. Use `as="fieldset"` for groups of chips or radios. */
export function Field({
  label,
  htmlFor,
  hint,
  error,
  errorId,
  optional,
  className,
  children,
  as = 'div',
}: FieldProps) {
  const labelContent = (
    <>
      {label}
      {optional && <span className="ml-1.5 font-normal text-faint">optional</span>}
    </>
  )
  const labelClass = 'mb-1.5 block text-sm font-medium text-ink'
  const Wrapper = as
  return (
    <Wrapper className={cn('min-w-0', className)}>
      {as === 'fieldset' ? (
        <legend className={labelClass}>{labelContent}</legend>
      ) : (
        <label htmlFor={htmlFor} className={labelClass}>
          {labelContent}
        </label>
      )}
      {children}
      {hint && !error && <p className="mt-1.5 text-xs text-muted">{hint}</p>}
      {error && (
        <p id={errorId} className="mt-1.5 text-sm font-medium text-danger" role="alert">
          {error}
        </p>
      )}
    </Wrapper>
  )
}
