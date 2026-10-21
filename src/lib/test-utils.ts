import type { Decision, Happened, Mood, Rating } from './types'

let counter = 0

export function makeDecision(overrides: Partial<Decision> = {}): Decision {
  counter++
  return {
    id: `d${counter}`,
    title: `Decision ${counter}`,
    options: [],
    expectedOutcome: 'Something good',
    confidence: 70,
    category: 'Work',
    stakes: 'Medium',
    createdAt: '2026-01-01T09:00:00.000Z',
    reviewAt: '2026-02-01T09:00:00.000Z',
    ...overrides,
  }
}

export function makeReviewed(
  confidence: number,
  happened: Happened,
  extra: { mood?: Mood; decisionQuality?: Rating; outcomeQuality?: Rating } = {},
): Decision {
  return makeDecision({
    confidence,
    mood: extra.mood,
    review: {
      reviewedAt: '2026-02-02T09:00:00.000Z',
      whatHappened: 'It happened',
      happened,
      decisionQuality: extra.decisionQuality ?? 3,
      outcomeQuality: extra.outcomeQuality ?? 3,
    },
  })
}
