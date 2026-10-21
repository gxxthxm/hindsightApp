import { format, parseISO } from 'date-fns'
import { ChevronRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { getStatus } from '@/lib/status'
import type { Decision } from '@/lib/types'
import { Dot } from './Meta'
import { StatusPill } from './StatusPill'

export function DecisionRow({ decision, now }: { decision: Decision; now: Date }) {
  const status = getStatus(decision, now)
  return (
    <li>
      <Link
        to={`/decisions/${decision.id}`}
        className="group flex items-center gap-3 px-4 py-3.5 transition-colors hover:bg-surface-2 focus-visible:-outline-offset-2 sm:px-5"
      >
        <div className="min-w-0 flex-1">
          <p className="font-display text-[17px] leading-snug text-ink group-hover:text-accent-text">
            {decision.title}
          </p>
          <p className="mt-1 flex flex-wrap items-center gap-x-1.5 text-sm text-muted">
            <span>{decision.category}</span>
            <Dot />
            <time dateTime={decision.createdAt}>
              {format(parseISO(decision.createdAt), 'd MMM yyyy')}
            </time>
            <Dot />
            <span className="tabular">
              <span className="sr-only">Confidence </span>
              {decision.confidence}%
            </span>
          </p>
        </div>
        <StatusPill status={status} />
        <ChevronRight className="hidden size-4 text-faint sm:block" aria-hidden />
      </Link>
    </li>
  )
}
