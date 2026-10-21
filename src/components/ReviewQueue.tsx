import { addDays, format, parseISO } from 'date-fns'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { AlarmClockOff, ChevronLeft, ChevronRight, Hourglass, Sparkles } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { confidenceLabel } from '@/lib/confidence'
import { dueLabel, reviewInLabel } from '@/lib/status'
import type { Decision } from '@/lib/types'
import { useDecisions } from '@/store/decisions'
import { toast } from '@/store/toast'
import { Dot } from './Meta'

interface ReviewQueueProps {
  queue: Decision[]
  nextUp?: Decision
  now: Date
}

export function ReviewQueue({ queue, nextUp, now }: ReviewQueueProps) {
  const [rawIndex, setIndex] = useState(0)
  const [direction, setDirection] = useState<1 | -1>(1)
  const reduced = useReducedMotion()
  const snooze = useDecisions((s) => s.snooze)
  const updateDecision = useDecisions((s) => s.updateDecision)

  if (queue.length === 0) return <EmptyQueue nextUp={nextUp} now={now} />

  const index = Math.min(rawIndex, queue.length - 1)
  const current = queue[index]
  const behind = Math.min(queue.length - 1, 2)

  const go = (delta: 1 | -1) => {
    setDirection(delta)
    setIndex((index + delta + queue.length) % queue.length)
  }

  const handleSnooze = () => {
    const previous = current.snoozedUntil
    setDirection(1)
    snooze(current.id)
    toast({
      title: 'Snoozed for a week',
      description: `“${current.title}” comes back on ${format(addDays(now, 7), 'EEE d MMM')}.`,
      action: {
        label: 'Undo',
        onClick: () => updateDecision(current.id, { snoozedUntil: previous }),
      },
    })
  }

  return (
    <section aria-labelledby="queue-heading">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 id="queue-heading" className="flex items-center gap-2 font-display text-xl font-medium">
          Due for review
          <span className="tabular rounded-full bg-accent px-2 py-0.5 font-sans text-xs font-semibold text-accent-ink">
            {queue.length}
          </span>
        </h2>
        {queue.length > 1 && (
          <div className="flex items-center gap-1 text-sm text-muted">
            <span className="tabular mr-1" aria-live="polite">
              {index + 1} of {queue.length}
            </span>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => go(-1)}
              aria-label="Previous due decision"
            >
              <ChevronLeft aria-hidden />
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => go(1)}
              aria-label="Next due decision"
            >
              <ChevronRight aria-hidden />
            </Button>
          </div>
        )}
      </div>

      <div className="relative" style={{ paddingBottom: behind * 10 }}>
        {/* Paper layers peeking out beneath the top card. */}
        {Array.from({ length: behind }, (_, i) => (
          <div
            key={i}
            aria-hidden
            className="absolute inset-x-0 top-0 rounded-2xl border border-line bg-surface shadow-card"
            style={{
              bottom: (behind - 1 - i) * 10,
              transform: `scale(${1 - (behind - i) * 0.035})`,
              transformOrigin: 'bottom center',
              opacity: 0.55 + i * 0.2,
            }}
          />
        ))}
        <AnimatePresence mode="popLayout" initial={false} custom={direction}>
          <motion.article
            key={current.id}
            custom={direction}
            initial={reduced ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, x: 0, y: 0 }}
            exit={
              reduced ? { opacity: 0 } : { opacity: 0, x: direction * 140, rotate: direction * 2 }
            }
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="relative rounded-2xl border border-line bg-surface p-5 shadow-card sm:p-7"
            aria-labelledby={`queue-title-${current.id}`}
          >
            <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
              <span className="inline-flex items-center gap-1.5 font-medium text-accent-text">
                <Hourglass className="size-4" aria-hidden />
                {dueLabel(current, now)}
              </span>
              <Dot />
              <span className="text-muted">{current.category}</span>
              <Dot />
              <span className="text-muted">{current.stakes} stakes</span>
            </p>
            <h3
              id={`queue-title-${current.id}`}
              className="mt-3 font-display text-2xl leading-tight font-medium sm:text-[28px]"
            >
              {current.title}
            </h3>
            <div className="mt-4 rounded-xl bg-surface-2 p-4">
              <p className="text-xs font-medium tracking-wide text-faint uppercase">You expected</p>
              <p className="mt-1 leading-relaxed">{current.expectedOutcome}</p>
              <p className="mt-2 text-sm text-muted">
                <span className="tabular font-medium text-ink">{current.confidence}% sure</span> ·{' '}
                {confidenceLabel(current.confidence)} · logged{' '}
                {format(parseISO(current.createdAt), 'd MMM')}
              </p>
            </div>
            <div className="mt-5 flex flex-col gap-2 sm:flex-row">
              <Button asChild size="lg" className="sm:flex-1">
                <Link to={`/decisions/${current.id}/review`}>Review now</Link>
              </Button>
              <Button variant="secondary" size="lg" onClick={handleSnooze}>
                <AlarmClockOff aria-hidden />
                Snooze 1 week
              </Button>
            </div>
          </motion.article>
        </AnimatePresence>
      </div>
    </section>
  )
}

function EmptyQueue({ nextUp, now }: { nextUp?: Decision; now: Date }) {
  return (
    <section
      aria-labelledby="queue-heading"
      className="rounded-2xl border border-dashed border-line-strong px-6 py-10 text-center sm:py-12"
    >
      <span className="mx-auto flex size-12 items-center justify-center rounded-full bg-good-soft text-good">
        <Sparkles className="size-6" aria-hidden />
      </span>
      <h2 id="queue-heading" className="mt-4 font-display text-2xl font-medium">
        Nothing to review.
      </h2>
      <p className="mt-1 text-muted">Your future self thanks you.</p>
      {nextUp && (
        <p className="mt-4 text-sm text-muted">
          Next up:{' '}
          <Link
            to={`/decisions/${nextUp.id}`}
            className="font-medium text-ink underline-offset-4 hover:underline"
          >
            {nextUp.title}
          </Link>{' '}
          ({reviewInLabel(nextUp, now)})
        </p>
      )}
    </section>
  )
}
