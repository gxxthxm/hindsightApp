import { motion } from 'framer-motion'
import { Lightbulb } from 'lucide-react'
import { useMemo, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { CalibrationChart } from '@/components/charts/CalibrationChart'
import { HitRateBars } from '@/components/charts/HitRateBars'
import { LuckSkillChart } from '@/components/charts/LuckSkillChart'
import { Reveal, RevealWords, Stagger } from '@/components/motion'
import { StatCard } from '@/components/StatCard'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { EASE } from '@/lib/motion'
import { dueQueue } from '@/lib/status'
import {
  averageConfidence,
  brierScore,
  calibrationBuckets,
  calibrationInsight,
  hitRate,
  hitRateByCategory,
  hitRateByMood,
  MIN_REVIEWS_FOR_INSIGHTS,
  moodInsight,
  reviewCompletionRate,
  reviewedOnly,
} from '@/lib/stats'
import { cn } from '@/lib/utils'
import { useDecisions } from '@/store/decisions'
import { usePageTitle } from './usePageTitle'

function brierHint(score: number | null) {
  if (score === null) return 'Lower is better.'
  const verdict =
    score < 0.1
      ? 'sharp'
      : score < 0.2
        ? 'decent, better than a coin flip'
        : score < 0.25
          ? 'only a little better than a coin flip'
          : 'no better than a coin flip'
  return `0 is perfect; always saying 50% scores 0.25. Yours is ${verdict}.`
}

export function Insights() {
  usePageTitle('Insights')
  const decisions = useDecisions((s) => s.decisions)
  const stats = useMemo(() => {
    const reviewed = reviewedOnly(decisions)
    const byMood = hitRateByMood(decisions)
    const overall = hitRate(decisions)
    const worstMood = [...byMood]
      .filter((g) => g.count >= 2)
      .sort((a, b) => a.hitRate - b.hitRate)[0]
    return {
      reviewed,
      overall,
      completion: reviewCompletionRate(decisions),
      avgConfidence: averageConfidence(decisions),
      brier: brierScore(decisions),
      buckets: calibrationBuckets(decisions),
      calibrationText: calibrationInsight(decisions),
      byCategory: hitRateByCategory(decisions),
      byMood,
      moodText: moodInsight(decisions),
      worstMood:
        worstMood && overall !== null && overall - worstMood.hitRate >= 0.15
          ? worstMood.key
          : undefined,
      dueCount: dueQueue(decisions).length,
    }
  }, [decisions])

  const enough = stats.reviewed.length >= MIN_REVIEWS_FOR_INSIGHTS

  return (
    <div className="space-y-14 sm:space-y-20">
      <header className="max-w-4xl">
        <motion.p
          className="eyebrow"
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, ease: EASE }}
        >
          Insights · {stats.reviewed.length} reviewed decisions
        </motion.p>
        <h1 className="mt-4 font-display text-[46px] leading-[0.98] tracking-[-0.02em] sm:text-[68px] lg:text-[80px] [&_em]:text-accent-text">
          <RevealWords>{['Is your 80% ', <em key="em">really</em>, ' 80%?']}</RevealWords>
        </h1>
        {enough && (
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: EASE, delay: 0.45 }}
            className="mt-6 flex max-w-2xl items-start gap-3 text-lg leading-relaxed text-muted sm:text-xl"
          >
            <Lightbulb className="mt-1.5 size-5 shrink-0 text-accent-text" aria-hidden />
            {stats.calibrationText}
          </motion.p>
        )}
      </header>

      {!enough ? (
        <NeedsMoreData reviewed={stats.reviewed.length} dueCount={stats.dueCount} />
      ) : (
        <>
          <Stagger
            role="region"
            aria-label="Summary statistics"
            className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-5"
            stagger={0.08}
          >
            <Reveal>
              <StatCard
                label="Decisions"
                value={decisions.length}
                hint={`${stats.reviewed.length} reviewed`}
              />
            </Reveal>
            <Reveal>
              <StatCard
                label="Completion"
                value={stats.completion === null ? null : stats.completion * 100}
                suffix="%"
                hint="Reviews closed on time"
              />
            </Reveal>
            <Reveal>
              <StatCard
                label="Avg confidence"
                value={stats.avgConfidence}
                suffix="%"
                hint="How sure you usually feel"
              />
            </Reveal>
            <Reveal>
              <StatCard
                tone="accent"
                label="Hit rate"
                value={stats.overall === null ? null : stats.overall * 100}
                suffix="%"
                hint="How often you were right"
              />
            </Reveal>
            <Reveal className="col-span-2 sm:col-span-2 lg:col-span-1">
              <StatCard
                tone="inverse"
                label="Brier score"
                value={stats.brier}
                decimals={2}
                hint={brierHint(stats.brier)}
              />
            </Reveal>
          </Stagger>

          <div className="grid gap-5 lg:grid-cols-2 lg:gap-6">
            <ChartCard
              index="01"
              title="Calibration"
              sub="How sure you were vs how often it came true. Bigger dots, more decisions."
            >
              <CalibrationChart buckets={stats.buckets} />
            </ChartCard>
            <ChartCard
              index="02"
              title="Luck vs skill"
              sub="Each reviewed decision by the quality of the call and of the outcome. Select a dot to open it."
            >
              <LuckSkillChart decisions={stats.reviewed} />
            </ChartCard>
          </div>

          <div className="grid gap-5 lg:grid-cols-2 lg:gap-6">
            <ChartCard
              index="03"
              title="By mood"
              sub="Hit rate by how you felt when deciding. The tick marks your overall rate."
              insight={stats.moodText ?? undefined}
            >
              <HitRateBars
                groups={stats.byMood}
                overall={stats.overall ?? 0}
                highlight={stats.worstMood}
                label="Hit rate by mood"
              />
            </ChartCard>
            <ChartCard
              index="04"
              title="By category"
              sub="Where your judgment is strongest, and where it isn’t."
            >
              <HitRateBars
                groups={stats.byCategory}
                overall={stats.overall ?? 0}
                label="Hit rate by category"
              />
            </ChartCard>
          </div>
        </>
      )}
    </div>
  )
}

function ChartCard({
  index,
  title,
  sub,
  insight,
  children,
}: {
  index: string
  title: string
  sub: string
  insight?: string
  children: ReactNode
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '0px 0px -10% 0px' }}
      transition={{ duration: 0.8, ease: EASE }}
      className="min-w-0"
    >
      <Card className="h-full p-6 sm:p-8">
        <p className="eyebrow tabular">{index}</p>
        <h2 className="mt-2 font-display text-[32px] leading-none">{title}</h2>
        <p className="mt-2 max-w-md text-sm text-muted">{sub}</p>
        {insight && (
          <p className="mt-5 flex items-start gap-2.5 rounded-2xl bg-accent-soft px-4 py-3 text-sm font-medium text-accent-text">
            <Lightbulb className="mt-0.5 size-4 shrink-0" aria-hidden />
            {insight}
          </p>
        )}
        <div className={cn('mt-6')}>{children}</div>
      </Card>
    </motion.div>
  )
}

function NeedsMoreData({ reviewed, dueCount }: { reviewed: number; dueCount: number }) {
  return (
    <Card className="mx-auto max-w-xl px-6 py-14 text-center">
      <h2 className="font-display text-4xl">Needs a bit more data</h2>
      <p className="mx-auto mt-3 max-w-sm text-muted">
        Calibration only means something with a handful of reviewed decisions. You’ve reviewed{' '}
        {reviewed} of the {MIN_REVIEWS_FOR_INSIGHTS} needed.
      </p>
      <div
        className="mx-auto mt-7 h-2 max-w-xs overflow-hidden rounded-full bg-line"
        role="progressbar"
        aria-label="Reviews towards insights"
        aria-valuemin={0}
        aria-valuemax={MIN_REVIEWS_FOR_INSIGHTS}
        aria-valuenow={reviewed}
      >
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-accent to-accent-bright"
          initial={{ width: 0 }}
          animate={{ width: `${(reviewed / MIN_REVIEWS_FOR_INSIGHTS) * 100}%` }}
          transition={{ duration: 1, ease: EASE, delay: 0.3 }}
        />
      </div>
      <div className="mt-8 flex flex-col justify-center gap-2.5 sm:flex-row">
        {dueCount > 0 && (
          <Button asChild>
            <Link to="/">Review {dueCount} due</Link>
          </Button>
        )}
        <Button asChild variant="secondary">
          <Link to="/new">Log a decision</Link>
        </Button>
      </div>
    </Card>
  )
}
