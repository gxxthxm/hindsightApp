import * as ToastPrimitive from '@radix-ui/react-toast'
import { X } from 'lucide-react'
import { useToasts } from '@/store/toast'

export function Toaster() {
  const toasts = useToasts((s) => s.toasts)
  const dismiss = useToasts((s) => s.dismiss)

  return (
    <ToastPrimitive.Provider swipeDirection="down" duration={6000}>
      {toasts.map((t) => (
        <ToastPrimitive.Root
          key={t.id}
          duration={t.action ? 10000 : 5000}
          onOpenChange={(open) => !open && dismiss(t.id)}
          className="pointer-events-auto flex items-start gap-3 rounded-xl border border-line-strong bg-ink p-3.5 pl-4 text-bg shadow-card data-[state=open]:animate-[toast-in_200ms_ease-out] data-[swipe=end]:animate-[fade-out_150ms_ease-in]"
        >
          <div className="min-w-0 flex-1">
            <ToastPrimitive.Title className="text-sm font-medium">{t.title}</ToastPrimitive.Title>
            {t.description && (
              <ToastPrimitive.Description className="mt-0.5 text-sm opacity-80">
                {t.description}
              </ToastPrimitive.Description>
            )}
          </div>
          {t.action && (
            <ToastPrimitive.Action
              altText={t.action.label}
              onClick={t.action.onClick}
              className="shrink-0 rounded-md bg-bg/15 px-2.5 py-1 text-sm font-semibold hover:bg-bg/25 focus-visible:outline-bg"
            >
              {t.action.label}
            </ToastPrimitive.Action>
          )}
          <ToastPrimitive.Close
            aria-label="Dismiss"
            className="shrink-0 rounded-md p-1 opacity-70 hover:opacity-100"
          >
            <X className="size-4" />
          </ToastPrimitive.Close>
        </ToastPrimitive.Root>
      ))}
      <ToastPrimitive.Viewport className="fixed inset-x-0 bottom-20 z-[60] mx-auto flex w-full max-w-md flex-col gap-2 px-4 outline-none md:right-6 md:bottom-6 md:left-auto md:mx-0 md:px-0" />
    </ToastPrimitive.Provider>
  )
}
