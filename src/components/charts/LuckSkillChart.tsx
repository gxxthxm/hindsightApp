import { useNavigate } from 'react-router-dom'
import {
  ReferenceArea,
  ReferenceLine,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { quadrantFor, type Quadrant } from '@/lib/stats'
import type { ReviewedDecision } from '@/lib/types'
import { jitterFor } from '@/lib/utils'

interface Point {
  id: string
  title: string
  x: number
  y: number
  decisionQuality: number
  outcomeQuality: number
  quadrant: Quadrant
}

const TICK = { fill: 'var(--muted)', fontSize: 12 }
const AREA_LABEL = { fill: 'var(--muted)', fontSize: 12, fontWeight: 500 }

/** Every reviewed decision by decision quality (x) × outcome quality (y), split at 3. */
export function LuckSkillChart({ decisions }: { decisions: ReviewedDecision[] }) {
  const navigate = useNavigate()
  const points: Point[] = decisions.map((d) => ({
    id: d.id,
    title: d.title,
    x: d.review.decisionQuality + jitterFor(d.id, 1) * 0.5,
    y: d.review.outcomeQuality + jitterFor(d.id, 2) * 0.5,
    decisionQuality: d.review.decisionQuality,
    outcomeQuality: d.review.outcomeQuality,
    quadrant: quadrantFor(d.review.decisionQuality, d.review.outcomeQuality),
  }))
  const count = (q: Quadrant) => points.filter((p) => p.quadrant === q).length
  const areas: {
    q: Quadrant
    x: [number, number]
    y: [number, number]
    position: 'insideTopLeft' | 'insideTopRight' | 'insideBottomLeft' | 'insideBottomRight'
  }[] = [
    { q: 'Earned it', x: [2.5, 5.5], y: [2.5, 5.5], position: 'insideTopRight' },
    { q: 'Dumb luck', x: [0.5, 2.5], y: [2.5, 5.5], position: 'insideTopLeft' },
    { q: 'Bad luck', x: [2.5, 5.5], y: [0.5, 2.5], position: 'insideBottomRight' },
    { q: 'Lesson', x: [0.5, 2.5], y: [0.5, 2.5], position: 'insideBottomLeft' },
  ]

  return (
    <figure>
      <div aria-hidden className="h-72 w-full sm:h-80">
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart
            accessibilityLayer={false}
            margin={{ top: 8, right: 12, bottom: 8, left: -8 }}
          >
            {areas.map((a) => (
              <ReferenceArea
                key={a.q}
                x1={a.x[0]}
                x2={a.x[1]}
                y1={a.y[0]}
                y2={a.y[1]}
                fill={a.q === 'Earned it' ? 'var(--accent)' : 'var(--line)'}
                fillOpacity={a.q === 'Earned it' ? 0.07 : 0.25}
                stroke="none"
                label={{
                  ...AREA_LABEL,
                  value: `${a.q} · ${count(a.q)}`,
                  position: a.position,
                  offset: 10,
                }}
              />
            ))}
            <ReferenceLine x={2.5} stroke="var(--line-strong)" />
            <ReferenceLine y={2.5} stroke="var(--line-strong)" />
            <XAxis
              type="number"
              dataKey="x"
              domain={[0.5, 5.5]}
              ticks={[1, 2, 3, 4, 5]}
              tick={TICK}
              tickLine={false}
              axisLine={{ stroke: 'var(--line-strong)' }}
              label={{
                value: 'Decision quality',
                position: 'insideBottom',
                offset: -4,
                fill: 'var(--muted)',
                fontSize: 12,
              }}
              height={44}
              allowDataOverflow
            />
            <YAxis
              type="number"
              dataKey="y"
              domain={[0.5, 5.5]}
              ticks={[1, 2, 3, 4, 5]}
              tick={TICK}
              tickLine={false}
              axisLine={false}
              width={40}
              label={{
                value: 'Outcome',
                angle: -90,
                position: 'insideLeft',
                offset: 18,
                fill: 'var(--muted)',
                fontSize: 12,
              }}
              allowDataOverflow
            />
            <Tooltip
              cursor={false}
              isAnimationActive={false}
              content={({ active, payload }) => {
                const p = payload?.[0]?.payload as Point | undefined
                if (!active || !p) return null
                return (
                  <div className="max-w-64 rounded-lg border border-line bg-surface px-3 py-2 text-sm shadow-card">
                    <p className="font-display leading-snug">{p.title}</p>
                    <p className="mt-1 text-muted">
                      {p.quadrant} · decision {p.decisionQuality}/5 · outcome {p.outcomeQuality}/5
                    </p>
                  </div>
                )
              }}
            />
            <Scatter
              data={points}
              fill="var(--chart-dot)"
              fillOpacity={0.85}
              stroke="var(--surface)"
              strokeWidth={1.5}
              isAnimationActive={false}
              cursor="pointer"
              onClick={(data) => {
                const id = (data as unknown as { payload?: Point }).payload?.id
                if (id) navigate(`/decisions/${id}`)
              }}
            />
          </ScatterChart>
        </ResponsiveContainer>
      </div>
      <figcaption className="sr-only">
        Luck versus skill:{' '}
        {(['Earned it', 'Bad luck', 'Dumb luck', 'Lesson'] as Quadrant[])
          .map((q) => `${q}: ${count(q)}`)
          .join(', ')}
        .
      </figcaption>
    </figure>
  )
}
