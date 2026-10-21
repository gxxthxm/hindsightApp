import { format, parseISO } from 'date-fns'
import { ArrowLeft, ArrowRight, CalendarClock, Pencil, Trash2 } from 'lucide-react'
import { motion } from 'framer-motion'
import { useState, type ReactNode } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { DecisionForm } from '@/components/DecisionForm'
import { ConfidenceMeter } from '@/components/ConfidenceMeter'
import { RevealWords } from '@/components/motion'
import { QuadrantGrid } from '@/components/QuadrantGrid'
import { StatusPill } from '@/components/StatusPill'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { confidenceLabel } from '@/lib/confidence'
import { dueLabel, effectiveReviewDate, getStatus, reviewInLabel } from '@/lib/status'
import { hitScore, quadrantFor } from '@/lib/stats'
import type { Decision, Review } from '@/lib/types'
import { EASE, SPRING } from '@/lib/motion'
import { cn } from '@/lib/utils'
import { useDecision, useDecisions } from '@/store/decisions'
import { toast } from '@/store/toast'
import { NotFound } from './NotFound'
import { usePageTitle } from './usePageTitle'

export function DecisionDetail() {
  const { id } = useParams()
  const decision = useDecision(id)
  const navigate = useNavigate()
  const [editing, setEditing] = useState(false)
  const updateDecision = useDecisions((s) => s.updateDecision)
  const deleteDecision = useDecisions((s) => s.deleteDecision)
  const restoreDecision = useDecisions((s) => s.restoreDecision)
  usePageTitle(decision?.title)

  if (!decision) return <NotFound />
  const now = new Date()
  const status = getStatus(decision, now)

  const handleDelete = () => {
    // Leave the page first so it never renders a "not found" state mid-delete.
    navigate('/decisions')
    const removed = deleteDecision(decision.id)
    if (!removed) return
    toast({
      title: 'Decision deleted',
      description: `“${removed.decision.title}”`,
      action: { label: 'Undo', onClick: () => restoreDecision(removed.decision, removed.index) },
    })
  }

  return (
    <article className="space-y-10 sm:space-y-14">
      <Link
        to="/decisions"
        className="group inline-flex items-center gap-1.5 rounded text-sm text-muted hover:text-ink"
      >
        <ArrowLeft
          className="size-4 transition-transform duration-300 group-hover:-translate-x-1"
          aria-hidden
        />{' '}
        All decisions
      </Link>

      <header className="-mt-4 space-y-6 sm:-mt-6">
        <div className="eyebrow flex flex-wrap items-center gap-x-3 gap-y-2">
          <StatusPill status={status} />
          <span>{decision.category}</span>
          <span aria-hidden>/</span>
          <span>{decision.stakes} stakes</span>
          {decision.mood && (
            <>
              <span aria-hidden>/</span>
              <span>Felt {decision.mood.toLowerCase()}</span>
            </>
          )}
        </div>
        <h1 className="max-w-4xl font-display text-[42px] leading-[1] tracking-[-0.02em] sm:text-[62px]">
          <RevealWords>{[decision.title]}</RevealWords>
        </h1>
        <div className="flex flex-wrap gap-2.5">
          {status === 'due' && (
            <Button asChild>
              <Link to={`/decisions/${decision.id}/review`}>
                Review now <ArrowRight aria-hidden />
              </Link>
            </Button>
          )}
          <Button variant="secondary" onClick={() => setEditing(true)}>
            <Pencil aria-hidden /> Edit
          </Button>
          <Button variant="danger" onClick={handleDelete}>
            <Trash2 aria-hidden /> Delete
          </Button>
        </div>
      </header>

      <div className="relative grid gap-5 md:grid-cols-2 md:gap-8">
        <motion.div
          initial={{ opacity: 0, x: -24 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7, ease: EASE, delay: 0.15 }}
        >
          <Then decision={decision} />
        </motion.div>
        <motion.span
          aria-hidden
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ ...SPRING, delay: 0.5 }}
          className="absolute top-20 left-1/2 z-10 hidden size-11 -translate-x-1/2 items-center justify-center rounded-full border border-line bg-surface text-accent-text shadow-lift md:flex"
        >
          <ArrowRight className="size-4" />
        </motion.span>
        <motion.div
          initial={{ opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7, ease: EASE, delay: 0.3 }}
        >
          <Now decision={decision} status={status} now={now} />
        </motion.div>
      </div>

      <Dialog open={editing} onOpenChange={setEditing}>
        <DialogContent
          title="Edit decision"
          description="Fix typos or add detail. Your original belief stays honest."
        >
          <DecisionForm
            initial={decision}
            submitLabel="Save changes"
            onCancel={() => setEditing(false)}
            onSubmit={(input) => {
              const reviewMoved = input.reviewAt !== decision.reviewAt
              updateDecision(decision.id, {
                ...input,
                snoozedUntil: reviewMoved ? undefined : decision.snoozedUntil,
              })
              setEditing(false)
              toast({ title: 'Changes saved' })
            }}
          />
        </DialogContent>
      </Dialog>
    </article>
  )
}

function Column({
  label,
  sub,
  children,
  tone,
}: {
  label: string
  sub: string
  children: ReactNode
  tone?: 'muted'
}) {
  return (
    <Card
      className={cn(
        'h-full p-6 sm:p-9',
        tone === 'muted' ? 'border-line bg-surface-2/70 shadow-none' : 'shadow-lift',
      )}
    >
      <p className="eyebrow">{sub}</p>
      <h2 className="mt-1 font-display text-[44px] leading-none italic">{label}</h2>
      <dl className="mt-8 grid grid-cols-2 gap-x-5 gap-y-7">{children}</dl>
    </Card>
  )
}

function Item({ label, children, half }: { label: string; children: ReactNode; half?: boolean }) {
  return (
    <div className={half ? 'col-span-1' : 'col-span-2'}>
      <dt className="eyebrow">{label}</dt>
      <dd className="mt-2 leading-relaxed">{children}</dd>
    </div>
  )
}

function Then({ decision }: { decision: Decision }) {
  return (
    <Column
      tone="muted"
      label="Then"
      sub={`Logged ${format(parseISO(decision.createdAt), 'd MMMM yyyy')}`}
    >
      <Item label="Expected outcome">
        <p className="border-l-2 border-accent pl-4 font-display text-[23px] leading-snug">
          {decision.expectedOutcome}
        </p>
      </Item>
      <Item label="Confidence">
        <div className="flex items-center gap-4">
          <span className="tabular font-display text-5xl leading-none">{decision.confidence}%</span>
          <div className="flex-1">
            <p className="text-sm text-muted">{confidenceLabel(decision.confidence)}</p>
            <ConfidenceMeter value={decision.confidence} className="mt-2 max-w-48 bg-line" />
          </div>
        </div>
      </Item>
      {decision.context && <Item label="Context">{decision.context}</Item>}
      {decision.options.length > 0 && (
        <Item label="Options considered">
          <ul className="mt-1 space-y-1.5">
            {decision.options.map((o) => {
              const picked = o === decision.chosen
              return (
                <li
                  key={o}
                  className={cn('flex items-start gap-2', picked ? 'font-medium' : 'text-muted')}
                >
                  <span
                    aria-hidden
                    className={cn(
                      'mt-2 size-1.5 shrink-0 rounded-full',
                      picked ? 'bg-accent' : 'bg-line-strong',
                    )}
                  />
                  <span>
                    {o}
                    {picked && (
                      <span className="ml-1.5 text-xs font-medium text-accent-text">(chosen)</span>
                    )}
                  </span>
                </li>
              )
            })}
          </ul>
        </Item>
      )}
      {decision.reasoning && <Item label="Reasoning">{decision.reasoning}</Item>}
    </Column>
  )
}

const HAPPENED_TEXT: Record<Review['happened'], string> = {
  Yes: 'Yes, it happened',
  Partly: 'Partly',
  No: 'No, it didn’t',
}

function Now({
  decision,
  status,
  now,
}: {
  decision: Decision
  status: ReturnType<typeof getStatus>
  now: Date
}) {
  if (!decision.review) {
    const date = format(effectiveReviewDate(decision), 'EEEE d MMMM')
    return (
      <Card className="flex h-full flex-col items-start justify-center border-dashed border-line-strong bg-transparent p-6 shadow-none sm:p-9">
        <p className="eyebrow">{status === 'due' ? 'Waiting on you' : 'Still playing out'}</p>
        <h2 className="mt-1 font-display text-[44px] leading-none italic">Now</h2>
        <CalendarClock className="mt-10 size-9 text-accent-text" aria-hidden />
        {status === 'due' ? (
          <>
            <p className="mt-4 font-display text-[32px] leading-tight">It’s time to look back.</p>
            <p className="mt-1 text-muted">
              This review was {dueLabel(decision, now)}. How did it go?
            </p>
            <Button asChild size="lg" className="mt-7">
              <Link to={`/decisions/${decision.id}/review`}>
                Review now <ArrowRight aria-hidden />
              </Link>
            </Button>
          </>
        ) : (
          <>
            <p className="mt-4 font-display text-[32px] leading-tight">Not yet.</p>
            <p className="mt-1 text-muted">
              We’ll ask you on {date} ({reviewInLabel(decision, now)}). Until then, let it play out.
            </p>
            <Button asChild variant="link" className="mt-3 h-auto">
              <Link to={`/decisions/${decision.id}/review`}>Review early</Link>
            </Button>
          </>
        )}
      </Card>
    )
  }

  const r = decision.review
  const quadrant = quadrantFor(r.decisionQuality, r.outcomeQuality)
  const score = hitScore(r.happened)
  return (
    <Column label="Now" sub={`Reviewed ${format(parseISO(r.reviewedAt), 'd MMMM yyyy')}`}>
      <Item label="What happened">{r.whatHappened}</Item>
      <Item label="Did the expected outcome happen?">
        <span
          className={cn(
            'inline-flex items-center rounded-full border px-2.5 py-0.5 text-sm font-medium',
            score === 1 && 'border-good/30 bg-good-soft text-good',
            score === 0.5 && 'border-line-strong bg-surface-2 text-ink',
            score === 0 && 'border-danger/30 bg-danger-soft text-danger',
          )}
        >
          {HAPPENED_TEXT[r.happened]}
        </span>
        <span className="ml-2 text-sm text-muted">at {decision.confidence}% confidence</span>
      </Item>
      <Item label="Outcome" half>
        <Rating value={r.outcomeQuality} />
      </Item>
      <Item label="Decision" half>
        <Rating value={r.decisionQuality} />
      </Item>
      <Item label="Verdict">
        <p className="font-display text-[34px] leading-none text-accent-text italic">{quadrant}</p>
        <QuadrantGrid active={quadrant} className="mt-5 max-w-sm" />
      </Item>
      {r.lesson && (
        <Item label="Lesson">
          <p className="font-display text-[26px] leading-snug italic">“{r.lesson}”</p>
        </Item>
      )}
    </Column>
  )
}

function Rating({ value }: { value: number }) {
  return (
    <span className="flex items-center gap-2">
      <span className="tabular font-display text-4xl leading-none">{value}</span>
      <span className="text-sm text-muted">/ 5</span>
      <span className="ml-1 flex gap-0.5" aria-hidden>
        {[1, 2, 3, 4, 5].map((i) => (
          <span
            key={i}
            className={cn('h-2 w-3.5 rounded-full', i <= value ? 'bg-accent' : 'bg-line')}
          />
        ))}
      </span>
    </span>
  )
}
