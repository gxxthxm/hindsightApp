import { animate, useInView, useReducedMotion } from 'framer-motion'
import { useEffect, useRef } from 'react'
import { EASE } from '@/lib/motion'

interface CountUpProps {
  value: number
  decimals?: number
  suffix?: string
  duration?: number
}

/** Counts from 0 to `value` when scrolled into view. Static under prefers-reduced-motion. */
export function CountUp({ value, decimals = 0, suffix = '', duration = 1.2 }: CountUpProps) {
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true })
  const reduced = useReducedMotion()
  const final = `${value.toFixed(decimals)}${suffix}`

  useEffect(() => {
    const node = ref.current
    if (!node || reduced || !inView) return
    const controls = animate(0, value, {
      duration,
      ease: EASE,
      onUpdate: (v) => {
        node.textContent = `${v.toFixed(decimals)}${suffix}`
      },
    })
    return () => controls.stop()
  }, [value, decimals, suffix, duration, reduced, inView])

  // Screen readers get the final number; the animated text is hidden from them.
  return (
    <>
      <span ref={ref} aria-hidden>
        {reduced ? final : `${(0).toFixed(decimals)}${suffix}`}
      </span>
      <span className="sr-only">{final}</span>
    </>
  )
}
