import { motion } from 'framer-motion'
import { Check } from 'lucide-react'
import type { ComponentProps } from 'react'
import { cn } from '@/lib/utils'

interface ChipProps extends ComponentProps<'button'> {
  selected?: boolean
  /** Share across a single-select group to slide the highlight between chips. */
  layoutId?: string
}

/** Toggle chip. Selection is shown by colour *and* a check mark, and exposed via aria-pressed. */
export function Chip({ selected, layoutId, className, children, ...props }: ChipProps) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      className={cn(
        'press relative inline-flex h-9 items-center gap-1.5 rounded-full border px-3.5 text-sm whitespace-nowrap',
        selected
          ? cn(
              'font-medium text-accent-text',
              layoutId ? 'border-transparent' : 'border-accent bg-accent-soft',
            )
          : 'border-line bg-surface text-muted hover:border-line-strong hover:text-ink',
        className,
      )}
      {...props}
    >
      {selected && layoutId && (
        <motion.span
          layoutId={layoutId}
          aria-hidden
          className="absolute inset-0 rounded-full border border-accent bg-accent-soft"
          transition={{ type: 'spring', stiffness: 500, damping: 38 }}
        />
      )}
      <span className="relative inline-flex items-center gap-1.5">
        {selected && <Check className="size-3.5" aria-hidden />}
        {children}
      </span>
    </button>
  )
}
