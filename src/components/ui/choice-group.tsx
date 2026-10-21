import * as RadioGroup from '@radix-ui/react-radio-group'
import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

export interface Choice<V extends string> {
  value: V
  label: ReactNode
  hint?: ReactNode
}

interface ChoiceGroupProps<V extends string> {
  value: V | undefined
  onChange: (value: V) => void
  choices: Choice<V>[]
  ariaLabelledBy?: string
  ariaLabel?: string
  ariaDescribedBy?: string
  invalid?: boolean
  className?: string
  itemClassName?: string
}

/** Segmented radio group: arrow keys move between options, selection shows by fill *and* a dot. */
export function ChoiceGroup<V extends string>({
  value,
  onChange,
  choices,
  ariaLabelledBy,
  ariaLabel,
  ariaDescribedBy,
  invalid,
  className,
  itemClassName,
}: ChoiceGroupProps<V>) {
  return (
    <RadioGroup.Root
      value={value ?? ''}
      onValueChange={(v) => onChange(v as V)}
      aria-labelledby={ariaLabelledBy}
      aria-label={ariaLabel}
      aria-describedby={ariaDescribedBy}
      aria-invalid={invalid || undefined}
      className={cn('grid gap-2', className)}
    >
      {choices.map((c) => (
        <RadioGroup.Item
          key={c.value}
          value={c.value}
          className={cn(
            'press group flex min-h-11 flex-col items-center justify-center rounded-2xl border px-2 py-2.5 text-center transition-all duration-200',
            'border-line bg-surface text-ink hover:border-line-strong',
            'data-[state=checked]:border-accent data-[state=checked]:bg-accent-soft data-[state=checked]:text-accent-text data-[state=checked]:shadow-[0_0_0_3px_var(--accent-soft)]',
            invalid && 'border-danger/60',
            itemClassName,
          )}
        >
          <span className="flex items-center gap-1.5 text-sm font-medium">
            <span
              aria-hidden
              className="size-2 rounded-full border border-current opacity-50 group-data-[state=checked]:bg-current group-data-[state=checked]:opacity-100"
            />
            {c.label}
          </span>
          {c.hint && (
            <span className="mt-0.5 text-xs text-muted group-data-[state=checked]:text-accent-text/80">
              {c.hint}
            </span>
          )}
        </RadioGroup.Item>
      ))}
    </RadioGroup.Root>
  )
}
