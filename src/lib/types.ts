export const CATEGORIES = ['Work', 'Product', 'Hiring', 'Money', 'Personal', 'Health'] as const
export const STAKES = ['Low', 'Medium', 'High'] as const
export const MOODS = ['Calm', 'Rushed', 'Anxious', 'Excited', 'Tired'] as const
export const HAPPENED = ['Yes', 'Partly', 'No'] as const

export type Category = (typeof CATEGORIES)[number]
export type Stakes = (typeof STAKES)[number]
export type Mood = (typeof MOODS)[number]
export type Happened = (typeof HAPPENED)[number]
export type Rating = 1 | 2 | 3 | 4 | 5

export interface Review {
  reviewedAt: string // ISO date
  whatHappened: string
  happened: Happened
  outcomeQuality: Rating
  decisionQuality: Rating
  lesson?: string
}

export interface Decision {
  id: string
  title: string
  context?: string
  options: string[]
  chosen?: string
  reasoning?: string
  expectedOutcome: string
  confidence: number // 50–100, step 5
  category: Category
  stakes: Stakes
  mood?: Mood
  createdAt: string // ISO date
  reviewAt: string // ISO date
  snoozedUntil?: string
  review?: Review // present = reviewed
}

export type Status = 'open' | 'due' | 'reviewed'

export type ReviewedDecision = Decision & { review: Review }
