import { animate, useReducedMotion } from 'framer-motion'
import { useEffect, useRef } from 'react'

interface CountUpProps {
  value: number
  decimals?: number
  suffix?: string
  duration?: number
}

/** Animates from 0 to `value` once mounted. Static under prefers-reduced-motion. */
export function CountUp({ value, decimals = 0, suffix = '', duration = 0.9 }: CountUpProps) {
  const ref = useRef<HTMLSpanElement>(null)
  const reduced = useReducedMotion()
  const final = `${value.toFixed(decimals)}${suffix}`

  useEffect(() => {
    const node = ref.current
    if (!node || reduced) return
    const controls = animate(0, value, {
      duration,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (v) => {
        node.textContent = `${v.toFixed(decimals)}${suffix}`
      },
    })
    return () => controls.stop()
  }, [value, decimals, suffix, duration, reduced])

  // Screen readers get the final number; the animated text is hidden from them.
  return (
    <>
      <span ref={ref} aria-hidden>
        {final}
      </span>
      <span className="sr-only">{final}</span>
    </>
  )
}
