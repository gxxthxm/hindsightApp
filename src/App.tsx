import { MotionConfig } from 'framer-motion'
import { lazy, Suspense } from 'react'
import { HashRouter, Route, Routes } from 'react-router-dom'
import { AppShell } from '@/components/layout/AppShell'
import { Dashboard } from '@/routes/Dashboard'
import { DecisionDetail } from '@/routes/DecisionDetail'
import { DecisionList } from '@/routes/DecisionList'
import { NewDecision } from '@/routes/NewDecision'
import { NotFound } from '@/routes/NotFound'
import { ReviewFlow } from '@/routes/ReviewFlow'

// Recharts is the heaviest dependency; keep it out of the first load.
const Insights = lazy(() => import('@/routes/Insights').then((m) => ({ default: m.Insights })))

export function App() {
  return (
    <MotionConfig reducedMotion="user">
      <HashRouter>
        <Routes>
          <Route element={<AppShell />}>
            <Route index element={<Dashboard />} />
            <Route path="new" element={<NewDecision />} />
            <Route path="decisions" element={<DecisionList />} />
            <Route path="decisions/:id" element={<DecisionDetail />} />
            <Route path="decisions/:id/review" element={<ReviewFlow />} />
            <Route
              path="insights"
              element={
                <Suspense fallback={<p className="text-muted">Crunching your numbers…</p>}>
                  <Insights />
                </Suspense>
              }
            />
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </HashRouter>
    </MotionConfig>
  )
}
