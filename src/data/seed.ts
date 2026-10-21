import { addDays, setHours, setMinutes, startOfDay } from 'date-fns'
import type { Category, Decision, Happened, Mood, Rating, Stakes } from '@/lib/types'

/**
 * 24 decisions for a Head of Product, dated relative to `now` so the demo never
 * goes stale: 14 reviewed over the last 9 months, 4 due, 6 open.
 *
 * The story baked in: calls made at 80%+ came true ~69% of the time (overconfident),
 * the 60–79% calls are roughly calibrated, and Rushed decisions hit only 25%.
 */

interface SeedReview {
  happened: Happened
  decisionQuality: Rating
  outcomeQuality: Rating
  whatHappened: string
  lesson?: string
  /** Days after the review date that the review was actually done. */
  lag: number
}

interface SeedEntry {
  title: string
  category: Category
  stakes: Stakes
  mood?: Mood
  confidence: number
  context?: string
  options: string[]
  chosen?: string
  reasoning?: string
  expectedOutcome: string
  /** Days before `now` the decision was logged. */
  createdAgo: number
  /** Days between logging and the planned review. */
  horizon: number
  review?: SeedReview
}

const ENTRIES: SeedEntry[] = [
  // ── Reviewed ────────────────────────────────────────────────────────────────
  {
    title: 'Hire the senior candidate over the internal transfer',
    category: 'Hiring',
    stakes: 'High',
    mood: 'Calm',
    confidence: 90,
    context:
      'Two finalists for the platform PM role. The internal transfer knows our customers; the external candidate has shipped two developer platforms.',
    options: ['Senior external candidate', 'Internal transfer', 'Keep the role open'],
    chosen: 'Senior external candidate',
    reasoning:
      'The platform roadmap needs someone who has made these API mistakes before. Customer knowledge can be taught in a quarter; platform judgment cannot.',
    expectedOutcome: 'Ramped within 60 days and owns the API roadmap without me in the room.',
    createdAgo: 268,
    horizon: 90,
    review: {
      happened: 'Yes',
      decisionQuality: 4,
      outcomeQuality: 5,
      whatHappened:
        'Owned the API roadmap by week seven. The internal transfer moved to growth and is thriving there too.',
      lesson: 'Hire for the hardest part of the job, not the most familiar part.',
      lag: 3,
    },
  },
  {
    title: 'Delay the v2 launch by two weeks for onboarding fixes',
    category: 'Product',
    stakes: 'High',
    mood: 'Anxious',
    confidence: 85,
    context:
      'Beta users were dropping off at the workspace setup step. Marketing had a launch date booked with two newsletters.',
    options: ['Ship on the original date', 'Delay two weeks', 'Ship with onboarding behind a flag'],
    chosen: 'Delay two weeks',
    reasoning:
      'A launch spike into a leaky onboarding wastes the one moment of attention we get. Two weeks fixes the top three drop-off points.',
    expectedOutcome: 'Activation in launch week above 40%, versus 28% in the beta.',
    createdAgo: 250,
    horizon: 30,
    review: {
      happened: 'Yes',
      decisionQuality: 5,
      outcomeQuality: 4,
      whatHappened:
        'Activation hit 44% in launch week. One newsletter partner dropped us, which cost some reach.',
      lesson: 'Launch dates are softer than they feel. Tell partners early.',
      lag: 2,
    },
  },
  {
    title: 'Switch analytics from Mixpanel to PostHog',
    category: 'Product',
    stakes: 'Medium',
    mood: 'Rushed',
    confidence: 95,
    context: 'Mixpanel renewal quote came in 60% higher, due in ten days.',
    options: ['Renew Mixpanel', 'Migrate to PostHog', 'Negotiate a one-year bridge'],
    chosen: 'Migrate to PostHog',
    reasoning:
      'Cheaper, self-serve, and the team likes session replay. Migration looks like a sprint.',
    expectedOutcome: 'Fully migrated in one sprint with no gaps in the core funnel dashboards.',
    createdAgo: 231,
    horizon: 60,
    review: {
      happened: 'No',
      decisionQuality: 2,
      outcomeQuality: 2,
      whatHappened:
        'Took three sprints. We lost six weeks of comparable funnel data and two dashboards were wrong for a month.',
      lesson: 'A renewal deadline is not a migration plan. Negotiate the bridge first.',
      lag: 4,
    },
  },
  {
    title: 'Run the pricing experiment on annual plans only',
    category: 'Money',
    stakes: 'Medium',
    mood: 'Calm',
    confidence: 75,
    context: 'We want to test a 15% price increase without spooking monthly customers.',
    options: ['Test on all plans', 'Annual plans only', 'New signups only'],
    chosen: 'Annual plans only',
    reasoning:
      'Annual buyers are less price-sensitive and the revenue signal is larger per conversion.',
    expectedOutcome: 'Annual conversion drops by less than 5% at the higher price.',
    createdAgo: 210,
    horizon: 45,
    review: {
      happened: 'Yes',
      decisionQuality: 4,
      outcomeQuality: 4,
      whatHappened: 'Conversion dipped 3%. Net revenue per annual signup up 11%.',
      lag: 1,
    },
  },
  {
    title: 'Say no to the enterprise custom-feature request',
    category: 'Product',
    stakes: 'High',
    mood: 'Calm',
    confidence: 90,
    context:
      'Our largest prospect wanted a bespoke approval workflow as a condition of a three-year deal.',
    options: ['Build it', 'Say no', 'Offer the generic workflow on the roadmap'],
    chosen: 'Say no',
    reasoning:
      'One-customer features become permanent maintenance. If the deal depends on it, it is the wrong deal at this stage.',
    expectedOutcome: 'Either they sign without it, or we lose the deal without regret.',
    createdAgo: 196,
    horizon: 30,
    review: {
      happened: 'Yes',
      decisionQuality: 5,
      outcomeQuality: 4,
      whatHappened: 'They signed a one-year deal instead of three. No custom work.',
      lesson: 'Saying no clearly got a faster yes than three weeks of maybe would have.',
      lag: 2,
    },
  },
  {
    title: 'Sunset the legacy export feature',
    category: 'Product',
    stakes: 'Medium',
    mood: 'Calm',
    confidence: 80,
    context: 'Used by 2% of accounts, responsible for 15% of support tickets.',
    options: ['Keep maintaining it', 'Sunset with 60 days notice', 'Rebuild it'],
    chosen: 'Sunset with 60 days notice',
    reasoning: 'The new API covers every export use case we found in the logs.',
    expectedOutcome: 'Fewer than five churned accounts and support tickets down 10%.',
    createdAgo: 180,
    horizon: 90,
    review: {
      happened: 'Yes',
      decisionQuality: 4,
      outcomeQuality: 4,
      whatHappened: 'Two accounts churned. Tickets down 13%.',
      lag: 5,
    },
  },
  {
    title: 'Move the weekly roadmap review to async docs',
    category: 'Work',
    stakes: 'Low',
    mood: 'Excited',
    confidence: 95,
    context: 'The Monday roadmap meeting had grown to 14 people and 90 minutes.',
    options: ['Keep the meeting', 'Async doc with comments', 'Shorter meeting, fewer people'],
    chosen: 'Async doc with comments',
    reasoning: 'Read an article about async teams on Sunday and it sounded obviously right.',
    expectedOutcome: 'Same quality of roadmap feedback, 20 hours a week back across the team.',
    createdAgo: 160,
    horizon: 30,
    review: {
      happened: 'Yes',
      decisionQuality: 2,
      outcomeQuality: 4,
      whatHappened:
        'It worked, mostly because two engineering leads happened to love writing. Other teams copied it and struggled.',
      lesson:
        'It worked for reasons I didn’t plan for. Check who is in the room before copying a format.',
      lag: 1,
    },
  },
  {
    title: 'Take the conference talk slot in March',
    category: 'Work',
    stakes: 'Medium',
    mood: 'Anxious',
    confidence: 65,
    context: 'Invited to speak on product discovery. Prep would eat two weekends.',
    options: ['Accept', 'Decline', 'Suggest a teammate'],
    chosen: 'Accept',
    reasoning: 'Good for hiring and I need the practice, even if it is uncomfortable.',
    expectedOutcome: 'At least three solid inbound candidates mention the talk.',
    createdAgo: 150,
    horizon: 60,
    review: {
      happened: 'Yes',
      decisionQuality: 4,
      outcomeQuality: 5,
      whatHappened: 'Five candidates mentioned it; we hired one of them.',
      lag: 3,
    },
  },
  {
    title: 'Sign the annual contract with the new design agency',
    category: 'Money',
    stakes: 'High',
    mood: 'Rushed',
    confidence: 90,
    context: 'Agency offered 20% off if we signed before their quarter end, two days away.',
    options: ['Sign annual', 'Three-month pilot at full price', 'Keep freelancers'],
    chosen: 'Sign annual',
    reasoning: 'The discount was big and the portfolio was strong.',
    expectedOutcome: 'Rebrand delivered on time and the agency becomes our default design partner.',
    createdAgo: 128,
    horizon: 60,
    review: {
      happened: 'Partly',
      decisionQuality: 2,
      outcomeQuality: 3,
      whatHappened:
        'Rebrand was good but three weeks late. The lead designer we met in the pitch left after month two.',
      lesson: 'A deadline set by the seller is a signal to slow down.',
      lag: 2,
    },
  },
  {
    title: 'Promise the Q3 integrations to the sales team',
    category: 'Work',
    stakes: 'High',
    mood: 'Rushed',
    confidence: 85,
    context: 'Sales asked for committed dates on Salesforce and HubSpot integrations during QBR.',
    options: ['Commit to Q3', 'Commit to one integration', 'Share a range, not a date'],
    chosen: 'Commit to Q3',
    reasoning: 'Engineering estimated six weeks each. Felt like we had slack.',
    expectedOutcome: 'Both integrations live by the end of Q3.',
    createdAgo: 110,
    horizon: 60,
    review: {
      happened: 'No',
      decisionQuality: 2,
      outcomeQuality: 1,
      whatHappened:
        'Only Salesforce shipped, five weeks late. Two deals slipped and sales trust took a hit.',
      lesson: 'Never turn an estimate into a promise in the same meeting.',
      lag: 1,
    },
  },
  {
    title: 'Buy the standing desk now vs wait for the sale',
    category: 'Money',
    stakes: 'Low',
    mood: 'Tired',
    confidence: 70,
    options: ['Buy now', 'Wait for the November sale'],
    chosen: 'Buy now',
    reasoning: 'My back hurts now. A few weeks of comfort is worth more than the discount.',
    expectedOutcome: 'Back pain noticeably better within two weeks, and no buyer’s remorse.',
    createdAgo: 95,
    horizon: 14,
    review: {
      happened: 'Partly',
      decisionQuality: 3,
      outcomeQuality: 3,
      whatHappened: 'Back is better, but the sale came early and I’d have saved a bit.',
      lag: 2,
    },
  },
  {
    title: 'Back the junior PM to lead the mobile squad',
    category: 'Hiring',
    stakes: 'Medium',
    mood: 'Calm',
    confidence: 60,
    context: 'Mobile squad lead left. A junior PM asked for the stretch role.',
    options: ['Give the junior PM the role', 'Hire externally', 'Cover it myself'],
    chosen: 'Give the junior PM the role',
    reasoning: 'Strong instincts, trusted by engineers. I can coach weekly.',
    expectedOutcome: 'Squad hits its quarterly goals with the junior PM in the lead.',
    createdAgo: 85,
    horizon: 45,
    review: {
      happened: 'Partly',
      decisionQuality: 4,
      outcomeQuality: 2,
      whatHappened:
        'Two of four goals hit. A platform outage ate three weeks of the quarter. The PM grew a lot.',
      lesson: 'Judge the bet by the growth, not just the scorecard. The outage was nobody’s call.',
      lag: 3,
    },
  },
  {
    title: 'Skip the half-marathon training block to protect sleep',
    category: 'Health',
    stakes: 'Low',
    mood: 'Rushed',
    confidence: 60,
    context: 'Launch season plus 5am runs was wrecking my sleep.',
    options: ['Keep training', 'Skip this block', 'Switch to shorter evening runs'],
    chosen: 'Skip this block',
    reasoning: 'Sleep is the bottleneck for everything else right now.',
    expectedOutcome: 'Averaging seven hours of sleep and still running twice a week.',
    createdAgo: 70,
    horizon: 30,
    review: {
      happened: 'Partly',
      decisionQuality: 3,
      outcomeQuality: 3,
      whatHappened: 'Sleep improved to about 6.5 hours. Running dropped to once a week.',
      lag: 2,
    },
  },
  {
    title: 'Refinance the car loan at the credit union',
    category: 'Money',
    stakes: 'Medium',
    mood: 'Tired',
    confidence: 55,
    options: ['Refinance now', 'Wait for rates to drop', 'Pay it down faster instead'],
    chosen: 'Refinance now',
    reasoning: 'Rate is 1.8 points lower and nobody can predict the next move.',
    expectedOutcome: 'Save at least $40 a month after fees.',
    createdAgo: 60,
    horizon: 30,
    review: {
      happened: 'Partly',
      decisionQuality: 3,
      outcomeQuality: 2,
      whatHappened:
        'Saving $26 a month. Fees were higher than quoted, and rates dropped again a month later.',
      lesson: 'Get the fee schedule in writing before deciding.',
      lag: 4,
    },
  },

  // ── Due now (review dates 2–20 days ago) ────────────────────────────────────
  {
    title: 'Run a two-week design sprint before the dashboard rewrite',
    category: 'Product',
    stakes: 'Medium',
    mood: 'Excited',
    confidence: 80,
    context: 'Engineering wanted to start the dashboard rewrite straight from the old spec.',
    options: ['Start building now', 'Two-week design sprint first', 'Prototype in code'],
    chosen: 'Two-week design sprint first',
    reasoning:
      'The old spec predates half our customers. Two weeks of design is cheap next to a quarter of rework.',
    expectedOutcome:
      'Rewrite scope shrinks by at least a third and engineers say the spec is clearer.',
    createdAgo: 50,
    horizon: 30, // due 20 days ago
  },
  {
    title: 'Cut the referral program and move the budget to content',
    category: 'Work',
    stakes: 'Medium',
    mood: 'Calm',
    confidence: 70,
    context: 'Referrals drive 4% of signups at $310 CAC. Content drives 22% at $90.',
    options: ['Keep both', 'Cut referrals', 'Redesign the referral reward'],
    chosen: 'Cut referrals',
    reasoning: 'The numbers are lopsided and the program needs an owner we don’t have.',
    expectedOutcome: 'Total signups flat or up within 60 days, with lower blended CAC.',
    createdAgo: 72,
    horizon: 60, // due 12 days ago
  },
  {
    title: 'Hire a contractor for the iOS backlog instead of a full-time engineer',
    category: 'Hiring',
    stakes: 'Medium',
    mood: 'Anxious',
    confidence: 75,
    context: 'iOS backlog is 40 tickets deep. Headcount freeze until next fiscal year.',
    options: ['Contractor for three months', 'Wait for headcount', 'Borrow an engineer from web'],
    chosen: 'Contractor for three months',
    reasoning:
      'Backlog is well-defined bug work, which suits a contractor. Doesn’t touch headcount.',
    expectedOutcome: 'Backlog under 10 tickets and App Store rating back above 4.5.',
    createdAgo: 51,
    horizon: 45, // due 6 days ago
  },
  {
    title: 'Turn down the VP Product offer from the Series B startup',
    category: 'Personal',
    stakes: 'High',
    mood: 'Rushed',
    confidence: 70,
    context:
      'Recruiter offer: bigger title, 30% more cash, less equity upside. They wanted an answer in 48 hours.',
    options: ['Accept', 'Decline', 'Ask for two more weeks'],
    chosen: 'Decline',
    reasoning:
      'Current team is mid-turnaround and I want to see it through. The deadline felt like pressure, not opportunity.',
    expectedOutcome:
      'No regret after a month, and a promotion conversation opens here by the next cycle.',
    createdAgo: 32,
    horizon: 30, // due 2 days ago
  },

  // ── Open (review dates in the next 1–12 weeks) ──────────────────────────────
  {
    title: 'Consolidate three onboarding emails into one',
    category: 'Product',
    stakes: 'Low',
    mood: 'Calm',
    confidence: 75,
    options: ['Keep the sequence', 'One email', 'In-app checklist instead'],
    chosen: 'One email',
    reasoning: 'Open rates fall off a cliff after the first email anyway.',
    expectedOutcome: 'Day-7 activation unchanged or better, unsubscribes down.',
    createdAgo: 5,
    horizon: 14,
  },
  {
    title: 'Promote the senior designer to design lead',
    category: 'Hiring',
    stakes: 'High',
    mood: 'Calm',
    confidence: 85,
    context: 'Design team has grown to five without a lead. Two strong internal candidates.',
    options: ['Promote the senior designer', 'Promote the systems designer', 'Hire externally'],
    chosen: 'Promote the senior designer',
    reasoning: 'Already the person others go to for critique. Wants to manage.',
    expectedOutcome: 'Design team runs its own rituals and the other candidate stays.',
    createdAgo: 3,
    horizon: 30,
  },
  {
    title: 'Pause paid acquisition for Q4',
    category: 'Money',
    stakes: 'High',
    mood: 'Anxious',
    confidence: 60,
    context: 'Paid CAC up 40% since summer; payback now over 20 months.',
    options: ['Keep spending', 'Pause fully', 'Cut by half and test new channels'],
    chosen: 'Pause fully',
    reasoning:
      'A clean pause tells us how much paid is really adding versus taking credit for organic.',
    expectedOutcome: 'Signups drop less than 15% and we learn the true incremental lift.',
    createdAgo: 12,
    horizon: 42,
  },
  {
    title: 'Adopt a no-meeting Wednesday for the product team',
    category: 'Work',
    stakes: 'Low',
    mood: 'Excited',
    confidence: 90,
    options: ['No-meeting Wednesday', 'Meeting-free mornings', 'Do nothing'],
    chosen: 'No-meeting Wednesday',
    reasoning: 'The team keeps asking for focus time. Cheap to try, easy to undo.',
    expectedOutcome: 'Most of the team says Wednesdays are their most productive day.',
    createdAgo: 1,
    horizon: 45,
  },
  {
    title: 'Start strength training three mornings a week',
    category: 'Health',
    stakes: 'Medium',
    mood: 'Calm',
    confidence: 70,
    options: ['Gym three mornings', 'Home workouts', 'Personal trainer once a week'],
    chosen: 'Gym three mornings',
    reasoning: 'Mornings are the only time that doesn’t get eaten by work.',
    expectedOutcome: 'Still going three times a week after two months.',
    createdAgo: 20,
    horizon: 80,
  },
  {
    title: 'Rebuild the settings page instead of patching it',
    category: 'Product',
    stakes: 'Medium',
    mood: 'Tired',
    confidence: 80,
    context: 'Settings has 40+ options across six tabs and is the top source of how-to tickets.',
    options: ['Patch the worst five issues', 'Full rebuild', 'Hide advanced settings'],
    chosen: 'Full rebuild',
    reasoning: 'Patching keeps the structure that causes the confusion.',
    expectedOutcome: 'Settings-related tickets down 30% within a month of launch.',
    createdAgo: 8,
    horizon: 92,
  },
]

function at(now: Date, offsetDays: number, hour = 9, minute = 30): string {
  return setMinutes(setHours(addDays(startOfDay(now), offsetDays), hour), minute).toISOString()
}

export function buildSeed(now: Date = new Date()): Decision[] {
  return ENTRIES.map((e, i) => {
    const createdOffset = -e.createdAgo
    const reviewOffset = createdOffset + e.horizon
    const decision: Decision = {
      id: `seed-${String(i + 1).padStart(2, '0')}`,
      title: e.title,
      context: e.context,
      options: e.options,
      chosen: e.chosen,
      reasoning: e.reasoning,
      expectedOutcome: e.expectedOutcome,
      confidence: e.confidence,
      category: e.category,
      stakes: e.stakes,
      mood: e.mood,
      createdAt: at(now, createdOffset, 9 + (i % 8), (i * 7) % 60),
      reviewAt: at(now, reviewOffset),
    }
    if (e.review) {
      const { lag, ...review } = e.review
      decision.review = { ...review, reviewedAt: at(now, reviewOffset + lag, 18) }
    }
    return decision
  })
}
