import { motion } from 'framer-motion'
import type { ReactNode } from 'react'
import { SOFT_SPRING } from '@/lib/motion'
import { cn } from '@/lib/utils'
import { CountUp } from './CountUp'

interface StatCardProps {
  label: string
  value: number | null
  decimals?: number
  suffix?: string
  hint?: ReactNode
  tone?: 'default' | 'inverse' | 'accent'
  className?: string
}

export function StatCard({
  label,
  value,
  decimals = 0,
  suffix = '',
  hint,
  tone = 'default',
  className,
}: StatCardProps) {
  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={SOFT_SPRING}
      className={cn(
        'relative flex flex-col overflow-hidden rounded-3xl border p-5 shadow-card transition-shadow duration-300 hover:shadow-lift sm:p-6',
        tone === 'default' && 'border-line bg-surface',
        tone === 'inverse' && 'border-transparent bg-ink text-bg',
        tone === 'accent' && 'border-transparent bg-accent text-accent-ink',
        className,
      )}
    >
      <p className={cn('eyebrow', tone !== 'default' && 'text-current opacity-90')}>{label}</p>
      <p className="tabular mt-4 font-display text-[46px] leading-[0.9] sm:text-[56px]">
        {value === null ? (
          <span className="opacity-40">–</span>
        ) : (
          <CountUp value={value} decimals={decimals} suffix={suffix} />
        )}
      </p>
      {hint && (
        <p
          className={cn(
            'mt-auto pt-4 text-[13px] leading-relaxed',
            tone === 'default' ? 'text-muted' : 'opacity-90',
          )}
        >
          {hint}
        </p>
      )}
    </motion.div>
  )
}
