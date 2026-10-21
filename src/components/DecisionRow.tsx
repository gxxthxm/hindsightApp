import { format, parseISO } from 'date-fns'
import { motion } from 'framer-motion'
import { ArrowUpRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { fadeUp } from '@/lib/motion'
import { getStatus } from '@/lib/status'
import type { Decision } from '@/lib/types'
import { ConfidenceMeter } from './ConfidenceMeter'
import { StatusPill } from './StatusPill'

export function DecisionRow({ decision, now }: { decision: Decision; now: Date }) {
  const status = getStatus(decision, now)
  return (
    <motion.li variants={fadeUp} layout="position">
      <Link
        to={`/decisions/${decision.id}`}
        className="group relative flex items-center gap-4 px-5 py-4 transition-colors hover:bg-surface-2/70 focus-visible:-outline-offset-2 sm:gap-6 sm:px-7 sm:py-5"
      >
        <span
          aria-hidden
          className="absolute inset-y-3 left-0 w-[3px] origin-center scale-y-0 rounded-full bg-accent transition-transform duration-300 group-hover:scale-y-100"
        />
        <div className="min-w-0 flex-1">
          <p className="font-display text-[21px] leading-[1.15] text-ink transition-colors group-hover:text-accent-text sm:text-[23px]">
            {decision.title}
          </p>
          <p className="mt-1.5 flex flex-wrap items-center gap-x-2 font-mono text-[11px] tracking-wide text-faint uppercase">
            <span>{decision.category}</span>
            <span aria-hidden>/</span>
            <time dateTime={decision.createdAt}>
              {format(parseISO(decision.createdAt), 'd MMM yyyy')}
            </time>
            <span aria-hidden className="sm:hidden">
              /
            </span>
            <span className="tabular sm:hidden" aria-hidden>
              {decision.confidence}%
            </span>
            <span className="sr-only">Confidence {decision.confidence}%</span>
          </p>
        </div>
        <div className="hidden w-28 shrink-0 sm:block" aria-hidden>
          <p className="tabular mb-1.5 text-right font-mono text-xs text-muted">
            {decision.confidence}%
          </p>
          <ConfidenceMeter value={decision.confidence} />
        </div>
        <StatusPill status={status} />
        <ArrowUpRight
          className="hidden size-4 shrink-0 text-faint transition-all duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-accent-text sm:block"
          aria-hidden
        />
      </Link>
    </motion.li>
  )
}
