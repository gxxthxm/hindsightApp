import type { ComponentProps } from 'react'
import { cn } from '@/lib/utils'

export function Card({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div
      className={cn('rounded-2xl border border-line bg-surface shadow-card', className)}
      {...props}
    />
  )
}

export function SectionHeading({ className, ...props }: ComponentProps<'h2'>) {
  return <h2 className={cn('font-display text-xl font-medium text-ink', className)} {...props} />
}
