import { Sparkles, X } from 'lucide-react'
import { useUi } from '@/store/ui'

export function DemoBanner() {
  const dismissed = useUi((s) => s.bannerDismissed)
  const dismiss = useUi((s) => s.dismissBanner)
  if (dismissed) return null
  return (
    <div
      role="region"
      aria-label="Demo notice"
      className="border-b border-accent/20 bg-accent-soft text-accent-text"
    >
      <div className="mx-auto flex max-w-5xl items-center gap-3 px-4 py-2 text-sm sm:px-8">
        <Sparkles className="size-4 shrink-0" aria-hidden />
        <p className="flex-1">
          You’re viewing sample data. Log your own decision or reset anytime.
        </p>
        <button
          type="button"
          onClick={dismiss}
          aria-label="Dismiss demo notice"
          className="-mr-1.5 rounded-md p-1.5 hover:bg-accent/10"
        >
          <X className="size-4" aria-hidden />
        </button>
      </div>
    </div>
  )
}
