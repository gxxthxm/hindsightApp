import { motion, useReducedMotion } from 'framer-motion'
import type { GroupStat } from '@/lib/stats'
import { cn } from '@/lib/utils'

interface HitRateBarsProps<K extends string> {
  groups: GroupStat<K>[]
  overall: number
  /** Groups to call out as notably low. */
  highlight?: K
  label: string
}

/** Horizontal hit-rate bars with a marker for the overall rate. */
export function HitRateBars<K extends string>({
  groups,
  overall,
  highlight,
  label,
}: HitRateBarsProps<K>) {
  const reduced = useReducedMotion()
  if (groups.length === 0)
    return <p className="text-sm text-muted">No reviewed decisions with this tag yet.</p>

  return (
    <ul className="space-y-4" aria-label={label}>
      {groups.map((g, i) => {
        const pct = Math.round(g.hitRate * 100)
        const isLow = g.key === highlight
        return (
          <li key={g.key} className="grid grid-cols-[5.5rem_1fr_3rem] items-center gap-4 text-sm">
            <span className={cn('truncate', isLow ? 'font-medium text-ink' : 'text-muted')}>
              {g.key}
            </span>
            <span className="relative h-3 rounded-full bg-surface-2" aria-hidden>
              <motion.span
                className={cn(
                  'absolute inset-y-0 left-0 rounded-full',
                  isLow ? 'bg-danger' : 'bg-gradient-to-r from-accent to-accent-bright',
                )}
                initial={reduced ? false : { width: 0 }}
                whileInView={{ width: `${Math.max(pct, 2)}%` }}
                viewport={{ once: true }}
                style={reduced ? { width: `${Math.max(pct, 2)}%` } : undefined}
                transition={{ duration: 0.7, delay: 0.05 * i, ease: [0.16, 1, 0.3, 1] }}
              />
              <span
                className="absolute -inset-y-1 w-0.5 rounded-full bg-ink/50"
                style={{ left: `${overall * 100}%` }}
                title="Overall hit rate"
              />
            </span>
            <span className="tabular text-right">
              <span className={cn('font-display text-xl leading-none', isLow && 'text-danger')}>
                {pct}%
              </span>
              <span className="sr-only">
                {' '}
                hit rate across {g.count} decision{g.count === 1 ? '' : 's'}
                {isLow ? ', notably below your overall rate' : ''}
              </span>
              <span className="block font-mono text-[10px] text-faint" aria-hidden>
                n={g.count}
              </span>
            </span>
          </li>
        )
      })}
    </ul>
  )
}
