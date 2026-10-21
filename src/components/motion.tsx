import { motion, useReducedMotion, type HTMLMotionProps } from 'framer-motion'
import type { ReactNode } from 'react'
import { EASE, fadeUp, staggerContainer } from '@/lib/motion'

type DivProps = HTMLMotionProps<'div'>

interface StaggerProps extends DivProps {
  stagger?: number
  /** Animate when scrolled into view instead of on mount. */
  inView?: boolean
}

/** Parent that reveals its <Reveal> children one after another. */
export function Stagger({ stagger = 0.07, inView = false, children, ...props }: StaggerProps) {
  const trigger = inView
    ? { whileInView: 'show', viewport: { once: true, margin: '0px 0px -10% 0px' } }
    : { animate: 'show' }
  return (
    <motion.div
      variants={staggerContainer}
      custom={stagger}
      initial="hidden"
      {...trigger}
      {...props}
    >
      {children}
    </motion.div>
  )
}

/** Child of <Stagger>: fades and rises into place. */
export function Reveal({ children, ...props }: DivProps) {
  return (
    <motion.div variants={fadeUp} {...props}>
      {children}
    </motion.div>
  )
}

/** Headline that reveals word by word. Screen readers get the plain text once. */
export function RevealWords({
  children,
  className,
  delay = 0,
}: {
  children: ReactNode[]
  className?: string
  delay?: number
}) {
  const reduced = useReducedMotion()
  let index = 0
  return (
    <span className={className}>
      {children.map((part, p) => {
        if (typeof part !== 'string') {
          const i = index++
          return (
            <motion.span
              key={p}
              className="inline-block"
              initial={reduced ? false : { opacity: 0, y: '0.35em', filter: 'blur(6px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)', transitionEnd: { filter: 'none' } }}
              transition={{ duration: 0.8, ease: EASE, delay: delay + i * 0.06 }}
            >
              {part}
            </motion.span>
          )
        }
        return part
          .split(/(\s+)/)
          .filter(Boolean)
          .map((word, w) => {
            if (/^\s+$/.test(word)) return word
            const i = index++
            return (
              <motion.span
                key={`${p}-${w}`}
                className="inline-block"
                initial={reduced ? false : { opacity: 0, y: '0.35em', filter: 'blur(6px)' }}
                animate={{
                  opacity: 1,
                  y: 0,
                  filter: 'blur(0px)',
                  transitionEnd: { filter: 'none' },
                }}
                transition={{ duration: 0.8, ease: EASE, delay: delay + i * 0.06 }}
              >
                {word}
              </motion.span>
            )
          })
      })}
    </span>
  )
}
