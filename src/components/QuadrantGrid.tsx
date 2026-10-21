import { motion, useReducedMotion } from 'framer-motion'
import { EASE, SPRING } from '@/lib/motion'
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
    <div className={cn('grid grid-cols-[auto_1fr] gap-x-2.5', className)}>
      <span
        aria-hidden
        className="eyebrow rotate-180 self-center text-center [writing-mode:vertical-rl]"
      >
        Outcome →
      </span>
      <div className="grid grid-cols-2 gap-2" role="list" aria-label="Luck versus skill quadrants">
        {CELLS.map(({ q, sub }, i) => {
          const isActive = q === active
          return (
            <motion.div
              key={q}
              role="listitem"
              aria-current={isActive || undefined}
              initial={reduced ? false : { opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: isActive ? 1.04 : 1 }}
              transition={
                isActive
                  ? { ...SPRING, delay: 0.55 }
                  : { duration: 0.5, ease: EASE, delay: 0.15 + i * 0.05 }
              }
              className={cn(
                'relative rounded-2xl border p-3 sm:p-3.5',
                isActive
                  ? 'z-10 border-accent bg-accent text-accent-ink shadow-lift'
                  : 'border-dashed border-line-strong text-muted',
              )}
            >
              <p className="font-display text-lg leading-tight sm:text-xl">
                {q}
                {isActive && <span className="sr-only"> (this decision)</span>}
              </p>
              <p className="mt-0.5 text-[11px] leading-tight sm:text-xs">{sub}</p>
            </motion.div>
          )
        })}
      </div>
      <p aria-hidden className="eyebrow col-start-2 mt-2 text-center">
        Decision quality →
      </p>
    </div>
  )
}
