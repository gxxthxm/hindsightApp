import { motion } from 'framer-motion'
import { Plus, Search, X } from 'lucide-react'
import { useMemo } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { DecisionRow } from '@/components/DecisionRow'
import { RevealWords } from '@/components/motion'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Chip } from '@/components/ui/chip'
import { Input, Select } from '@/components/ui/input'
import { staggerContainer } from '@/lib/motion'
import { getStatus, STATUS_LABEL } from '@/lib/status'
import { CATEGORIES, type Category, type Status } from '@/lib/types'
import { useDecisions } from '@/store/decisions'
import { usePageTitle } from './usePageTitle'

const STATUSES: Status[] = ['open', 'due', 'reviewed']

const CONFIDENCE_FILTERS = {
  any: { label: 'Any confidence', test: () => true },
  low: { label: 'Coin flip to leaning (50–65%)', test: (c: number) => c < 70 },
  mid: { label: 'Fairly sure (70–75%)', test: (c: number) => c >= 70 && c < 80 },
  high: { label: 'Confident or more (80%+)', test: (c: number) => c >= 80 },
} as const
type ConfidenceFilter = keyof typeof CONFIDENCE_FILTERS

const SORTS = {
  newest: 'Newest first',
  oldest: 'Oldest first',
  'confidence-desc': 'Most confident',
  'confidence-asc': 'Least confident',
} as const
type Sort = keyof typeof SORTS

function readList<T extends string>(
  params: URLSearchParams,
  key: string,
  allowed: readonly T[],
): T[] {
  return (params.get(key)?.split(',') ?? []).filter((v): v is T =>
    (allowed as readonly string[]).includes(v),
  )
}

export function DecisionList() {
  usePageTitle('Decisions')
  const decisions = useDecisions((s) => s.decisions)
  const [params, setParams] = useSearchParams()
  const now = useMemo(() => new Date(), [])

  const q = params.get('q') ?? ''
  const categories = readList<Category>(params, 'category', CATEGORIES)
  const statuses = readList<Status>(params, 'status', STATUSES)
  const confidence = (params.get('confidence') ?? 'any') as ConfidenceFilter
  const sort = (params.get('sort') ?? 'newest') as Sort
  const filtered = q !== '' || categories.length > 0 || statuses.length > 0 || confidence !== 'any'

  const set = (key: string, value: string | string[] | null) => {
    const next = new URLSearchParams(params)
    const v = Array.isArray(value) ? value.join(',') : value
    if (!v) next.delete(key)
    else next.set(key, v)
    setParams(next, { replace: true })
  }

  const toggle = <T extends string>(key: string, list: T[], value: T) =>
    set(key, list.includes(value) ? list.filter((v) => v !== value) : [...list, value])

  const results = useMemo(() => {
    const needle = q.trim().toLowerCase()
    const confTest = (CONFIDENCE_FILTERS[confidence] ?? CONFIDENCE_FILTERS.any).test
    const list = decisions.filter((d) => {
      if (categories.length && !categories.includes(d.category)) return false
      if (statuses.length && !statuses.includes(getStatus(d, now))) return false
      if (!confTest(d.confidence)) return false
      if (!needle) return true
      return [
        d.title,
        d.expectedOutcome,
        d.context,
        d.reasoning,
        d.review?.whatHappened,
        d.review?.lesson,
      ]
        .filter(Boolean)
        .some((text) => text!.toLowerCase().includes(needle))
    })
    return list.sort((a, b) => {
      switch (sort) {
        case 'oldest':
          return a.createdAt.localeCompare(b.createdAt)
        case 'confidence-desc':
          return b.confidence - a.confidence || b.createdAt.localeCompare(a.createdAt)
        case 'confidence-asc':
          return a.confidence - b.confidence || b.createdAt.localeCompare(a.createdAt)
        default:
          return b.createdAt.localeCompare(a.createdAt)
      }
    })
  }, [decisions, q, categories, statuses, confidence, sort, now])

  return (
    <div className="space-y-10">
      <header className="flex items-end justify-between gap-6">
        <div>
          <p className="eyebrow">The archive · {decisions.length} entries</p>
          <h1 className="mt-4 font-display text-[46px] leading-[0.98] tracking-[-0.02em] sm:text-[68px] lg:text-[80px] [&_em]:text-accent-text">
            <RevealWords>{['Every call, ', <em key="em">and how it went.</em>]}</RevealWords>
          </h1>
        </div>
        <Button asChild size="lg" className="hidden shrink-0 sm:inline-flex">
          <Link to="/new">
            <Plus aria-hidden /> New
          </Link>
        </Button>
      </header>

      <div className="space-y-4">
        <div className="relative">
          <Search
            className="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-faint"
            aria-hidden
          />
          <label htmlFor="search" className="sr-only">
            Search decisions
          </label>
          <Input
            id="search"
            type="search"
            value={q}
            onChange={(e) => set('q', e.target.value)}
            placeholder="Search titles, reasoning, lessons…"
            className="h-14 rounded-2xl pl-12 text-base"
            autoComplete="off"
          />
        </div>

        <fieldset>
          <legend className="sr-only">Filter by status</legend>
          <div className="flex flex-wrap gap-2">
            {STATUSES.map((s) => (
              <Chip
                key={s}
                selected={statuses.includes(s)}
                onClick={() => toggle('status', statuses, s)}
              >
                {STATUS_LABEL[s]}
              </Chip>
            ))}
            <span className="mx-1 hidden w-px self-stretch bg-line sm:block" aria-hidden />
            {CATEGORIES.map((c) => (
              <Chip
                key={c}
                selected={categories.includes(c)}
                onClick={() => toggle('category', categories, c)}
              >
                {c}
              </Chip>
            ))}
          </div>
        </fieldset>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <label htmlFor="confidence-filter" className="sr-only">
            Filter by confidence
          </label>
          <Select
            id="confidence-filter"
            value={confidence}
            onChange={(e) => set('confidence', e.target.value === 'any' ? null : e.target.value)}
            className="sm:w-64"
          >
            {Object.entries(CONFIDENCE_FILTERS).map(([key, f]) => (
              <option key={key} value={key}>
                {f.label}
              </option>
            ))}
          </Select>
          <label htmlFor="sort" className="sr-only">
            Sort
          </label>
          <Select
            id="sort"
            value={sort}
            onChange={(e) => set('sort', e.target.value === 'newest' ? null : e.target.value)}
            className="sm:w-48"
          >
            {Object.entries(SORTS).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </Select>
          <p className="tabular text-sm text-muted sm:ml-auto" aria-live="polite">
            {filtered
              ? `${results.length} of ${decisions.length} decisions`
              : `${decisions.length} decisions`}
          </p>
          {filtered && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setParams(sort === 'newest' ? {} : { sort }, { replace: true })}
            >
              <X aria-hidden /> Clear filters
            </Button>
          )}
        </div>
      </div>

      {decisions.length === 0 ? (
        <Card className="px-6 py-14 text-center">
          <h2 className="font-display text-2xl font-medium">An empty journal</h2>
          <p className="mt-1 text-muted">Every useful record starts with one entry.</p>
          <Button asChild className="mt-5">
            <Link to="/new">Log your first decision</Link>
          </Button>
        </Card>
      ) : results.length === 0 ? (
        <Card className="px-6 py-14 text-center">
          <h2 className="font-display text-2xl font-medium">No matches</h2>
          <p className="mt-1 text-muted">
            {q ? `Nothing matches “${q}” with these filters.` : 'No decisions match these filters.'}
          </p>
          <Button
            variant="secondary"
            className="mt-5"
            onClick={() => setParams({}, { replace: true })}
          >
            Clear filters
          </Button>
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <motion.ul
            className="divide-y divide-line"
            variants={staggerContainer}
            custom={0.04}
            initial="hidden"
            animate="show"
          >
            {results.map((d) => (
              <DecisionRow key={d.id} decision={d} now={now} />
            ))}
          </motion.ul>
        </Card>
      )}
    </div>
  )
}
