import { addDays, differenceInCalendarDays, endOfDay, isAfter, parseISO } from 'date-fns'
import type { Decision, ReviewedDecision, Status } from './types'

/** The date a decision is next due: a snooze overrides the original review date. */
export function effectiveReviewDate(d: Pick<Decision, 'reviewAt' | 'snoozedUntil'>): Date {
  return parseISO(d.snoozedUntil ?? d.reviewAt)
}

/** reviewed if a review exists; due if the (snoozed) review date is today or earlier; else open. */
export function getStatus(d: Decision, now: Date = new Date()): Status {
  if (d.review) return 'reviewed'
  return isAfter(effectiveReviewDate(d), endOfDay(now)) ? 'open' : 'due'
}

export function isReviewed(d: Decision): d is ReviewedDecision {
  return d.review !== undefined
}

/** Due decisions, oldest due date first. */
export function dueQueue(decisions: Decision[], now: Date = new Date()): Decision[] {
  return decisions
    .filter((d) => getStatus(d, now) === 'due')
    .sort((a, b) => effectiveReviewDate(a).getTime() - effectiveReviewDate(b).getTime())
}

/** "due today", "due yesterday", "due 12 days ago". */
export function dueLabel(d: Decision, now: Date = new Date()): string {
  const days = differenceInCalendarDays(now, effectiveReviewDate(d))
  if (days <= 0) return 'due today'
  if (days === 1) return 'due yesterday'
  return `due ${days} days ago`
}

/** "review tomorrow", "review in 9 days", "review in 3 weeks". */
export function reviewInLabel(d: Decision, now: Date = new Date()): string {
  const days = differenceInCalendarDays(effectiveReviewDate(d), now)
  if (days <= 0) return 'review today'
  if (days === 1) return 'review tomorrow'
  if (days < 14) return `review in ${days} days`
  if (days < 60) return `review in ${Math.round(days / 7)} weeks`
  return `review in ${Math.round(days / 30)} months`
}

export function snoozeDate(now: Date = new Date(), days = 7): string {
  return addDays(now, days).toISOString()
}

export const STATUS_LABEL: Record<Status, string> = {
  open: 'Open',
  due: 'Due',
  reviewed: 'Reviewed',
}
