import { motion, useReducedMotion } from 'framer-motion'
import { EASE } from '@/lib/motion'
import { cn } from '@/lib/utils'

/** Thin bar from 50% to 100% that fills when scrolled into view. */
export function ConfidenceMeter({
  value,
  className,
  barClassName,
}: {
  value: number
  className?: string
  barClassName?: string
}) {
  const reduced = useReducedMotion()
  const pct = ((value - 50) / 50) * 100
  return (
    <span
      aria-hidden
      className={cn('relative block h-1.5 overflow-hidden rounded-full bg-surface-2', className)}
    >
      <motion.span
        className={cn(
          'absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-accent to-accent-bright',
          barClassName,
        )}
        initial={reduced ? false : { width: 0 }}
        whileInView={{ width: `${Math.max(pct, 4)}%` }}
        viewport={{ once: true }}
        transition={{ duration: 1, ease: EASE, delay: 0.15 }}
        style={reduced ? { width: `${Math.max(pct, 4)}%` } : undefined}
      />
    </span>
  )
}
