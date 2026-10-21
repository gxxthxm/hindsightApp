# Hindsight

**A decision journal that separates good decisions from good luck.**

Log a decision with what you expect and how sure you are, get prompted to review it later, and see how well-calibrated your judgment really is. Frontend-only demo with realistic seed data, so it looks alive on first load.

![Hindsight dashboard screenshot](docs/screenshot.png)

> _Screenshot placeholder: add `docs/screenshot.png` after deploying._

## Features

- **Quick capture** (`/new`, or press <kbd>N</kbd> anywhere). Three required fields: title, expected outcome, and a 50–100% confidence slider with live labels ("Coin flip" … "Certain (really?)"). Optional context, options considered, chosen option, reasoning, category, stakes and mood. Review-date presets (2 weeks to 6 months) or a custom date. <kbd>⌘/Ctrl</kbd>+<kbd>Enter</kbd> saves.
- **Review queue**: a card stack of decisions whose review date has arrived, oldest first ("due 12 days ago"), with Review and Snooze 1 week. The due count shows as a badge in the nav.
- **Three-step review flow**: re-read what you believed, record what happened (Yes / Partly / No), then rate outcome quality and decision quality separately. The result lands on a 2×2: _Earned it_, _Bad luck_, _Dumb luck_ or _Lesson_.
- **Insights**: a calibration chart (confidence bucket vs actual hit rate against a dashed perfect-calibration diagonal), a luck-vs-skill scatter, and hit rate by mood and by category. Stat cards cover total decisions, review completion, average confidence, hit rate and Brier score, and a plain-English annotation says what the chart means.
- **Decision list**: search, status and category chips, a confidence filter, and sorting. Filters live in the URL.
- **Decision detail**: "Then vs Now" columns, edit (in a dialog) and delete with an undo toast.
- **Settings**: light/dark toggle, Export JSON, Reset demo data, Clear all data (with undo).
- **Motion with intent**: page transitions, a sliding nav indicator, a swipeable review deck that springs forward, word-by-word headlines, a rolling confidence dial, sliding step transitions, a verdict burst, count-up stats and charts that draw in when scrolled into view. All of it is switched off under `prefers-reduced-motion`.
- Responsive from 375 px (bottom tab bar) to desktop (sidebar). Keyboard navigable, visible focus rings, colour is never the only signal, and charts have text summaries for screen readers. Respects `prefers-reduced-motion`.

## Tech stack

| Layer      | Choice                                                      |
| ---------- | ----------------------------------------------------------- |
| Build      | Vite + React 19 + TypeScript (strict)                       |
| Styling    | Tailwind CSS v4 with CSS-variable design tokens             |
| Type       | Instrument Serif (display), Geist (UI), Geist Mono (labels) |
| Components | shadcn/ui-style wrappers over Radix primitives              |
| Routing    | React Router (`HashRouter`, so no server rewrites)          |
| State      | Zustand with `persist` → `localStorage`                     |
| Charts     | Recharts (lazy-loaded with the Insights route)              |
| Dates      | date-fns                                                    |
| Icons      | lucide-react                                                |
| Motion     | Framer Motion                                               |
| Quality    | Vitest, ESLint (typescript-eslint, react-hooks), Prettier   |
| Deploy     | GitHub Pages via GitHub Actions                             |

No backend, no API calls, no environment variables. The production build uses `base: './'`, so it runs from any subpath. Initial JS is about 221 KB gzipped; the Insights chunk adds about 106 KB.

## Running it

Requires Node 20+ (CI uses Node 24).

```bash
npm install
npm run dev          # http://localhost:5173
npm test             # Vitest: stats, calibration, status and seed-data tests
npm run lint         # ESLint
npm run format:check # Prettier
npm run build        # type-check + production build to dist/
npm run preview      # serve the production build
```

### Deploying to GitHub Pages

`.github/workflows/deploy.yml` lints, tests, builds and deploys on every push to `main`. In the repository go to **Settings → Pages → Build and deployment** and set **Source** to **GitHub Actions**.

## Project structure

```
src/
  components/      UI building blocks, charts, layout shell
    ui/            shadcn-style primitives (button, dialog, slider, menu, toast…)
    charts/        calibration, luck-vs-skill, hit-rate bars
    layout/        sidebar, mobile tab bar, settings menu, demo banner
  routes/          Dashboard, NewDecision, DecisionList, DecisionDetail, ReviewFlow, Insights
  store/           Zustand stores (decisions, UI prefs, toasts)
  lib/             types, status derivation, stats maths (pure + unit-tested)
  data/seed.ts     24 seed decisions, dated relative to today
```

## Data

Decisions are stored in `localStorage` under `hindsight.v1` (Zustand's persist envelope: `{ state: { decisions }, version }`). UI preferences (theme, banner) live under `hindsight.v1.ui`. Status is derived, not stored: **reviewed** if a review exists, **due** if `snoozedUntil ?? reviewAt` is today or earlier, otherwise **open**.

- **Hit rate**: Yes = 1, Partly = 0.5, No = 0, averaged over reviewed decisions.
- **Brier score**: mean of `(confidence/100 − result)²`. 0 is perfect; always saying 50% scores 0.25.
- **Calibration buckets**: 50–59, 60–69, 70–79, 80–89 and 90–100, plotted at their midpoints.

The seed tells a story: a Head of Product who is roughly calibrated at 60–79% but overconfident at 80%+ (those calls come true about 69% of the time), and whose _Rushed_ decisions hit 25% against 68% overall.

## Product decisions

- **Decision quality and outcome quality are rated separately.** This is the core of the app. The 2×2 at the end of a review forces you to say whether a result was skill or luck, instead of letting the outcome rewrite how good the call was.
- **Belief is locked after review.** Once a decision is reviewed, its expected outcome and confidence can't be edited. A journal you can quietly revise is no longer an honest record.
- **Three required fields, everything else optional.** Capture has to take under 90 seconds or people won't do it. Category and stakes have sensible defaults; context and options sit behind a disclosure.
- **"Partly" counts as half.** Real outcomes are rarely binary, and forcing yes/no at review time pushes people to round in their own favour.
- **Review completion only counts decisions whose time has come.** Open decisions aren't overdue, so they shouldn't drag the number down.
- **Insights wait for 5 reviews.** Calibration from two data points is noise. A "needs more data" state is more honest than a confident-looking chart.
- **Destructive actions use undo, not confirm dialogs.** Delete, reset and clear all act immediately and offer Undo in a toast, which is faster and just as safe.
- **Seed dates are relative to today**, so the queue is never empty and the demo never goes stale.
- **HashRouter** keeps deep links working on GitHub Pages without 404 tricks.
