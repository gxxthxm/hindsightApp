import { motion, useReducedMotion } from 'framer-motion'
import type { Quadrant } from '@/lib/stats'
import { cn } from '@/lib/utils'

const CELLS: { q: Quadrant; sub: string }[] = [
  { q: 'Dumb luck', sub: 'Weak call · good outcome' },
  { q: 'Earned it', sub: 'Good call · good outcome' },
  { q: 'Lesson', sub: 'Weak call · bad outcome' },
  { q: 'Bad luck', sub: 'Good call · bad outcome' },
]

/** Small 2x2 with the given quadrant highlighted. */
export function QuadrantGrid({ active, className }: { active: Quadrant; className?: string }) {
  const reduced = useReducedMotion()
  return (
    <div className={cn('grid grid-cols-[auto_1fr] gap-x-2', className)}>
      <span
        aria-hidden
        className="rotate-180 self-center text-center text-[11px] font-medium tracking-wide text-faint uppercase [writing-mode:vertical-rl]"
      >
        Outcome →
      </span>
      <div
        className="grid grid-cols-2 gap-1.5"
        role="list"
        aria-label="Luck versus skill quadrants"
      >
        {CELLS.map(({ q, sub }) => {
          const isActive = q === active
          return (
            <motion.div
              key={q}
              role="listitem"
              aria-current={isActive || undefined}
              initial={reduced ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: isActive ? 0.35 : 0.1, duration: 0.5 }}
              className={cn(
                'rounded-lg border p-2.5 sm:p-3',
                isActive
                  ? 'border-accent bg-accent-soft text-accent-text'
                  : 'border-line border-dashed text-muted',
              )}
            >
              <p className={cn('font-display text-sm sm:text-base', isActive && 'font-semibold')}>
                {q}
                {isActive && <span className="sr-only"> (this decision)</span>}
              </p>
              <p className="mt-0.5 text-[11px] leading-tight sm:text-xs">{sub}</p>
            </motion.div>
          )
        })}
      </div>
      <p
        aria-hidden
        className="col-start-2 mt-1.5 text-center text-[11px] font-medium tracking-wide text-faint uppercase"
      >
        Decision quality →
      </p>
    </div>
  )
}
