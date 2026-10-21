import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { CountUp } from './CountUp'

interface StatCardProps {
  label: string
  value: number | null
  decimals?: number
  suffix?: string
  hint?: ReactNode
  animate?: boolean
  className?: string
}

export function StatCard({
  label,
  value,
  decimals = 0,
  suffix = '',
  hint,
  animate = false,
  className,
}: StatCardProps) {
  return (
    <div
      className={cn('rounded-2xl border border-line bg-surface p-4 shadow-card sm:p-5', className)}
    >
      <p className="text-sm text-muted">{label}</p>
      <p className="tabular mt-1.5 font-display text-3xl font-medium text-ink sm:text-4xl">
        {value === null ? (
          <span className="text-faint">–</span>
        ) : animate ? (
          <CountUp value={value} decimals={decimals} suffix={suffix} />
        ) : (
          `${value.toFixed(decimals)}${suffix}`
        )}
      </p>
      {hint && <p className="mt-2 text-xs leading-relaxed text-muted">{hint}</p>}
    </div>
  )
}
