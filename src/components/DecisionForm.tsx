import {
  addDays,
  addMonths,
  addWeeks,
  endOfDay,
  format,
  isValid,
  parseISO,
  setHours,
  startOfDay,
} from 'date-fns'
import { ChevronDown, Lock, Plus, X } from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'
import { useId, useRef, useState, type FormEvent, type KeyboardEvent } from 'react'
import { Button } from '@/components/ui/button'
import { Chip } from '@/components/ui/chip'
import { Field } from '@/components/ui/field'
import { Input, Textarea } from '@/components/ui/input'
import {
  CATEGORIES,
  MOODS,
  STAKES,
  type Category,
  type Decision,
  type Mood,
  type Stakes,
} from '@/lib/types'
import { EASE } from '@/lib/motion'
import { cn } from '@/lib/utils'
import { ConfidenceDial } from './ConfidenceDial'
import type { DecisionInput } from '@/store/decisions'

type Preset = '2w' | '1m' | '3m' | '6m' | 'custom'

const PRESETS: { id: Exclude<Preset, 'custom'>; label: string; date: (now: Date) => Date }[] = [
  { id: '2w', label: '2 weeks', date: (n) => addWeeks(n, 2) },
  { id: '1m', label: '1 month', date: (n) => addMonths(n, 1) },
  { id: '3m', label: '3 months', date: (n) => addMonths(n, 3) },
  { id: '6m', label: '6 months', date: (n) => addMonths(n, 6) },
]

interface Errors {
  title?: string
  expectedOutcome?: string
  reviewDate?: string
}

interface DecisionFormProps {
  initial?: Decision
  submitLabel: string
  onSubmit: (input: DecisionInput) => void
  onCancel?: () => void
  autoFocus?: boolean
}

export function DecisionForm({
  initial,
  submitLabel,
  onSubmit,
  onCancel,
  autoFocus,
}: DecisionFormProps) {
  const uid = useId()
  const ids = {
    title: `${uid}-title`,
    expected: `${uid}-expected`,
    confidence: `${uid}-confidence`,
    date: `${uid}-date`,
    context: `${uid}-context`,
    option: `${uid}-option`,
    reasoning: `${uid}-reasoning`,
    more: `${uid}-more`,
  }
  const locked = initial?.review !== undefined

  const [title, setTitle] = useState(initial?.title ?? '')
  const [expectedOutcome, setExpectedOutcome] = useState(initial?.expectedOutcome ?? '')
  const [confidence, setConfidence] = useState(initial?.confidence ?? 70)
  const [preset, setPreset] = useState<Preset>(initial ? 'custom' : '1m')
  const [customDate, setCustomDate] = useState(
    initial ? format(parseISO(initial.snoozedUntil ?? initial.reviewAt), 'yyyy-MM-dd') : '',
  )
  const [category, setCategory] = useState<Category>(initial?.category ?? 'Work')
  const [stakes, setStakes] = useState<Stakes>(initial?.stakes ?? 'Medium')
  const [mood, setMood] = useState<Mood | undefined>(initial?.mood)
  const [context, setContext] = useState(initial?.context ?? '')
  const [options, setOptions] = useState<string[]>(initial?.options ?? [])
  const [optionDraft, setOptionDraft] = useState('')
  const [chosen, setChosen] = useState<string | undefined>(initial?.chosen)
  const [reasoning, setReasoning] = useState(initial?.reasoning ?? '')
  const [showMore, setShowMore] = useState(Boolean(initial))
  const [errors, setErrors] = useState<Errors>({})

  const titleRef = useRef<HTMLInputElement>(null)
  const expectedRef = useRef<HTMLTextAreaElement>(null)
  const dateRef = useRef<HTMLInputElement>(null)

  const now = new Date()
  const reviewDate: Date | null =
    preset === 'custom'
      ? customDate && isValid(parseISO(customDate))
        ? setHours(startOfDay(parseISO(customDate)), 9)
        : null
      : PRESETS.find((p) => p.id === preset)!.date(now)

  const addOption = () => {
    const value = optionDraft.trim()
    if (!value) return
    if (!options.some((o) => o.toLowerCase() === value.toLowerCase()))
      setOptions([...options, value])
    setOptionDraft('')
  }

  const removeOption = (option: string) => {
    setOptions(options.filter((o) => o !== option))
    if (chosen === option) setChosen(undefined)
  }

  const validate = (): Errors => {
    const next: Errors = {}
    if (!title.trim()) next.title = 'Give the decision a short title.'
    if (!expectedOutcome.trim())
      next.expectedOutcome = 'What do you expect to happen? This is what you’ll check later.'
    if (!reviewDate) next.reviewDate = 'Pick a date to review this decision.'
    else if (!initial && reviewDate < endOfDay(now) && preset === 'custom')
      next.reviewDate = 'Pick a date after today, so there’s something to look back on.'
    return next
  }

  const handleSubmit = (e?: FormEvent) => {
    e?.preventDefault()
    const found = validate()
    setErrors(found)
    if (found.title) return titleRef.current?.focus()
    if (found.expectedOutcome) return expectedRef.current?.focus()
    if (found.reviewDate) return dateRef.current?.focus()

    const pendingOption = optionDraft.trim()
    const allOptions =
      pendingOption && !options.includes(pendingOption) ? [...options, pendingOption] : options
    const reviewAt = reviewDate!.toISOString()
    const reviewChanged =
      !initial || reviewAt.slice(0, 10) !== (initial.snoozedUntil ?? initial.reviewAt).slice(0, 10)

    onSubmit({
      title: title.trim(),
      expectedOutcome: expectedOutcome.trim(),
      confidence,
      category,
      stakes,
      mood,
      context: context.trim() || undefined,
      options: allOptions,
      chosen: chosen && allOptions.includes(chosen) ? chosen : undefined,
      reasoning: reasoning.trim() || undefined,
      reviewAt: reviewChanged ? reviewAt : initial!.reviewAt,
    })
  }

  const submitOnModEnter = (e: KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault()
      handleSubmit()
    }
  }

  return (
    <form onSubmit={handleSubmit} onKeyDown={submitOnModEnter} noValidate className="space-y-8">
      {/* ── Required ───────────────────────────────────────────── */}
      <Field
        label="What are you deciding?"
        htmlFor={ids.title}
        error={errors.title}
        errorId={`${ids.title}-err`}
      >
        <Input
          ref={titleRef}
          id={ids.title}
          value={title}
          onChange={(e) => {
            setTitle(e.target.value)
            if (errors.title) setErrors({ ...errors, title: undefined })
          }}
          placeholder="e.g. Delay the launch two weeks"
          autoFocus={autoFocus}
          autoComplete="off"
          maxLength={140}
          aria-invalid={Boolean(errors.title)}
          aria-describedby={errors.title ? `${ids.title}-err` : undefined}
          className="h-14 font-display text-[24px]"
        />
      </Field>

      <Field
        label="What do you expect to happen?"
        htmlFor={ids.expected}
        hint={locked ? undefined : 'Be specific enough that future you can say yes or no.'}
        error={errors.expectedOutcome}
        errorId={`${ids.expected}-err`}
      >
        <Textarea
          ref={expectedRef}
          id={ids.expected}
          value={expectedOutcome}
          onChange={(e) => {
            setExpectedOutcome(e.target.value)
            if (errors.expectedOutcome) setErrors({ ...errors, expectedOutcome: undefined })
          }}
          placeholder="e.g. Activation above 40% in launch week"
          rows={2}
          disabled={locked}
          aria-invalid={Boolean(errors.expectedOutcome)}
          aria-describedby={errors.expectedOutcome ? `${ids.expected}-err` : undefined}
        />
      </Field>

      <ConfidenceDial
        value={confidence}
        onChange={setConfidence}
        labelId={ids.confidence}
        disabled={locked}
      />

      {locked && (
        <p className="flex items-start gap-2 rounded-lg bg-surface-2 p-3 text-sm text-muted">
          <Lock className="mt-0.5 size-4 shrink-0" aria-hidden />
          Expected outcome and confidence are locked once a decision is reviewed. That’s the point
          of writing them down.
        </p>
      )}

      {!locked && (
        <Field
          as="fieldset"
          label="When should you look back?"
          error={errors.reviewDate}
          errorId={`${ids.date}-err`}
        >
          <div className="flex flex-wrap gap-2">
            {PRESETS.map((p) => (
              <Chip
                key={p.id}
                layoutId={`${uid}-preset`}
                selected={preset === p.id}
                onClick={() => setPreset(p.id)}
              >
                {p.label}
              </Chip>
            ))}
            <Chip
              layoutId={`${uid}-preset`}
              selected={preset === 'custom'}
              onClick={() => {
                setPreset('custom')
                requestAnimationFrame(() => dateRef.current?.focus())
              }}
            >
              Custom
            </Chip>
          </div>
          {preset === 'custom' ? (
            <div className="mt-2.5 max-w-56">
              <label htmlFor={ids.date} className="sr-only">
                Custom review date
              </label>
              <Input
                ref={dateRef}
                id={ids.date}
                type="date"
                value={customDate}
                min={initial ? undefined : format(addDays(now, 1), 'yyyy-MM-dd')}
                onChange={(e) => {
                  setCustomDate(e.target.value)
                  if (errors.reviewDate) setErrors({ ...errors, reviewDate: undefined })
                }}
                aria-invalid={Boolean(errors.reviewDate)}
                aria-describedby={errors.reviewDate ? `${ids.date}-err` : undefined}
                className="h-10 text-sm"
              />
            </div>
          ) : (
            reviewDate && (
              <p className="mt-2 text-sm text-muted">
                We’ll ask you on{' '}
                <span className="font-medium text-ink">{format(reviewDate, 'EEEE d MMMM')}</span>.
              </p>
            )
          )}
        </Field>
      )}

      {/* ── Quick tags ─────────────────────────────────────────── */}
      <div className="grid gap-5 sm:grid-cols-2">
        <Field as="fieldset" label="Category" className="sm:col-span-2">
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((c) => (
              <Chip
                key={c}
                layoutId={`${uid}-category`}
                selected={category === c}
                onClick={() => setCategory(c)}
              >
                {c}
              </Chip>
            ))}
          </div>
        </Field>
        <Field as="fieldset" label="Stakes">
          <div className="flex flex-wrap gap-2">
            {STAKES.map((s) => (
              <Chip
                key={s}
                layoutId={`${uid}-stakes`}
                selected={stakes === s}
                onClick={() => setStakes(s)}
              >
                {s}
              </Chip>
            ))}
          </div>
        </Field>
        <Field as="fieldset" label="Mood right now" optional>
          <div className="flex flex-wrap gap-2">
            {MOODS.map((m) => (
              <Chip
                key={m}
                layoutId={`${uid}-mood`}
                selected={mood === m}
                onClick={() => setMood(mood === m ? undefined : m)}
              >
                {m}
              </Chip>
            ))}
          </div>
        </Field>
      </div>

      {/* ── More detail ────────────────────────────────────────── */}
      <div className="overflow-hidden rounded-2xl border border-line">
        <button
          type="button"
          aria-expanded={showMore}
          aria-controls={ids.more}
          onClick={() => setShowMore(!showMore)}
          className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left text-sm font-medium transition-colors hover:bg-surface-2"
        >
          <span>
            Context, options and reasoning <span className="font-normal text-faint">optional</span>
          </span>
          <ChevronDown
            className={cn(
              'size-4 text-muted transition-transform duration-300',
              showMore && 'rotate-180',
            )}
            aria-hidden
          />
        </button>
        <AnimatePresence initial={false}>
          {showMore && (
            <motion.div
              id={ids.more}
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.4, ease: EASE }}
            >
              <div className="space-y-6 border-t border-line px-5 pt-5 pb-6">
                <Field
                  label="Context"
                  htmlFor={ids.context}
                  hint="What’s going on? What constraints are you under?"
                >
                  <Textarea
                    id={ids.context}
                    value={context}
                    onChange={(e) => setContext(e.target.value)}
                    rows={2}
                  />
                </Field>

                <Field label="Options considered" htmlFor={ids.option}>
                  <div className="flex gap-2">
                    <Input
                      id={ids.option}
                      value={optionDraft}
                      onChange={(e) => setOptionDraft(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.metaKey && !e.ctrlKey) {
                          e.preventDefault()
                          addOption()
                        }
                      }}
                      placeholder="Add an option and press Enter"
                      className="h-10 text-sm"
                      autoComplete="off"
                    />
                    <Button
                      variant="secondary"
                      onClick={addOption}
                      aria-label="Add option"
                      className="px-3"
                    >
                      <Plus aria-hidden />
                      <span className="hidden sm:inline">Add</span>
                    </Button>
                  </div>
                  {options.length > 0 && (
                    <ul className="mt-2.5 flex flex-wrap gap-2" aria-label="Options">
                      {options.map((o) => (
                        <motion.li
                          key={o}
                          layout
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                          className="inline-flex h-8 max-w-full items-center gap-1 rounded-full border border-line bg-surface-2 pr-1 pl-3 text-sm"
                        >
                          <span className="truncate">{o}</span>
                          <button
                            type="button"
                            onClick={() => removeOption(o)}
                            aria-label={`Remove option: ${o}`}
                            className="rounded-full p-1 text-muted hover:bg-line hover:text-ink"
                          >
                            <X className="size-3.5" aria-hidden />
                          </button>
                        </motion.li>
                      ))}
                    </ul>
                  )}
                </Field>

                {options.length > 0 && (
                  <Field as="fieldset" label="Which one did you choose?">
                    <div className="flex flex-wrap gap-2">
                      {options.map((o) => (
                        <Chip
                          key={o}
                          selected={chosen === o}
                          onClick={() => setChosen(chosen === o ? undefined : o)}
                        >
                          <span className="max-w-60 truncate">{o}</span>
                        </Chip>
                      ))}
                    </div>
                  </Field>
                )}

                <Field
                  label="Reasoning"
                  htmlFor={ids.reasoning}
                  hint="Why this, and not the alternatives?"
                >
                  <Textarea
                    id={ids.reasoning}
                    value={reasoning}
                    onChange={(e) => setReasoning(e.target.value)}
                    rows={3}
                  />
                </Field>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="flex flex-col-reverse gap-2 pt-1 sm:flex-row sm:items-center sm:justify-end">
        <span className="hidden text-xs text-faint sm:mr-auto sm:block">
          <kbd className="font-sans">⌘</kbd>/<kbd className="font-sans">Ctrl</kbd> +{' '}
          <kbd className="font-sans">Enter</kbd> to save
        </span>
        {onCancel && (
          <Button variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button type="submit" size="lg">
          {submitLabel}
        </Button>
      </div>
    </form>
  )
}
