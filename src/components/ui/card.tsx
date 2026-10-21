import type { ComponentProps, ReactNode } from 'react'
import { cn } from '@/lib/utils'

export function Card({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div
      className={cn('rounded-3xl border border-line bg-surface shadow-card', className)}
      {...props}
    />
  )
}

interface SectionHeaderProps {
  id?: string
  index?: string
  title: ReactNode
  action?: ReactNode
  className?: string
}

/** Numbered editorial section heading: "01 — Due for review". */
export function SectionHeader({ id, index, title, action, className }: SectionHeaderProps) {
  return (
    <div
      className={cn(
        'mb-5 flex items-end justify-between gap-4 border-b border-line pb-3 sm:mb-6',
        className,
      )}
    >
      <h2 id={id} className="flex items-baseline gap-3">
        {index && (
          <span className="eyebrow tabular" aria-hidden>
            {index}
          </span>
        )}
        <span className="font-display text-[28px] leading-none sm:text-[32px]">{title}</span>
      </h2>
      {action}
    </div>
  )
}

/** Kept for simple card headings. */
export function SectionHeading({ className, ...props }: ComponentProps<'h2'>) {
  return <h2 className={cn('font-display text-2xl text-ink', className)} {...props} />
}
