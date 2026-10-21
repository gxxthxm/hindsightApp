import { format, parseISO } from 'date-fns'
import { ArrowLeft, ArrowRight, CalendarClock, Pencil, Trash2 } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { DecisionForm } from '@/components/DecisionForm'
import { Dot } from '@/components/Meta'
import { QuadrantGrid } from '@/components/QuadrantGrid'
import { StatusPill } from '@/components/StatusPill'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { confidenceLabel } from '@/lib/confidence'
import { dueLabel, effectiveReviewDate, getStatus, reviewInLabel } from '@/lib/status'
import { hitScore, quadrantFor } from '@/lib/stats'
import type { Decision, Review } from '@/lib/types'
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
    <article className="space-y-6">
      <Link
        to="/decisions"
        className="inline-flex items-center gap-1.5 rounded text-sm text-muted hover:text-ink"
      >
        <ArrowLeft className="size-4" aria-hidden /> All decisions
      </Link>

      <header className="space-y-3">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted">
          <StatusPill status={status} />
          <span>{decision.category}</span>
          <Dot />
          <span>{decision.stakes} stakes</span>
          {decision.mood && (
            <>
              <Dot />
              <span>Felt {decision.mood.toLowerCase()}</span>
            </>
          )}
        </div>
        <h1 className="font-display text-3xl leading-tight font-medium sm:text-4xl">
          {decision.title}
        </h1>
        <div className="flex flex-wrap gap-2">
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

      <div className="grid gap-4 md:grid-cols-2 md:gap-6">
        <Then decision={decision} />
        <Now decision={decision} status={status} now={now} />
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
    <Card className={cn('p-5 sm:p-6', tone === 'muted' && 'bg-surface-2 shadow-none')}>
      <h2 className="font-display text-2xl font-medium">{label}</h2>
      <p className="text-sm text-muted">{sub}</p>
      <dl className="mt-5 grid grid-cols-2 gap-x-4 gap-y-5">{children}</dl>
    </Card>
  )
}

function Item({ label, children, half }: { label: string; children: ReactNode; half?: boolean }) {
  return (
    <div className={half ? 'col-span-1' : 'col-span-2'}>
      <dt className="text-xs font-medium tracking-wide text-faint uppercase">{label}</dt>
      <dd className="mt-1 leading-relaxed">{children}</dd>
    </div>
  )
}

function Then({ decision }: { decision: Decision }) {
  return (
    <Column label="Then" sub={`Logged ${format(parseISO(decision.createdAt), 'd MMMM yyyy')}`}>
      <Item label="Expected outcome">
        <p className="font-display text-lg leading-snug">{decision.expectedOutcome}</p>
      </Item>
      <Item label="Confidence">
        <span className="tabular font-display text-2xl font-medium">{decision.confidence}%</span>
        <span className="ml-2 text-muted">{confidenceLabel(decision.confidence)}</span>
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
      <Card className="flex flex-col items-start justify-center border-dashed p-5 shadow-none sm:p-6">
        <h2 className="font-display text-2xl font-medium">Now</h2>
        <CalendarClock className="mt-6 size-8 text-faint" aria-hidden />
        {status === 'due' ? (
          <>
            <p className="mt-3 font-display text-xl">It’s time to look back.</p>
            <p className="mt-1 text-muted">
              This review was {dueLabel(decision, now)}. How did it go?
            </p>
            <Button asChild className="mt-5">
              <Link to={`/decisions/${decision.id}/review`}>
                Review now <ArrowRight aria-hidden />
              </Link>
            </Button>
          </>
        ) : (
          <>
            <p className="mt-3 font-display text-xl">Not yet.</p>
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
        <p className="font-display text-xl font-medium text-accent-text">{quadrant}</p>
        <QuadrantGrid active={quadrant} className="mt-3 max-w-xs" />
      </Item>
      {r.lesson && (
        <Item label="Lesson">
          <p className="font-display text-lg leading-snug italic">“{r.lesson}”</p>
        </Item>
      )}
    </Column>
  )
}

function Rating({ value }: { value: number }) {
  return (
    <span className="flex items-center gap-2">
      <span className="tabular font-display text-2xl font-medium">{value}</span>
      <span className="text-sm text-muted">/ 5</span>
      <span className="ml-1 flex gap-0.5" aria-hidden>
        {[1, 2, 3, 4, 5].map((i) => (
          <span
            key={i}
            className={cn('h-1.5 w-3 rounded-full', i <= value ? 'bg-accent' : 'bg-line')}
          />
        ))}
      </span>
    </span>
  )
}
