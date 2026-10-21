import { format } from 'date-fns'
import { motion } from 'framer-motion'
import { ArrowRight, ArrowUpRight, Plus } from 'lucide-react'
import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { DecisionRow } from '@/components/DecisionRow'
import { Reveal, RevealWords, Stagger } from '@/components/motion'
import { ReviewQueue } from '@/components/ReviewQueue'
import { StatCard } from '@/components/StatCard'
import { Button } from '@/components/ui/button'
import { Card, SectionHeader } from '@/components/ui/card'
import { EASE, staggerContainer } from '@/lib/motion'
import { dueQueue, effectiveReviewDate, getStatus } from '@/lib/status'
import {
  calibrationInsight,
  hitRate,
  MIN_REVIEWS_FOR_INSIGHTS,
  reviewCompletionRate,
} from '@/lib/stats'
import { useDecisions } from '@/store/decisions'
import { usePageTitle } from './usePageTitle'

const WORDS = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine']

function greeting(now: Date) {
  const h = now.getHours()
  if (h < 5) return 'Up late'
  if (h < 12) return 'Good morning'
  if (h < 18) return 'Good afternoon'
  return 'Good evening'
}

function capitalise(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1)
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
  const insight = reviewedCount >= MIN_REVIEWS_FOR_INSIGHTS ? calibrationInsight(decisions) : null

  const n = queue.length
  const count = n < WORDS.length ? WORDS[n] : String(n)
  const headline =
    n === 0
      ? [`${greeting(now)}. `, <em key="em">You’re all caught up.</em>]
      : [
          `${greeting(now)}. `,
          <em key="em">
            {capitalise(count)} decision{n === 1 ? '' : 's'}
          </em>,
          ` ${n === 1 ? 'is' : 'are'} waiting for a verdict.`,
        ]

  return (
    <div className="space-y-16 sm:space-y-24">
      <header className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-4xl">
          <motion.p
            className="eyebrow"
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, ease: EASE }}
          >
            {format(now, 'EEEE · d MMMM yyyy')}
          </motion.p>
          <h1 className="mt-4 font-display text-[46px] leading-[0.98] tracking-[-0.02em] sm:text-[68px] lg:text-[80px] [&_em]:text-accent-text">
            <RevealWords>{headline}</RevealWords>
          </h1>
        </div>
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: EASE, delay: 0.45 }}
          className="shrink-0"
        >
          <Button asChild size="xl" className="group w-full sm:w-auto">
            <Link to="/new">
              <Plus
                className="transition-transform duration-300 group-hover:rotate-90"
                aria-hidden
              />
              Log a decision
              <kbd className="ml-1 rounded-md border border-accent-ink/30 px-1.5 font-mono text-[11px] opacity-80">
                N
              </kbd>
            </Link>
          </Button>
        </motion.div>
      </header>

      <div className="grid gap-14 lg:grid-cols-[minmax(0,1fr)_300px] lg:gap-10 xl:grid-cols-[minmax(0,1fr)_340px] xl:gap-14">
        <ReviewQueue queue={queue} nextUp={nextUp} now={now} />

        <section aria-labelledby="glance-heading">
          <SectionHeader id="glance-heading" index="02" title="At a glance" />
          <Stagger className="grid grid-cols-2 gap-3 sm:gap-4" stagger={0.1}>
            <Reveal>
              <StatCard
                label="Logged"
                value={decisions.length}
                hint={`${reviewedCount} reviewed`}
              />
            </Reveal>
            <Reveal>
              <StatCard
                label="Hit rate"
                value={rate === null ? null : rate * 100}
                suffix="%"
                hint="Expected outcome came true"
              />
            </Reveal>
            <Reveal className="col-span-2">
              <StatCard
                tone="inverse"
                label="Review completion"
                value={completion === null ? null : completion * 100}
                suffix="%"
                hint="Of decisions whose review date has come"
              />
            </Reveal>
            {insight && (
              <Reveal className="col-span-2">
                <Link
                  to="/insights"
                  className="group relative block overflow-hidden rounded-3xl bg-accent p-5 text-accent-ink shadow-card transition-shadow duration-300 hover:shadow-lift sm:p-6"
                >
                  <span
                    aria-hidden
                    className="absolute -top-10 -right-10 size-36 rounded-full bg-accent-bright/40 blur-2xl transition-transform duration-700 group-hover:scale-150"
                  />
                  <p className="eyebrow relative text-current opacity-90">Calibration</p>
                  <p className="relative mt-3 font-display text-[22px] leading-snug italic">
                    {insight}
                  </p>
                  <p className="relative mt-4 inline-flex items-center gap-1.5 text-sm font-medium">
                    See insights
                    <ArrowUpRight
                      className="size-4 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                      aria-hidden
                    />
                  </p>
                </Link>
              </Reveal>
            )}
          </Stagger>
        </section>
      </div>

      <section aria-labelledby="recent-heading">
        <SectionHeader
          id="recent-heading"
          index="03"
          title="Recent decisions"
          action={
            <Link
              to="/decisions"
              className="group inline-flex items-center gap-1.5 rounded text-sm font-medium text-accent-text"
            >
              View all
              <ArrowRight
                className="size-4 transition-transform duration-300 group-hover:translate-x-1"
                aria-hidden
              />
            </Link>
          }
        />
        {recent.length === 0 ? (
          <Card className="px-6 py-14 text-center text-muted">
            No decisions yet. Press{' '}
            <kbd className="rounded-md border border-line px-1.5 font-mono text-ink">N</kbd> to log
            your first.
          </Card>
        ) : (
          <Card className="overflow-hidden">
            <motion.ul
              className="divide-y divide-line"
              variants={staggerContainer}
              custom={0.06}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, margin: '0px 0px -10% 0px' }}
            >
              {recent.map((d) => (
                <DecisionRow key={d.id} decision={d} now={now} />
              ))}
            </motion.ul>
          </Card>
        )}
      </section>
    </div>
  )
}
