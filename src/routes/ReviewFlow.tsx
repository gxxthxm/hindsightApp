import { format, parseISO } from 'date-fns'
import { motion, useReducedMotion } from 'framer-motion'
import { ArrowLeft, ArrowRight, Check, X } from 'lucide-react'
import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { QuadrantGrid } from '@/components/QuadrantGrid'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { ChoiceGroup, type Choice } from '@/components/ui/choice-group'
import { Field } from '@/components/ui/field'
import { Input, Textarea } from '@/components/ui/input'
import { confidenceLabel } from '@/lib/confidence'
import { dueQueue } from '@/lib/status'
import { QUADRANT_BLURB, quadrantFor, type Quadrant } from '@/lib/stats'
import type { Decision, Happened, Rating } from '@/lib/types'
import { cn } from '@/lib/utils'
import { useDecision, useDecisions } from '@/store/decisions'
import { NotFound } from './NotFound'
import { usePageTitle } from './usePageTitle'

const STEPS = ['Then', 'What happened', 'Verdict'] as const

const HAPPENED_CHOICES: Choice<Happened>[] = [
  { value: 'Yes', label: 'Yes', hint: 'It happened' },
  { value: 'Partly', label: 'Partly', hint: 'Some of it' },
  { value: 'No', label: 'No', hint: 'It didn’t' },
]

const RATING_HINTS = ['Poor', 'Weak', 'OK', 'Good', 'Great']
const RATING_CHOICES: Choice<string>[] = RATING_HINTS.map((hint, i) => ({
  value: String(i + 1),
  label: String(i + 1),
  hint,
}))

interface Draft {
  whatHappened: string
  happened?: Happened
  outcomeQuality?: Rating
  decisionQuality?: Rating
  lesson: string
}

export function ReviewFlow() {
  const { id } = useParams()
  const decision = useDecision(id)
  const [result, setResult] = useState<{ quadrant: Quadrant; title: string } | null>(null)
  usePageTitle(decision ? `Review: ${decision.title}` : 'Review')

  if (result) return <ResultCard quadrant={result.quadrant} title={result.title} decisionId={id!} />
  if (!decision) return <NotFound />
  if (decision.review) return <AlreadyReviewed decision={decision} />
  return (
    <Stepper
      decision={decision}
      onDone={(quadrant) => setResult({ quadrant, title: decision.title })}
    />
  )
}

function Stepper({ decision, onDone }: { decision: Decision; onDone: (q: Quadrant) => void }) {
  const uid = useId()
  const navigate = useNavigate()
  const submitReview = useDecisions((s) => s.submitReview)
  const [step, setStep] = useState(0)
  const [draft, setDraft] = useState<Draft>({ whatHappened: '', lesson: '' })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const headingRef = useRef<HTMLHeadingElement>(null)
  const firstRender = useRef(true)

  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false
      return
    }
    headingRef.current?.focus()
  }, [step])

  const update = (patch: Partial<Draft>) => {
    setDraft((d) => ({ ...d, ...patch }))
    // Clear an error as soon as its field gets a value.
    setErrors((e) => {
      const next = { ...e }
      for (const key of Object.keys(patch)) delete next[key]
      return next
    })
  }

  const validateStep = (): boolean => {
    const next: Record<string, string> = {}
    if (step === 1) {
      if (!draft.whatHappened.trim()) next.whatHappened = 'A sentence or two is enough.'
      if (!draft.happened) next.happened = 'Pick one. Partly is a perfectly honest answer.'
    }
    if (step === 2) {
      if (!draft.outcomeQuality) next.outcomeQuality = 'Rate the outcome.'
      if (!draft.decisionQuality) next.decisionQuality = 'Rate the decision.'
    }
    setErrors(next)
    return Object.keys(next).length === 0
  }

  const next = () => {
    if (!validateStep()) return
    if (step < 2) return setStep(step + 1)
    const { outcomeQuality, decisionQuality, happened } = draft
    submitReview(decision.id, {
      whatHappened: draft.whatHappened.trim(),
      happened: happened!,
      outcomeQuality: outcomeQuality!,
      decisionQuality: decisionQuality!,
      lesson: draft.lesson.trim() || undefined,
    })
    onDone(quadrantFor(decisionQuality!, outcomeQuality!))
  }

  const back = () => {
    setErrors({})
    setStep(step - 1)
  }

  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault()
      next()
    }
  }

  return (
    <div className="mx-auto max-w-2xl" onKeyDown={onKeyDown}>
      <div className="mb-5 flex items-center justify-between gap-3">
        <p className="text-sm text-muted">
          Reviewing a decision from {format(parseISO(decision.createdAt), 'd MMMM yyyy')}
        </p>
        <Button variant="ghost" size="sm" onClick={() => navigate(`/decisions/${decision.id}`)}>
          <X aria-hidden />
          Exit
        </Button>
      </div>

      {/* Stepper + progress */}
      <ol
        className="mb-2 grid grid-cols-3 gap-2 text-xs font-medium sm:text-sm"
        aria-label="Review steps"
      >
        {STEPS.map((label, i) => (
          <li
            key={label}
            aria-current={i === step ? 'step' : undefined}
            className={cn('flex items-center gap-1.5', i <= step ? 'text-ink' : 'text-faint')}
          >
            <span
              className={cn(
                'tabular flex size-5 shrink-0 items-center justify-center rounded-full border text-[11px]',
                i < step && 'border-accent bg-accent text-accent-ink',
                i === step && 'border-accent text-accent-text',
                i > step && 'border-line-strong',
              )}
            >
              {i < step ? <Check className="size-3" aria-hidden /> : i + 1}
            </span>
            <span className="truncate">
              {label}
              {i < step && <span className="sr-only"> (done)</span>}
            </span>
          </li>
        ))}
      </ol>
      <div
        className="mb-6 h-1 overflow-hidden rounded-full bg-surface-2"
        role="progressbar"
        aria-label="Review progress"
        aria-valuemin={1}
        aria-valuemax={3}
        aria-valuenow={step + 1}
        aria-valuetext={`Step ${step + 1} of 3`}
      >
        <motion.div
          className="h-full rounded-full bg-accent"
          animate={{ width: `${((step + 1) / 3) * 100}%` }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
        />
      </div>

      <Card className="p-5 sm:p-7">
        {step === 0 && (
          <section aria-labelledby={`${uid}-h`}>
            <h1
              id={`${uid}-h`}
              ref={headingRef}
              tabIndex={-1}
              className="font-display text-2xl leading-tight font-medium outline-none sm:text-3xl"
            >
              {decision.title}
            </h1>
            <p className="mt-2 text-sm text-muted">
              {decision.category} · {decision.stakes} stakes
              {decision.mood && ` · felt ${decision.mood.toLowerCase()}`}
            </p>
            <dl className="mt-6 space-y-5">
              <ReadOnly label="You expected">
                <p className="font-display text-lg leading-snug">{decision.expectedOutcome}</p>
              </ReadOnly>
              <ReadOnly label="Your confidence">
                <p>
                  <span className="tabular font-display text-2xl font-medium">
                    {decision.confidence}%
                  </span>
                  <span className="ml-2 text-muted">{confidenceLabel(decision.confidence)}</span>
                </p>
              </ReadOnly>
              {decision.chosen && <ReadOnly label="You chose">{decision.chosen}</ReadOnly>}
              {decision.reasoning && (
                <ReadOnly label="Because">
                  <p className="leading-relaxed text-muted">{decision.reasoning}</p>
                </ReadOnly>
              )}
            </dl>
            <p className="mt-6 rounded-lg bg-surface-2 p-3 text-sm text-muted">
              Read it as it was written. Try not to rewrite what you believed then.
            </p>
          </section>
        )}

        {step === 1 && (
          <section aria-labelledby={`${uid}-h`} className="space-y-6">
            <h1
              id={`${uid}-h`}
              ref={headingRef}
              tabIndex={-1}
              className="font-display text-2xl font-medium outline-none"
            >
              What actually happened?
            </h1>
            <Field
              label="In a sentence or two"
              htmlFor={`${uid}-what`}
              error={errors.whatHappened}
              errorId={`${uid}-what-err`}
            >
              <Textarea
                id={`${uid}-what`}
                value={draft.whatHappened}
                onChange={(e) => update({ whatHappened: e.target.value })}
                rows={3}
                autoFocus
                aria-invalid={Boolean(errors.whatHappened)}
                aria-describedby={errors.whatHappened ? `${uid}-what-err` : undefined}
              />
            </Field>
            <div>
              <p id={`${uid}-happened`} className="mb-1.5 text-sm font-medium">
                Did the expected outcome happen?
              </p>
              <p className="mb-3 text-sm text-muted">“{decision.expectedOutcome}”</p>
              <ChoiceGroup
                value={draft.happened}
                onChange={(happened) => update({ happened })}
                choices={HAPPENED_CHOICES}
                ariaLabelledBy={`${uid}-happened`}
                ariaDescribedBy={errors.happened ? `${uid}-happened-err` : undefined}
                invalid={Boolean(errors.happened)}
                className="grid-cols-3"
              />
              {errors.happened && (
                <p
                  id={`${uid}-happened-err`}
                  role="alert"
                  className="mt-1.5 text-sm font-medium text-danger"
                >
                  {errors.happened}
                </p>
              )}
            </div>
          </section>
        )}

        {step === 2 && (
          <section aria-labelledby={`${uid}-h`} className="space-y-7">
            <div>
              <h1
                id={`${uid}-h`}
                ref={headingRef}
                tabIndex={-1}
                className="font-display text-2xl font-medium outline-none"
              >
                Separate luck from judgment
              </h1>
              <p className="mt-1.5 text-sm text-muted">
                Rate these on their own. A good call can go badly, and a bad one can get lucky.
              </p>
            </div>
            <RatingQuestion
              id={`${uid}-outcome`}
              label="How good was the outcome?"
              hint="However it came about."
              value={draft.outcomeQuality}
              onChange={(outcomeQuality) => update({ outcomeQuality })}
              error={errors.outcomeQuality}
            />
            <RatingQuestion
              id={`${uid}-decision`}
              label="How good was the decision?"
              hint="Given only what you knew at the time."
              value={draft.decisionQuality}
              onChange={(decisionQuality) => update({ decisionQuality })}
              error={errors.decisionQuality}
            />
            <Field label="Lesson learned" htmlFor={`${uid}-lesson`} optional>
              <Input
                id={`${uid}-lesson`}
                value={draft.lesson}
                onChange={(e) => update({ lesson: e.target.value })}
                placeholder="One line for next time"
                autoComplete="off"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    next()
                  }
                }}
              />
            </Field>
          </section>
        )}

        <div className="mt-8 flex items-center justify-between gap-3 border-t border-line pt-5">
          {step > 0 ? (
            <Button variant="ghost" onClick={back}>
              <ArrowLeft aria-hidden />
              Back
            </Button>
          ) : (
            <span />
          )}
          <Button size="lg" onClick={next} autoFocus={step === 0}>
            {step === 0 ? 'Start review' : step === 1 ? 'Continue' : 'Save review'}
            {step < 2 ? <ArrowRight aria-hidden /> : <Check aria-hidden />}
          </Button>
        </div>
      </Card>
    </div>
  )
}

function ReadOnly({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <dt className="text-xs font-medium tracking-wide text-faint uppercase">{label}</dt>
      <dd className="mt-1">{children}</dd>
    </div>
  )
}

function RatingQuestion({
  id,
  label,
  hint,
  value,
  onChange,
  error,
}: {
  id: string
  label: string
  hint: string
  value?: Rating
  onChange: (v: Rating) => void
  error?: string
}) {
  return (
    <div>
      <p id={id} className="text-sm font-medium">
        {label}
      </p>
      <p className="mb-3 text-sm text-muted">{hint}</p>
      <ChoiceGroup
        value={value ? String(value) : undefined}
        onChange={(v) => onChange(Number(v) as Rating)}
        choices={RATING_CHOICES}
        ariaLabelledBy={id}
        ariaDescribedBy={error ? `${id}-err` : undefined}
        invalid={Boolean(error)}
        className="grid-cols-5 gap-1.5 sm:gap-2"
        itemClassName="px-1"
      />
      {error && (
        <p id={`${id}-err`} role="alert" className="mt-1.5 text-sm font-medium text-danger">
          {error}
        </p>
      )}
    </div>
  )
}

function ResultCard({
  quadrant,
  title,
  decisionId,
}: {
  quadrant: Quadrant
  title: string
  decisionId: string
}) {
  const reduced = useReducedMotion()
  const decisions = useDecisions((s) => s.decisions)
  const nextDue = useMemo(() => dueQueue(decisions)[0], [decisions])
  const headingRef = useRef<HTMLHeadingElement>(null)
  useEffect(() => headingRef.current?.focus(), [])

  return (
    <div className="mx-auto max-w-xl">
      <motion.div
        initial={reduced ? false : { opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
      >
        <Card className="p-6 text-center sm:p-8">
          <p className="text-sm text-muted">Review saved</p>
          <p className="mt-1 text-sm text-muted">{title}</p>
          <motion.h1
            ref={headingRef}
            tabIndex={-1}
            initial={reduced ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.6 }}
            className="mt-5 font-display text-4xl font-medium text-accent-text outline-none sm:text-5xl"
          >
            {quadrant}
          </motion.h1>
          <p className="mx-auto mt-3 max-w-sm text-muted">{QUADRANT_BLURB[quadrant]}</p>
          <QuadrantGrid active={quadrant} className="mx-auto mt-7 max-w-sm text-left" />
          <div className="mt-8 flex flex-col gap-2 sm:flex-row sm:justify-center">
            {nextDue ? (
              <Button asChild size="lg">
                <Link to={`/decisions/${nextDue.id}/review`}>
                  Next review
                  <ArrowRight aria-hidden />
                </Link>
              </Button>
            ) : (
              <Button asChild size="lg">
                <Link to="/">Back to home</Link>
              </Button>
            )}
            <Button asChild variant="secondary" size="lg">
              <Link to={`/decisions/${decisionId}`}>See then vs now</Link>
            </Button>
          </div>
        </Card>
      </motion.div>
    </div>
  )
}

function AlreadyReviewed({ decision }: { decision: Decision }) {
  return (
    <Card className="mx-auto max-w-xl p-8 text-center">
      <h1 className="font-display text-2xl font-medium">Already reviewed</h1>
      <p className="mt-2 text-muted">
        You closed the loop on “{decision.title}” on{' '}
        {format(parseISO(decision.review!.reviewedAt), 'd MMMM')}.
      </p>
      <Button asChild className="mt-6">
        <Link to={`/decisions/${decision.id}`}>See then vs now</Link>
      </Button>
    </Card>
  )
}
