import {
  ReferenceLine,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
  ZAxis,
} from 'recharts'
import type { CalibrationBucket } from '@/lib/stats'

const AXIS_TICK = { fill: 'var(--faint)', fontSize: 11, fontFamily: 'var(--font-mono)' }

interface Point {
  x: number
  y: number
  count: number
  label: string
  avgConfidence: number
}

/** Confidence bucket (x) vs actual hit rate (y), against a dashed perfect-calibration diagonal. */
export function CalibrationChart({ buckets }: { buckets: CalibrationBucket[] }) {
  const points: Point[] = buckets
    .filter((b) => b.count > 0 && b.hitRate !== null)
    .map((b) => ({
      x: b.midpoint,
      y: b.hitRate ?? 0,
      count: b.count,
      label: b.label,
      avgConfidence: Math.round(b.avgConfidence ?? b.midpoint),
    }))
  const maxCount = Math.max(1, ...points.map((p) => p.count))

  return (
    <figure>
      <div aria-hidden className="h-72 w-full sm:h-80">
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart
            accessibilityLayer={false}
            margin={{ top: 16, right: 16, bottom: 8, left: -8 }}
          >
            <XAxis
              type="number"
              dataKey="x"
              domain={[50, 100]}
              ticks={[50, 60, 70, 80, 90, 100]}
              tickFormatter={(v: number) => `${v}%`}
              tick={AXIS_TICK}
              tickLine={false}
              axisLine={{ stroke: 'var(--line-strong)' }}
              label={{
                value: 'How sure you were',
                position: 'insideBottom',
                offset: -4,
                fill: 'var(--muted)',
                fontSize: 12,
              }}
              height={44}
            />
            <YAxis
              type="number"
              dataKey="y"
              domain={[0, 100]}
              ticks={[0, 25, 50, 75, 100]}
              tickFormatter={(v: number) => `${v}%`}
              tick={AXIS_TICK}
              tickLine={false}
              axisLine={false}
              width={48}
            />
            <ZAxis type="number" dataKey="count" domain={[1, maxCount]} range={[90, 520]} />
            <ReferenceLine
              segment={[
                { x: 50, y: 50 },
                { x: 100, y: 100 },
              ]}
              stroke="var(--faint)"
              strokeDasharray="5 5"
              strokeWidth={1.5}
              label={{
                value: 'Perfect calibration',
                position: 'insideTopLeft',
                fill: 'var(--faint)',
                fontSize: 11,
                dy: -18,
                dx: 24,
              }}
            />
            {/* The gap between belief and reality, per bucket. */}
            {points.map((p) => (
              <ReferenceLine
                key={p.label}
                segment={[
                  { x: p.x, y: p.y },
                  { x: p.x, y: p.x },
                ]}
                stroke="var(--accent)"
                strokeOpacity={0.3}
                strokeWidth={2}
                strokeDasharray="2 3"
              />
            ))}
            <Tooltip
              cursor={false}
              isAnimationActive={false}
              content={({ active, payload }) => {
                const p = payload?.[0]?.payload as Point | undefined
                if (!active || !p) return null
                return (
                  <div className="rounded-xl border border-line bg-surface px-3.5 py-2.5 text-sm shadow-lift">
                    <p className="font-medium">{p.label} confidence</p>
                    <p className="text-muted">
                      {p.count} decision{p.count === 1 ? '' : 's'} · came true {p.y}%
                    </p>
                  </div>
                )
              }}
            />
            <Scatter
              data={points}
              fill="var(--chart-dot)"
              fillOpacity={0.9}
              stroke="var(--surface)"
              strokeWidth={2}
              animationBegin={300}
              animationDuration={900}
              animationEasing="ease-out"
            />
          </ScatterChart>
        </ResponsiveContainer>
      </div>
      <figcaption className="sr-only">
        Calibration by confidence bucket:{' '}
        {points.length === 0
          ? 'no reviewed decisions yet.'
          : points
              .map(
                (p) =>
                  `${p.label}: ${p.count} decision${p.count === 1 ? '' : 's'}, came true ${p.y}% of the time`,
              )
              .join('; ')}
        .
      </figcaption>
    </figure>
  )
}
