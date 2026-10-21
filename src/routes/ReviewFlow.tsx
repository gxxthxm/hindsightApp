import { format, parseISO } from 'date-fns'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
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
import { ConfidenceMeter } from '@/components/ConfidenceMeter'
import { QuadrantGrid } from '@/components/QuadrantGrid'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { ChoiceGroup, type Choice } from '@/components/ui/choice-group'
import { Field } from '@/components/ui/field'
import { Input, Textarea } from '@/components/ui/input'
import { confidenceLabel } from '@/lib/confidence'
import { EASE, SPRING } from '@/lib/motion'
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
  const reduced = useReducedMotion()
  const submitReview = useDecisions((s) => s.submitReview)
  const [step, setStep] = useState(0)
  const [dir, setDir] = useState(1)
  const [draft, setDraft] = useState<Draft>({ whatHappened: '', lesson: '' })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const headingRef = useRef<HTMLHeadingElement>(null)
  const firstRender = useRef(true)

  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false
      return
    }
    headingRef.current?.focus({ preventScroll: true })
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
    if (step < 2) {
      setDir(1)
      return setStep(step + 1)
    }
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
    setDir(-1)
    setStep(step - 1)
  }

  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault()
      next()
    }
  }

  const headingClass = 'font-display text-[34px] leading-[1.05] outline-none sm:text-[44px]'

  return (
    <div className="mx-auto max-w-3xl" onKeyDown={onKeyDown}>
      <div className="mb-8 flex items-center justify-between gap-3">
        <p className="eyebrow">
          Reviewing an entry from {format(parseISO(decision.createdAt), 'd MMMM yyyy')}
        </p>
        <Button variant="ghost" size="sm" onClick={() => navigate(`/decisions/${decision.id}`)}>
          <X aria-hidden />
          Exit
        </Button>
      </div>

      {/* Stepper + progress */}
      <ol className="grid grid-cols-3 gap-3" aria-label="Review steps">
        {STEPS.map((label, i) => (
          <li key={label} aria-current={i === step ? 'step' : undefined}>
            <div className="relative h-1 overflow-hidden rounded-full bg-line" aria-hidden>
              <motion.div
                className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-accent to-accent-bright"
                initial={false}
                animate={{ width: i <= step ? '100%' : '0%' }}
                transition={{ duration: 0.6, ease: EASE }}
              />
            </div>
            <p
              className={cn(
                'mt-3 flex items-center gap-2 text-xs font-medium transition-colors duration-300 sm:text-sm',
                i <= step ? 'text-ink' : 'text-faint',
              )}
            >
              <span className="tabular font-mono text-[11px] text-faint">0{i + 1}</span>
              <span className="truncate">{label}</span>
              {i < step && (
                <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} transition={SPRING}>
                  <Check className="size-3.5 text-accent-text" aria-hidden />
                  <span className="sr-only">(done)</span>
                </motion.span>
              )}
            </p>
          </li>
        ))}
      </ol>
      <p className="sr-only" aria-live="polite">
        Step {step + 1} of 3: {STEPS[step]}
      </p>

      <Card className="mt-8 overflow-hidden shadow-lift">
        <div className="relative p-6 sm:p-10">
          <AnimatePresence mode="wait" initial={false} custom={dir}>
            <motion.section
              key={step}
              custom={dir}
              variants={{
                enter: (d: number) => ({ x: reduced ? 0 : d * 48, opacity: 0 }),
                center: { x: 0, opacity: 1 },
                exit: (d: number) => ({ x: reduced ? 0 : d * -48, opacity: 0 }),
              }}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.35, ease: EASE }}
              aria-labelledby={`${uid}-h`}
            >
              {step === 0 && (
                <>
                  <p className="eyebrow">
                    {decision.category} / {decision.stakes} stakes
                    {decision.mood && ` / felt ${decision.mood.toLowerCase()}`}
                  </p>
                  <h1
                    id={`${uid}-h`}
                    ref={headingRef}
                    tabIndex={-1}
                    className={cn(headingClass, 'mt-3')}
                  >
                    {decision.title}
                  </h1>
                  <dl className="mt-8 space-y-7">
                    <ReadOnly label="You expected">
                      <p className="border-l-2 border-accent pl-4 font-display text-[22px] leading-snug italic sm:text-2xl">
                        {decision.expectedOutcome}
                      </p>
                    </ReadOnly>
                    <ReadOnly label="Your confidence">
                      <div className="flex items-center gap-4">
                        <span className="tabular font-display text-5xl leading-none">
                          {decision.confidence}%
                        </span>
                        <div className="flex-1">
                          <p className="text-sm text-muted">
                            {confidenceLabel(decision.confidence)}
                          </p>
                          <ConfidenceMeter value={decision.confidence} className="mt-2 max-w-60" />
                        </div>
                      </div>
                    </ReadOnly>
                    {decision.chosen && <ReadOnly label="You chose">{decision.chosen}</ReadOnly>}
                    {decision.reasoning && (
                      <ReadOnly label="Because">
                        <p className="leading-relaxed text-muted">{decision.reasoning}</p>
                      </ReadOnly>
                    )}
                  </dl>
                  <p className="mt-8 rounded-2xl bg-surface-2 px-4 py-3 text-sm text-muted">
                    Read it as it was written. Try not to rewrite what you believed then.
                  </p>
                </>
              )}

              {step === 1 && (
                <div className="space-y-8">
                  <h1 id={`${uid}-h`} ref={headingRef} tabIndex={-1} className={headingClass}>
                    What actually <em className="text-accent-text">happened?</em>
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
                    <p id={`${uid}-happened`} className="text-sm font-medium">
                      Did the expected outcome happen?
                    </p>
                    <p className="mt-1 mb-4 font-display text-lg text-muted italic">
                      “{decision.expectedOutcome}”
                    </p>
                    <ChoiceGroup
                      value={draft.happened}
                      onChange={(happened) => update({ happened })}
                      choices={HAPPENED_CHOICES}
                      ariaLabelledBy={`${uid}-happened`}
                      ariaDescribedBy={errors.happened ? `${uid}-happened-err` : undefined}
                      invalid={Boolean(errors.happened)}
                      className="grid-cols-3"
                      itemClassName="min-h-16"
                    />
                    {errors.happened && (
                      <p
                        id={`${uid}-happened-err`}
                        role="alert"
                        className="mt-2 text-sm font-medium text-danger"
                      >
                        {errors.happened}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-9">
                  <div>
                    <h1 id={`${uid}-h`} ref={headingRef} tabIndex={-1} className={headingClass}>
                      Separate luck from <em className="text-accent-text">judgment.</em>
                    </h1>
                    <p className="mt-3 text-muted">
                      Rate these on their own. A good call can go badly, and a bad one can get
                      lucky.
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
                </div>
              )}
            </motion.section>
          </AnimatePresence>
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-line bg-surface-2/50 px-6 py-4 sm:px-10">
          {step > 0 ? (
            <Button variant="ghost" onClick={back}>
              <ArrowLeft aria-hidden />
              Back
            </Button>
          ) : (
            <span className="eyebrow hidden sm:block">⌘ + Enter to continue</span>
          )}
          <Button size="lg" onClick={next} autoFocus={step === 0} className="group ml-auto">
            {step === 0 ? 'Start review' : step === 1 ? 'Continue' : 'Save review'}
            {step < 2 ? (
              <ArrowRight
                className="transition-transform duration-300 group-hover:translate-x-1"
                aria-hidden
              />
            ) : (
              <Check aria-hidden />
            )}
          </Button>
        </div>
      </Card>
    </div>
  )
}

function ReadOnly({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <dt className="eyebrow">{label}</dt>
      <dd className="mt-2">{children}</dd>
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
      <p className="mb-4 text-sm text-muted">{hint}</p>
      <ChoiceGroup
        value={value ? String(value) : undefined}
        onChange={(v) => onChange(Number(v) as Rating)}
        choices={RATING_CHOICES}
        ariaLabelledBy={id}
        ariaDescribedBy={error ? `${id}-err` : undefined}
        invalid={Boolean(error)}
        className="grid-cols-5 gap-1.5 sm:gap-2.5"
        itemClassName="min-h-16 px-1"
      />
      {error && (
        <p id={`${id}-err`} role="alert" className="mt-2 text-sm font-medium text-danger">
          {error}
        </p>
      )}
    </div>
  )
}

/** A one-off ring of dots bursting from the verdict. */
function Burst() {
  const reduced = useReducedMotion()
  if (reduced) return null
  const dots = Array.from({ length: 14 }, (_, i) => {
    const angle = (i / 14) * Math.PI * 2
    const distance = 90 + (i % 3) * 26
    return { x: Math.cos(angle) * distance, y: Math.sin(angle) * distance * 0.6, i }
  })
  return (
    <span aria-hidden className="pointer-events-none absolute top-1/2 left-1/2">
      {dots.map((d) => (
        <motion.span
          key={d.i}
          className={cn(
            'absolute size-2 rounded-full',
            d.i % 3 === 0 ? 'bg-accent' : d.i % 3 === 1 ? 'bg-accent-bright' : 'bg-ink/40',
          )}
          initial={{ x: 0, y: 0, scale: 0, opacity: 1 }}
          animate={{ x: d.x, y: d.y, scale: [0, 1.2, 0.4], opacity: [1, 1, 0] }}
          transition={{ duration: 1.1, ease: EASE, delay: 0.45 }}
        />
      ))}
    </span>
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
  useEffect(() => headingRef.current?.focus({ preventScroll: true }), [])

  return (
    <div className="mx-auto max-w-2xl">
      <motion.div
        initial={reduced ? false : { opacity: 0, y: 24, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: EASE }}
      >
        <Card className="relative overflow-hidden p-8 text-center shadow-lift sm:p-12">
          <span
            aria-hidden
            className="absolute -top-24 left-1/2 size-72 -translate-x-1/2 rounded-full bg-accent-bright/20 blur-3xl"
          />
          <p className="eyebrow relative">Review saved</p>
          <p className="relative mx-auto mt-2 max-w-md text-sm text-muted">{title}</p>
          <div className="relative mt-8">
            <Burst />
            <motion.h1
              ref={headingRef}
              tabIndex={-1}
              initial={reduced ? false : { opacity: 0, scale: 0.85, filter: 'blur(8px)' }}
              animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
              transition={{ delay: 0.35, duration: 0.8, ease: EASE }}
              className="font-display text-[64px] leading-none text-accent-text italic outline-none sm:text-[88px]"
            >
              {quadrant}
            </motion.h1>
          </div>
          <motion.p
            initial={reduced ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7, duration: 0.6, ease: EASE }}
            className="relative mx-auto mt-5 max-w-sm text-[17px] leading-relaxed text-muted"
          >
            {QUADRANT_BLURB[quadrant]}
          </motion.p>
          <QuadrantGrid active={quadrant} className="relative mx-auto mt-10 max-w-sm text-left" />
          <motion.div
            initial={reduced ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1, duration: 0.6, ease: EASE }}
            className="relative mt-10 flex flex-col gap-2.5 sm:flex-row sm:justify-center"
          >
            {nextDue ? (
              <Button asChild size="lg" className="group">
                <Link to={`/decisions/${nextDue.id}/review`}>
                  Next review
                  <ArrowRight
                    className="transition-transform duration-300 group-hover:translate-x-1"
                    aria-hidden
                  />
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
          </motion.div>
        </Card>
      </motion.div>
    </div>
  )
}

function AlreadyReviewed({ decision }: { decision: Decision }) {
  return (
    <Card className="mx-auto max-w-xl p-10 text-center">
      <h1 className="font-display text-4xl">Already reviewed</h1>
      <p className="mt-3 text-muted">
        You closed the loop on “{decision.title}” on{' '}
        {format(parseISO(decision.review!.reviewedAt), 'd MMMM')}.
      </p>
      <Button asChild className="mt-7">
        <Link to={`/decisions/${decision.id}`}>See then vs now</Link>
      </Button>
    </Card>
  )
}
