import { describe, expect, it } from 'vitest'
import { dueLabel, dueQueue, getStatus, reviewInLabel } from './status'
import { makeDecision, makeReviewed } from './test-utils'

const now = new Date('2026-10-22T15:00:00')

describe('getStatus', () => {
  it('is reviewed whenever a review exists, even if the date is in the future', () => {
    const d = { ...makeReviewed(80, 'Yes'), reviewAt: '2027-01-01T00:00:00' }
    expect(getStatus(d, now)).toBe('reviewed')
  })

  it('is due when the review date is in the past', () => {
    expect(getStatus(makeDecision({ reviewAt: '2026-10-10T09:00:00' }), now)).toBe('due')
  })

  it('is due when the review date is later today', () => {
    expect(getStatus(makeDecision({ reviewAt: '2026-10-22T23:30:00' }), now)).toBe('due')
  })

  it('is open when the review date is tomorrow or later', () => {
    expect(getStatus(makeDecision({ reviewAt: '2026-10-23T00:10:00' }), now)).toBe('open')
  })

  it('uses snoozedUntil instead of reviewAt when present', () => {
    const snoozed = makeDecision({
      reviewAt: '2026-10-01T09:00:00',
      snoozedUntil: '2026-10-29T09:00:00',
    })
    expect(getStatus(snoozed, now)).toBe('open')
    expect(getStatus({ ...snoozed, snoozedUntil: '2026-10-21T09:00:00' }, now)).toBe('due')
  })
})

describe('dueQueue', () => {
  it('returns only due decisions, oldest first', () => {
    const a = makeDecision({ reviewAt: '2026-10-15T09:00:00' })
    const b = makeDecision({ reviewAt: '2026-10-02T09:00:00' })
    const open = makeDecision({ reviewAt: '2026-12-01T09:00:00' })
    const done = makeReviewed(70, 'Yes')
    expect(dueQueue([a, open, b, done], now).map((d) => d.id)).toEqual([b.id, a.id])
  })
})

describe('labels', () => {
  it('describes how overdue a decision is', () => {
    expect(dueLabel(makeDecision({ reviewAt: '2026-10-10T09:00:00' }), now)).toBe('due 12 days ago')
    expect(dueLabel(makeDecision({ reviewAt: '2026-10-21T09:00:00' }), now)).toBe('due yesterday')
    expect(dueLabel(makeDecision({ reviewAt: '2026-10-22T09:00:00' }), now)).toBe('due today')
  })

  it('describes when an open decision will come up', () => {
    expect(reviewInLabel(makeDecision({ reviewAt: '2026-10-23T09:00:00' }), now)).toBe(
      'review tomorrow',
    )
    expect(reviewInLabel(makeDecision({ reviewAt: '2026-11-12T09:00:00' }), now)).toBe(
      'review in 3 weeks',
    )
  })
})
