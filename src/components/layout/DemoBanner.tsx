import { AnimatePresence, motion } from 'framer-motion'
import { Sparkles, X } from 'lucide-react'
import { EASE } from '@/lib/motion'
import { useUi } from '@/store/ui'

export function DemoBanner() {
  const dismissed = useUi((s) => s.bannerDismissed)
  const dismiss = useUi((s) => s.dismissBanner)
  return (
    <AnimatePresence initial={false}>
      {!dismissed && (
        <motion.div
          role="region"
          aria-label="Demo notice"
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.4, ease: EASE }}
          className="overflow-hidden border-b border-accent/15 bg-accent-soft/70 text-accent-text"
        >
          <div className="mx-auto flex max-w-6xl items-center gap-3 px-5 py-2.5 text-sm sm:px-10 lg:px-14">
            <Sparkles className="size-4 shrink-0" aria-hidden />
            <p className="flex-1">
              You’re viewing sample data. Log your own decision or reset anytime.
            </p>
            <button
              type="button"
              onClick={dismiss}
              aria-label="Dismiss demo notice"
              className="press -mr-1.5 rounded-lg p-1.5 hover:bg-accent/10"
            >
              <X className="size-4" aria-hidden />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
