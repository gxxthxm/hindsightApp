import type { ComponentProps } from 'react'
import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ChipProps extends ComponentProps<'button'> {
  selected?: boolean
}

/** Toggle chip. Selection is shown by colour *and* a check mark, and exposed via aria-pressed. */
export function Chip({ selected, className, children, ...props }: ChipProps) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      className={cn(
        'inline-flex h-8 items-center gap-1.5 rounded-full border px-3 text-sm whitespace-nowrap transition-colors',
        selected
          ? 'border-accent bg-accent-soft font-medium text-accent-text'
          : 'border-line bg-surface text-muted hover:border-line-strong hover:text-ink',
        className,
      )}
      {...props}
    >
      {selected && <Check className="size-3.5" aria-hidden />}
      {children}
    </button>
  )
}
