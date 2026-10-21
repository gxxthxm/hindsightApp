import { Lightbulb } from 'lucide-react'
import { useMemo, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { CalibrationChart } from '@/components/charts/CalibrationChart'
import { HitRateBars } from '@/components/charts/HitRateBars'
import { LuckSkillChart } from '@/components/charts/LuckSkillChart'
import { StatCard } from '@/components/StatCard'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
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
  return `Lower is better: 0 is perfect, always saying 50% scores 0.25. Yours is ${verdict}.`
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

  return (
    <div className="space-y-8">
      <header>
        <h1 className="font-display text-3xl font-medium sm:text-4xl">Insights</h1>
        <p className="mt-1.5 text-muted">Is your 80% really 80%? The honest numbers.</p>
      </header>

      {stats.reviewed.length < MIN_REVIEWS_FOR_INSIGHTS ? (
        <NeedsMoreData reviewed={stats.reviewed.length} dueCount={stats.dueCount} />
      ) : (
        <>
          <section
            aria-label="Summary statistics"
            className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-5"
          >
            <StatCard
              animate
              label="Decisions"
              value={decisions.length}
              hint={`${stats.reviewed.length} reviewed`}
            />
            <StatCard
              animate
              label="Review completion"
              value={stats.completion === null ? null : stats.completion * 100}
              suffix="%"
              hint="Of those whose time has come"
            />
            <StatCard
              animate
              label="Avg confidence"
              value={stats.avgConfidence}
              suffix="%"
              hint="How sure you usually feel"
            />
            <StatCard
              animate
              label="Hit rate"
              value={stats.overall === null ? null : stats.overall * 100}
              suffix="%"
              hint="How often you were right"
            />
            <StatCard
              animate
              label="Brier score"
              value={stats.brier}
              decimals={2}
              hint={brierHint(stats.brier)}
              className="col-span-2 sm:col-span-2 lg:col-span-1"
            />
          </section>

          <div className="grid gap-4 lg:grid-cols-2 lg:gap-6">
            <ChartCard
              title="Calibration"
              sub="Confidence when you decided vs how often it came true. Bigger dots, more decisions."
              insight={stats.calibrationText}
            >
              <CalibrationChart buckets={stats.buckets} />
            </ChartCard>
            <ChartCard
              title="Luck vs skill"
              sub="Each reviewed decision by how good the call was and how it turned out. Select a dot to open it."
            >
              <LuckSkillChart decisions={stats.reviewed} />
            </ChartCard>
          </div>

          <div className="grid gap-4 lg:grid-cols-2 lg:gap-6">
            <ChartCard
              title="By mood"
              sub="Hit rate by how you felt when deciding. The line marks your overall rate."
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
  title,
  sub,
  insight,
  children,
}: {
  title: string
  sub: string
  insight?: string
  children: ReactNode
}) {
  return (
    <Card className="min-w-0 p-5 sm:p-6">
      <h2 className="font-display text-xl font-medium">{title}</h2>
      <p className="mt-1 text-sm text-muted">{sub}</p>
      {insight && (
        <p className="mt-4 flex items-start gap-2.5 rounded-xl bg-accent-soft px-3.5 py-3 text-sm font-medium text-accent-text">
          <Lightbulb className="mt-0.5 size-4 shrink-0" aria-hidden />
          {insight}
        </p>
      )}
      <div className="mt-5">{children}</div>
    </Card>
  )
}

function NeedsMoreData({ reviewed, dueCount }: { reviewed: number; dueCount: number }) {
  return (
    <Card className="mx-auto max-w-xl px-6 py-12 text-center">
      <h2 className="font-display text-2xl font-medium">Needs a bit more data</h2>
      <p className="mx-auto mt-2 max-w-sm text-muted">
        Calibration only means something with a handful of reviewed decisions. You’ve reviewed{' '}
        {reviewed} of the {MIN_REVIEWS_FOR_INSIGHTS} needed.
      </p>
      <div
        className="mx-auto mt-6 h-2 max-w-xs overflow-hidden rounded-full bg-surface-2"
        role="progressbar"
        aria-label="Reviews towards insights"
        aria-valuemin={0}
        aria-valuemax={MIN_REVIEWS_FOR_INSIGHTS}
        aria-valuenow={reviewed}
      >
        <div
          className="h-full rounded-full bg-accent"
          style={{ width: `${(reviewed / MIN_REVIEWS_FOR_INSIGHTS) * 100}%` }}
        />
      </div>
      <div className="mt-7 flex flex-col justify-center gap-2 sm:flex-row">
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
