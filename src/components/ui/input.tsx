import type { ComponentProps } from 'react'
import { cn } from '@/lib/utils'

const fieldBase =
  'w-full rounded-lg border border-line bg-surface px-3 text-[15px] text-ink placeholder:text-faint transition-colors hover:border-line-strong focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-accent focus-visible:border-transparent aria-[invalid=true]:border-danger disabled:cursor-not-allowed disabled:bg-surface-2 disabled:text-muted'

export function Input({ className, ...props }: ComponentProps<'input'>) {
  return <input className={cn(fieldBase, 'h-11', className)} {...props} />
}

export function Textarea({ className, ...props }: ComponentProps<'textarea'>) {
  return (
    <textarea
      className={cn(fieldBase, 'min-h-20 resize-y py-2.5 leading-relaxed', className)}
      {...props}
    />
  )
}

export function Select({ className, ...props }: ComponentProps<'select'>) {
  return (
    <select
      className={cn(
        fieldBase,
        'h-10 cursor-pointer appearance-none bg-no-repeat pr-9 text-sm',
        className,
      )}
      style={{
        backgroundImage:
          "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%23888' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")",
        backgroundPosition: 'right 0.75rem center',
      }}
      {...props}
    />
  )
}
