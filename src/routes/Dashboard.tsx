import { format } from 'date-fns'
import { ArrowRight, Plus } from 'lucide-react'
import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { DecisionRow } from '@/components/DecisionRow'
import { ReviewQueue } from '@/components/ReviewQueue'
import { StatCard } from '@/components/StatCard'
import { Button } from '@/components/ui/button'
import { Card, SectionHeading } from '@/components/ui/card'
import { dueQueue, effectiveReviewDate, getStatus } from '@/lib/status'
import { hitRate, reviewCompletionRate } from '@/lib/stats'
import { useDecisions } from '@/store/decisions'
import { usePageTitle } from './usePageTitle'

function greeting(now: Date) {
  const h = now.getHours()
  if (h < 5) return 'Up late'
  if (h < 12) return 'Good morning'
  if (h < 18) return 'Good afternoon'
  return 'Good evening'
}

export function Dashboard() {
  usePageTitle()
  const decisions = useDecisions((s) => s.decisions)
  const now = useMemo(() => new Date(), [])

  const queue = useMemo(() => dueQueue(decisions, now), [decisions, now])
  const recent = useMemo(
    () => [...decisions].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 5),
    [decisions],
  )
  const nextUp = useMemo(
    () =>
      decisions
        .filter((d) => getStatus(d, now) === 'open')
        .sort((a, b) => effectiveReviewDate(a).getTime() - effectiveReviewDate(b).getTime())[0],
    [decisions, now],
  )
  const rate = hitRate(decisions)
  const completion = reviewCompletionRate(decisions, now)
  const reviewedCount = decisions.filter((d) => d.review).length

  const subtitle =
    queue.length === 0
      ? 'Your journal is up to date. What are you deciding today?'
      : queue.length === 1
        ? 'One decision is waiting for a verdict.'
        : `${queue.length} decisions are waiting for a verdict.`

  return (
    <div className="space-y-10">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm text-muted">{format(now, 'EEEE d MMMM')}</p>
          <h1 className="mt-1 font-display text-3xl font-medium sm:text-4xl">{greeting(now)}.</h1>
          <p className="mt-1.5 text-muted">{subtitle}</p>
        </div>
        <Button asChild size="lg" className="w-full sm:w-auto">
          <Link to="/new">
            <Plus aria-hidden />
            Log a decision
          </Link>
        </Button>
      </header>

      <ReviewQueue queue={queue} nextUp={nextUp} now={now} />

      <section aria-labelledby="stats-heading">
        <h2 id="stats-heading" className="sr-only">
          At a glance
        </h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
          <StatCard
            label="Decisions logged"
            value={decisions.length}
            hint={`${reviewedCount} reviewed so far`}
          />
          <StatCard
            label="Hit rate"
            value={rate === null ? null : rate * 100}
            suffix="%"
            hint="How often what you expected happened"
          />
          <StatCard
            label="Review completion"
            value={completion === null ? null : completion * 100}
            suffix="%"
            hint="Of decisions whose review date has come"
            className="col-span-2 sm:col-span-1"
          />
        </div>
      </section>

      <section aria-labelledby="recent-heading">
        <div className="mb-3 flex items-center justify-between">
          <SectionHeading id="recent-heading">Recent decisions</SectionHeading>
          <Link
            to="/decisions"
            className="inline-flex items-center gap-1 rounded text-sm font-medium text-accent-text underline-offset-4 hover:underline"
          >
            View all <ArrowRight className="size-4" aria-hidden />
          </Link>
        </div>
        {recent.length === 0 ? (
          <Card className="px-6 py-10 text-center text-muted">
            No decisions yet. Press{' '}
            <kbd className="rounded border border-line px-1.5 text-ink">N</kbd> to log your first.
          </Card>
        ) : (
          <Card className="overflow-hidden">
            <ul className="divide-y divide-line">
              {recent.map((d) => (
                <DecisionRow key={d.id} decision={d} now={now} />
              ))}
            </ul>
          </Card>
        )}
      </section>
    </div>
  )
}
