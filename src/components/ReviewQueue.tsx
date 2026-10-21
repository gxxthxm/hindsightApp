import { addDays, format, parseISO } from 'date-fns'
import {
  AnimatePresence,
  motion,
  useMotionValue,
  useReducedMotion,
  useTransform,
  type Variants,
} from 'framer-motion'
import { AlarmClockOff, ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react'
import { useState, type Ref } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { SectionHeader } from '@/components/ui/card'
import { confidenceLabel } from '@/lib/confidence'
import { EASE, SOFT_SPRING } from '@/lib/motion'
import { dueLabel, reviewInLabel } from '@/lib/status'
import type { Decision } from '@/lib/types'
import { useDecisions } from '@/store/decisions'
import { toast } from '@/store/toast'
import { ConfidenceMeter } from './ConfidenceMeter'

interface ReviewQueueProps {
  queue: Decision[]
  nextUp?: Decision
  now: Date
}

const LAYER_OFFSET = 14

const cardVariants: Variants = {
  enter: { y: 34, scale: 0.94, opacity: 0 },
  center: { y: 0, scale: 1, opacity: 1, transition: { duration: 0.55, ease: EASE } },
  exit: (dir: number) => ({
    x: dir * 460,
    rotate: dir * 9,
    opacity: 0,
    transition: { duration: 0.45, ease: EASE },
  }),
}

export function ReviewQueue({ queue, nextUp, now }: ReviewQueueProps) {
  const [rawIndex, setIndex] = useState(0)
  const [exitDir, setExitDir] = useState<1 | -1>(-1)
  const snooze = useDecisions((s) => s.snooze)
  const updateDecision = useDecisions((s) => s.updateDecision)

  if (queue.length === 0) return <EmptyQueue nextUp={nextUp} now={now} />

  const index = Math.min(rawIndex, queue.length - 1)
  const current = queue[index]
  const behind = [1, 2]
    .filter((offset) => offset < queue.length)
    .map((offset) => queue[(index + offset) % queue.length])

  /** Advance (1) or go back (-1); the card leaves in `dir`. */
  const go = (delta: 1 | -1, dir: 1 | -1 = delta === 1 ? -1 : 1) => {
    if (queue.length < 2) return
    setExitDir(dir)
    setIndex((index + delta + queue.length) % queue.length)
  }

  const handleSnooze = () => {
    const previous = current.snoozedUntil
    setExitDir(1)
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
      <SectionHeader
        id="queue-heading"
        index="01"
        title={
          <>
            Due for review
            <span className="tabular ml-2 align-super font-mono text-sm text-accent-text">
              {queue.length}
            </span>
          </>
        }
        action={
          queue.length > 1 && (
            <div className="flex items-center gap-1">
              <span className="tabular mr-2 font-mono text-xs text-muted" aria-live="polite">
                {String(index + 1).padStart(2, '0')} / {String(queue.length).padStart(2, '0')}
              </span>
              <Button
                variant="secondary"
                size="icon-sm"
                onClick={() => go(-1)}
                aria-label="Previous due decision"
              >
                <ChevronLeft aria-hidden />
              </Button>
              <Button
                variant="secondary"
                size="icon-sm"
                onClick={() => go(1)}
                aria-label="Next due decision"
              >
                <ChevronRight aria-hidden />
              </Button>
            </div>
          )
        }
      />

      <div className="relative" style={{ paddingBottom: behind.length * LAYER_OFFSET }}>
        {/* The next cards in the deck, peeking out underneath. */}
        {[...behind].reverse().map((d) => {
          const depth = behind.indexOf(d) + 1
          return (
            <motion.div
              key={d.id}
              aria-hidden
              className="absolute inset-x-0 top-0 bottom-0 overflow-hidden rounded-3xl border border-line bg-surface shadow-card"
              style={{ transformOrigin: 'bottom center', zIndex: 3 - depth }}
              initial={false}
              animate={{
                // Bottom edge sits `depth` offsets below the top card.
                y: (depth - behind.length) * LAYER_OFFSET,
                scale: 1 - depth * 0.045,
                opacity: 1 - depth * 0.22,
              }}
              transition={SOFT_SPRING}
            />
          )
        })}

        <AnimatePresence initial={false} custom={exitDir} mode="popLayout">
          <QueueCard
            key={current.id}
            decision={current}
            now={now}
            canBrowse={queue.length > 1}
            onSwipe={(dir) => go(1, dir)}
            onSnooze={handleSnooze}
          />
        </AnimatePresence>
      </div>
    </section>
  )
}

interface QueueCardProps {
  decision: Decision
  now: Date
  canBrowse: boolean
  onSwipe: (dir: 1 | -1) => void
  onSnooze: () => void
  ref?: Ref<HTMLElement>
}

function QueueCard({ decision, now, canBrowse, onSwipe, onSnooze, ref }: QueueCardProps) {
  const reduced = useReducedMotion()
  const x = useMotionValue(0)
  const rotate = useTransform(x, [-300, 300], [-7, 7])

  return (
    <motion.article
      ref={ref}
      variants={cardVariants}
      initial="enter"
      animate="center"
      exit="exit"
      style={{ x, rotate, zIndex: 10 }}
      drag={canBrowse && !reduced ? 'x' : false}
      dragSnapToOrigin
      dragElastic={0.7}
      onDragEnd={(_, info) => {
        if (Math.abs(info.offset.x) > 130 || Math.abs(info.velocity.x) > 650) {
          onSwipe(info.offset.x > 0 ? 1 : -1)
        }
      }}
      whileDrag={{ scale: 1.015, cursor: 'grabbing' }}
      className="relative overflow-hidden rounded-3xl border border-line bg-surface p-6 shadow-lift select-none sm:p-10"
      aria-labelledby={`queue-title-${decision.id}`}
    >
      {/* Oversized confidence watermark. */}
      <span
        aria-hidden
        className="pointer-events-none absolute -right-3 -bottom-12 font-display text-[170px] leading-none text-ink/[0.045] sm:-bottom-16 sm:text-[260px]"
      >
        {decision.confidence}%
      </span>

      <div className="relative">
        <p className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <span className="inline-flex h-7 items-center gap-2 rounded-full bg-accent-soft px-3 text-xs font-medium text-accent-text">
            <span className="relative flex size-2" aria-hidden>
              <span className="absolute inset-0 rounded-full bg-accent animate-[ping-soft_2s_cubic-bezier(0,0,0.2,1)_infinite]" />
              <span className="relative size-2 rounded-full bg-accent" />
            </span>
            {dueLabel(decision, now)}
          </span>
          <span className="eyebrow">
            {decision.category} / {decision.stakes} stakes
          </span>
        </p>

        <h3
          id={`queue-title-${decision.id}`}
          className="mt-6 max-w-2xl font-display text-[34px] leading-[1.02] sm:text-[46px]"
        >
          {decision.title}
        </h3>

        <blockquote className="mt-7 max-w-2xl border-l-2 border-accent pl-5">
          <p className="eyebrow">You expected</p>
          <p className="mt-1.5 font-display text-[21px] leading-snug text-ink/90 italic sm:text-2xl">
            {decision.expectedOutcome}
          </p>
        </blockquote>

        <div className="mt-7 flex flex-wrap items-center gap-x-5 gap-y-2">
          <p className="text-sm">
            <span className="tabular font-mono font-medium text-ink">{decision.confidence}%</span>
            <span className="ml-2 text-muted">{confidenceLabel(decision.confidence)}</span>
          </p>
          <ConfidenceMeter value={decision.confidence} className="w-36" />
          <p className="eyebrow">Logged {format(parseISO(decision.createdAt), 'd MMM')}</p>
        </div>

        <div className="mt-9 flex flex-col gap-2.5 sm:flex-row sm:items-center">
          <Button asChild size="xl" className="group sm:min-w-52">
            <Link to={`/decisions/${decision.id}/review`} draggable={false}>
              Review now
              <ArrowRight
                className="transition-transform duration-300 group-hover:translate-x-1"
                aria-hidden
              />
            </Link>
          </Button>
          <Button variant="secondary" size="xl" onClick={onSnooze}>
            <AlarmClockOff aria-hidden />
            Snooze 1 week
          </Button>
          {canBrowse && !reduced && (
            <p className="eyebrow hidden sm:ml-auto sm:block" aria-hidden>
              ← drag to browse →
            </p>
          )}
        </div>
      </div>
    </motion.article>
  )
}

function EmptyQueue({ nextUp, now }: { nextUp?: Decision; now: Date }) {
  const reduced = useReducedMotion()
  return (
    <section aria-labelledby="queue-heading">
      <SectionHeader id="queue-heading" index="01" title="Due for review" />
      <div className="relative overflow-hidden rounded-3xl border border-dashed border-line-strong px-6 py-14 text-center sm:py-20">
        <svg viewBox="0 0 64 64" className="mx-auto size-16 text-good" aria-hidden>
          <motion.circle
            cx="32"
            cy="32"
            r="28"
            fill="var(--good-soft)"
            stroke="currentColor"
            strokeWidth="2"
            initial={reduced ? false : { pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.9, ease: EASE }}
          />
          <motion.path
            d="M21 33l7 7 15-16"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={reduced ? false : { pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.6, ease: EASE, delay: 0.6 }}
          />
        </svg>
        <h3 className="mt-6 font-display text-[40px] leading-none">Nothing to review.</h3>
        <p className="mt-2 font-display text-2xl text-muted italic">Your future self thanks you.</p>
        {nextUp && (
          <p className="mt-6 text-sm text-muted">
            Next up:{' '}
            <Link
              to={`/decisions/${nextUp.id}`}
              className="font-medium text-ink underline decoration-line-strong underline-offset-4 hover:decoration-accent"
            >
              {nextUp.title}
            </Link>{' '}
            ({reviewInLabel(nextUp, now)})
          </p>
        )}
      </div>
    </section>
  )
}
