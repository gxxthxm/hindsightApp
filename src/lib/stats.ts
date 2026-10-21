import type { Category, Decision, Happened, Mood, Rating, ReviewedDecision } from './types'
import { getStatus, isReviewed } from './status'

/** Yes = 1, Partly = 0.5, No = 0. */
export function hitScore(happened: Happened): number {
  if (happened === 'Yes') return 1
  if (happened === 'Partly') return 0.5
  return 0
}

function mean(values: number[]): number | null {
  if (values.length === 0) return null
  return values.reduce((sum, v) => sum + v, 0) / values.length
}

export function reviewedOnly(decisions: Decision[]): ReviewedDecision[] {
  return decisions.filter(isReviewed)
}

/** Share of expected outcomes that came true (0–1), or null with no reviews. */
export function hitRate(decisions: Decision[]): number | null {
  return mean(reviewedOnly(decisions).map((d) => hitScore(d.review.happened)))
}

/**
 * Brier score: mean of (confidence − result)². 0 is perfect; always answering
 * 50% scores 0.25; lower is better.
 */
export function brierScore(decisions: Decision[]): number | null {
  return mean(
    reviewedOnly(decisions).map((d) => (d.confidence / 100 - hitScore(d.review.happened)) ** 2),
  )
}

export function averageConfidence(decisions: Decision[]): number | null {
  return mean(decisions.map((d) => d.confidence))
}

/** Reviewed ÷ (reviewed + due): of the decisions whose time has come, how many were closed. */
export function reviewCompletionRate(decisions: Decision[], now: Date = new Date()): number | null {
  let reviewed = 0
  let due = 0
  for (const d of decisions) {
    const status = getStatus(d, now)
    if (status === 'reviewed') reviewed++
    else if (status === 'due') due++
  }
  return reviewed + due === 0 ? null : reviewed / (reviewed + due)
}

export interface CalibrationBucket {
  label: string
  min: number
  max: number
  /** Bucket midpoint, used as the x position. */
  midpoint: number
  count: number
  /** Actual hit rate in percent, null when the bucket is empty. */
  hitRate: number | null
  avgConfidence: number | null
}

export const CALIBRATION_BUCKETS: ReadonlyArray<{ min: number; max: number }> = [
  { min: 50, max: 59 },
  { min: 60, max: 69 },
  { min: 70, max: 79 },
  { min: 80, max: 89 },
  { min: 90, max: 100 },
]

export function bucketFor(confidence: number): number {
  return CALIBRATION_BUCKETS.findIndex((b) => confidence >= b.min && confidence <= b.max)
}

export function calibrationBuckets(decisions: Decision[]): CalibrationBucket[] {
  const reviewed = reviewedOnly(decisions)
  return CALIBRATION_BUCKETS.map(({ min, max }) => {
    const inBucket = reviewed.filter((d) => d.confidence >= min && d.confidence <= max)
    const rate = mean(inBucket.map((d) => hitScore(d.review.happened)))
    return {
      label: `${min}–${max}%`,
      min,
      max,
      midpoint: max === 100 ? 95 : (min + max + 1) / 2,
      count: inBucket.length,
      hitRate: rate === null ? null : Math.round(rate * 100),
      avgConfidence: mean(inBucket.map((d) => d.confidence)),
    }
  })
}

/** Gap (percentage points) beyond which a bucket counts as mis-calibrated. */
export const CALIBRATION_TOLERANCE = 10

/** One plain-English sentence describing the shape of the calibration curve. */
export function calibrationInsight(decisions: Decision[]): string {
  const buckets = calibrationBuckets(decisions).filter((b) => b.count >= 2 && b.hitRate !== null)
  if (buckets.length === 0) return 'Review a few more decisions to see how calibrated you are.'

  const gap = (b: CalibrationBucket) => (b.hitRate ?? 0) - b.midpoint
  const over = buckets.filter((b) => gap(b) < -CALIBRATION_TOLERANCE)
  const under = buckets.filter((b) => gap(b) > CALIBRATION_TOLERANCE)

  if (over.length === 0 && under.length === 0) {
    return 'Your confidence tracks reality well. When you say 70%, it happens about 70% of the time.'
  }
  if (over.length > 0 && under.length === 0) {
    const threshold = Math.min(...over.map((b) => b.min))
    const pool = reviewedOnly(decisions).filter((d) => d.confidence >= threshold)
    const actual = Math.round((hitRate(pool) ?? 0) * 100)
    const said = Math.round(averageConfidence(pool) ?? 0)
    return threshold === 50
      ? `You're overconfident across the board: your calls averaged ${said}% confidence but came true ${actual}% of the time.`
      : `You're overconfident above ${threshold}%: those calls averaged ${said}% confidence but came true ${actual}% of the time.`
  }
  if (under.length > 0 && over.length === 0) {
    const threshold = Math.max(...under.map((b) => b.max))
    return `You're underconfident below ${threshold + 1}%: those calls came true more often than you expected.`
  }
  return 'Your calibration is uneven: some confidence levels run hot and others run cold.'
}

export interface GroupStat<K extends string> {
  key: K
  count: number
  /** 0–1 */
  hitRate: number
}

/** Hit rate per group across reviewed decisions, highest first. Groups without reviews are omitted. */
export function hitRateBy<K extends string>(
  decisions: Decision[],
  keyOf: (d: ReviewedDecision) => K | undefined,
): GroupStat<K>[] {
  const groups = new Map<K, number[]>()
  for (const d of reviewedOnly(decisions)) {
    const key = keyOf(d)
    if (key === undefined) continue
    const scores = groups.get(key) ?? []
    scores.push(hitScore(d.review.happened))
    groups.set(key, scores)
  }
  return [...groups.entries()]
    .map(([key, scores]) => ({ key, count: scores.length, hitRate: mean(scores) ?? 0 }))
    .sort((a, b) => b.hitRate - a.hitRate || b.count - a.count)
}

export const hitRateByCategory = (decisions: Decision[]) =>
  hitRateBy<Category>(decisions, (d) => d.category)

export const hitRateByMood = (decisions: Decision[]) => hitRateBy<Mood>(decisions, (d) => d.mood)

/** Sentence about the mood that most underperforms the overall hit rate, if any is notable. */
export function moodInsight(decisions: Decision[]): string | null {
  const overall = hitRate(decisions)
  if (overall === null) return null
  const worst = hitRateByMood(decisions)
    .filter((g) => g.count >= 2)
    .sort((a, b) => a.hitRate - b.hitRate)[0]
  if (!worst || overall - worst.hitRate < 0.15) return null
  const pct = (n: number) => `${Math.round(n * 100)}%`
  return `Decisions made while ${worst.key} hit ${pct(worst.hitRate)} vs ${pct(overall)} overall.`
}

export type Quadrant = 'Earned it' | 'Bad luck' | 'Dumb luck' | 'Lesson'

/** Decision quality × outcome quality, split at 3. */
export function quadrantFor(decisionQuality: Rating, outcomeQuality: Rating): Quadrant {
  const goodDecision = decisionQuality >= 3
  const goodOutcome = outcomeQuality >= 3
  if (goodDecision && goodOutcome) return 'Earned it'
  if (goodDecision) return 'Bad luck'
  if (goodOutcome) return 'Dumb luck'
  return 'Lesson'
}

export const QUADRANT_BLURB: Record<Quadrant, string> = {
  'Earned it': 'Good call, good result. Enjoy it, but note what made the call good.',
  'Bad luck': 'A sound call that didn’t pay off. Don’t punish the process for the dice.',
  'Dumb luck': 'It worked out, but the call was shaky. Don’t bank on that twice.',
  Lesson: 'Weak call, weak result. The most useful kind of entry in this journal.',
}

export const MIN_REVIEWS_FOR_INSIGHTS = 5
