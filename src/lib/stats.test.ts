import { describe, expect, it } from 'vitest'
import {
  averageConfidence,
  brierScore,
  bucketFor,
  calibrationBuckets,
  calibrationInsight,
  hitRate,
  hitRateByMood,
  hitScore,
  moodInsight,
  quadrantFor,
  reviewCompletionRate,
} from './stats'
import { makeDecision, makeReviewed } from './test-utils'
import { buildSeed } from '@/data/seed'
import { getStatus } from './status'

describe('hitScore and hitRate', () => {
  it('scores Yes as 1, Partly as 0.5 and No as 0', () => {
    expect(hitScore('Yes')).toBe(1)
    expect(hitScore('Partly')).toBe(0.5)
    expect(hitScore('No')).toBe(0)
  })

  it('averages scores across reviewed decisions only', () => {
    const decisions = [
      makeReviewed(80, 'Yes'),
      makeReviewed(80, 'Partly'),
      makeReviewed(80, 'No'),
      makeReviewed(80, 'Yes'),
      makeDecision(), // unreviewed: ignored
    ]
    expect(hitRate(decisions)).toBeCloseTo(0.625)
  })

  it('returns null when nothing has been reviewed', () => {
    expect(hitRate([makeDecision()])).toBeNull()
  })
})

describe('brierScore', () => {
  it('is 0 for perfectly confident, correct calls', () => {
    expect(brierScore([makeReviewed(100, 'Yes')])).toBe(0)
  })

  it('is 0.25 for coin-flip calls regardless of the result', () => {
    expect(brierScore([makeReviewed(50, 'Yes'), makeReviewed(50, 'No')])).toBeCloseTo(0.25)
  })

  it('is the mean squared gap between confidence and result', () => {
    // (0.9 - 0)^2 = 0.81, (0.8 - 0.5)^2 = 0.09, (0.6 - 1)^2 = 0.16 → mean 0.353…
    const decisions = [makeReviewed(90, 'No'), makeReviewed(80, 'Partly'), makeReviewed(60, 'Yes')]
    expect(brierScore(decisions)).toBeCloseTo((0.81 + 0.09 + 0.16) / 3)
  })

  it('returns null when nothing has been reviewed', () => {
    expect(brierScore([])).toBeNull()
  })
})

describe('calibrationBuckets', () => {
  it('assigns confidences to the five buckets, with 100 in the top bucket', () => {
    expect([50, 55, 60, 65, 70, 75, 80, 85, 90, 95, 100].map(bucketFor)).toEqual([
      0, 0, 1, 1, 2, 2, 3, 3, 4, 4, 4,
    ])
  })

  it('computes count, hit rate and midpoint per bucket', () => {
    const buckets = calibrationBuckets([
      makeReviewed(90, 'Yes'),
      makeReviewed(95, 'No'),
      makeReviewed(100, 'Partly'),
      makeReviewed(60, 'Yes'),
      makeDecision({ confidence: 60 }), // unreviewed: ignored
    ])
    expect(buckets.map((b) => b.midpoint)).toEqual([55, 65, 75, 85, 95])
    expect(buckets.map((b) => b.count)).toEqual([0, 1, 0, 0, 3])
    expect(buckets[4].hitRate).toBe(50)
    expect(buckets[1].hitRate).toBe(100)
    expect(buckets[0].hitRate).toBeNull()
    expect(buckets[4].avgConfidence).toBe(95)
  })

  it('calls out overconfidence in high buckets', () => {
    const decisions = [
      makeReviewed(90, 'Yes'),
      makeReviewed(90, 'No'),
      makeReviewed(95, 'Partly'),
      makeReviewed(60, 'Yes'),
      makeReviewed(60, 'Yes'),
      makeReviewed(65, 'No'),
    ]
    expect(calibrationInsight(decisions)).toMatch(/overconfident above 90%/)
  })

  it('says so when calibration is good', () => {
    const decisions = [
      makeReviewed(60, 'Yes'),
      makeReviewed(65, 'Partly'),
      makeReviewed(60, 'Partly'),
    ]
    expect(calibrationInsight(decisions)).toMatch(/tracks reality well/)
  })
})

describe('other stats', () => {
  const now = new Date('2026-10-22T12:00:00')

  it('computes review completion over decisions whose time has come', () => {
    const decisions = [
      makeReviewed(70, 'Yes'),
      makeReviewed(70, 'No'),
      makeReviewed(70, 'Yes'),
      makeDecision({ reviewAt: '2026-10-01T09:00:00' }), // due
      makeDecision({ reviewAt: '2026-12-01T09:00:00' }), // open: not counted
    ]
    expect(reviewCompletionRate(decisions, now)).toBeCloseTo(0.75)
    expect(reviewCompletionRate([], now)).toBeNull()
  })

  it('averages confidence across all decisions', () => {
    expect(averageConfidence([makeDecision({ confidence: 60 }), makeReviewed(90, 'Yes')])).toBe(75)
  })

  it('groups hit rate by mood and flags a weak mood', () => {
    const decisions = [
      makeReviewed(80, 'No', { mood: 'Rushed' }),
      makeReviewed(80, 'Partly', { mood: 'Rushed' }),
      makeReviewed(80, 'Yes', { mood: 'Calm' }),
      makeReviewed(80, 'Yes', { mood: 'Calm' }),
      makeReviewed(80, 'Yes'),
    ]
    expect(hitRateByMood(decisions)).toEqual([
      { key: 'Calm', count: 2, hitRate: 1 },
      { key: 'Rushed', count: 2, hitRate: 0.25 },
    ])
    expect(moodInsight(decisions)).toBe('Decisions made while Rushed hit 25% vs 70% overall.')
  })

  it('places reviews in the luck vs skill quadrants', () => {
    expect(quadrantFor(3, 3)).toBe('Earned it')
    expect(quadrantFor(5, 1)).toBe('Bad luck')
    expect(quadrantFor(2, 4)).toBe('Dumb luck')
    expect(quadrantFor(1, 2)).toBe('Lesson')
  })
})

describe('seed data', () => {
  const now = new Date()
  const seed = buildSeed(now)

  it('has 24 decisions: 14 reviewed, 4 due, 6 open', () => {
    const statuses = seed.map((d) => getStatus(d, now))
    expect(seed).toHaveLength(24)
    expect(statuses.filter((s) => s === 'reviewed')).toHaveLength(14)
    expect(statuses.filter((s) => s === 'due')).toHaveLength(4)
    expect(statuses.filter((s) => s === 'open')).toHaveLength(6)
  })

  it('tells the story: overconfident at the top, and Rushed calls do worse', () => {
    const top = calibrationBuckets(seed)[4]
    expect(top.hitRate).toBeGreaterThanOrEqual(60)
    expect(top.hitRate).toBeLessThanOrEqual(75)
    expect(calibrationInsight(seed)).toMatch(/overconfident/)
    expect(moodInsight(seed)).toMatch(/Rushed/)
  })

  it('never puts a review date in the future for reviewed decisions', () => {
    for (const d of seed) {
      if (d.review)
        expect(new Date(d.review.reviewedAt).getTime()).toBeLessThanOrEqual(now.getTime())
    }
  })
})
