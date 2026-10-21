import type { Variants } from 'framer-motion'

/** House easing: quick out, long settle. */
export const EASE = [0.16, 1, 0.3, 1] as const

export const SPRING = { type: 'spring', stiffness: 520, damping: 42 } as const
export const SOFT_SPRING = { type: 'spring', stiffness: 260, damping: 28 } as const

export const staggerContainer: Variants = {
  hidden: {},
  show: (stagger: number = 0.07) => ({
    transition: { staggerChildren: stagger, delayChildren: 0.04 },
  }),
}

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: EASE } },
}
