import { confidenceLabel } from '@/lib/confidence'
import { cn } from '@/lib/utils'

export function ConfidenceTag({
  confidence,
  className,
  withLabel = true,
}: {
  confidence: number
  className?: string
  withLabel?: boolean
}) {
  return (
    <span className={cn('tabular text-sm text-muted', className)}>
      <span className="font-medium text-ink">{confidence}%</span>
      {withLabel && <span> · {confidenceLabel(confidence)}</span>}
    </span>
  )
}

export function Dot() {
  return (
    <span aria-hidden className="text-faint">
      ·
    </span>
  )
}
