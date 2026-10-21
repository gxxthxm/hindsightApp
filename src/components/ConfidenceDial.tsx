import { AnimatePresence, motion } from 'framer-motion'
import { useState } from 'react'
import { Slider } from '@/components/ui/slider'
import { CONFIDENCE_MAX, CONFIDENCE_MIN, CONFIDENCE_STEP, confidenceLabel } from '@/lib/confidence'
import { EASE } from '@/lib/motion'
import { cn } from '@/lib/utils'

interface ConfidenceDialProps {
  value: number
  onChange: (value: number) => void
  labelId: string
  disabled?: boolean
}

/** Big rolling number + label that crossfades as the slider moves. */
export function ConfidenceDial({ value, onChange, labelId, disabled }: ConfidenceDialProps) {
  // Track direction so the number rolls up when increasing and down when decreasing.
  const [prev, setPrev] = useState(value)
  const [dir, setDir] = useState(1)
  if (value !== prev) {
    setDir(value > prev ? 1 : -1)
    setPrev(value)
  }
  const label = confidenceLabel(value)

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-2xl border border-line bg-surface-2/60 p-5 sm:p-6',
        disabled && 'opacity-70',
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <span id={labelId} className="text-sm font-medium">
          How sure are you?
        </span>
        <span className="relative h-7 overflow-hidden text-right" aria-hidden>
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.span
              key={label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25, ease: EASE }}
              className="block font-display text-[22px] leading-7 whitespace-nowrap text-accent-text italic"
            >
              {label}
            </motion.span>
          </AnimatePresence>
        </span>
      </div>

      <div
        className="tabular mt-1 flex h-[92px] items-start overflow-hidden font-display leading-none"
        aria-hidden
      >
        <AnimatePresence mode="popLayout" initial={false} custom={dir}>
          <motion.span
            key={value}
            custom={dir}
            variants={{
              enter: (d: number) => ({ y: d * 46, opacity: 0, filter: 'blur(4px)' }),
              center: { y: 0, opacity: 1, filter: 'blur(0px)' },
              exit: (d: number) => ({ y: d * -46, opacity: 0, filter: 'blur(4px)' }),
            }}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.3, ease: EASE }}
            className="block text-[96px]"
          >
            {value}
          </motion.span>
        </AnimatePresence>
        <span className="mt-3 ml-1 text-[46px] text-faint">%</span>
      </div>

      <Slider
        className="mt-3"
        min={CONFIDENCE_MIN}
        max={CONFIDENCE_MAX}
        step={CONFIDENCE_STEP}
        value={[value]}
        onValueChange={([v]) => onChange(v)}
        thumbLabel="Confidence"
        valueText={`${value}%, ${label}`}
        aria-labelledby={labelId}
        disabled={disabled}
      />
      <div className="mt-2 flex justify-between font-mono text-[10px] text-faint" aria-hidden>
        {[50, 60, 70, 80, 90, 100].map((t) => (
          <span key={t} className={cn('tabular', t <= value && 'text-accent-text')}>
            {t}
          </span>
        ))}
      </div>
    </div>
  )
}
