import { CircleCheck, CircleDashed, Hourglass } from 'lucide-react'
import { STATUS_LABEL } from '@/lib/status'
import type { Status } from '@/lib/types'
import { cn } from '@/lib/utils'

const STYLES: Record<Status, string> = {
  open: 'border-line bg-surface-2 text-muted',
  due: 'border-accent/40 bg-accent-soft text-accent-text',
  reviewed: 'border-good/30 bg-good-soft text-good',
}

const ICONS = { open: CircleDashed, due: Hourglass, reviewed: CircleCheck } as const

/** Status pill: icon + text so colour is never the only signal. */
export function StatusPill({ status, className }: { status: Status; className?: string }) {
  const Icon = ICONS[status]
  return (
    <span
      className={cn(
        'inline-flex h-6 shrink-0 items-center gap-1 rounded-full border px-2 text-xs font-medium',
        STYLES[status],
        className,
      )}
    >
      <Icon className="size-3.5" aria-hidden />
      {STATUS_LABEL[status]}
    </span>
  )
}
