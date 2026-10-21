import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { useEffect, useMemo } from 'react'
import { NavLink, useLocation, useNavigate, useOutlet } from 'react-router-dom'
import { EASE, SPRING } from '@/lib/motion'
import { Toaster } from '@/components/ui/toaster'
import { dueQueue } from '@/lib/status'
import { cn } from '@/lib/utils'
import { useDecisions } from '@/store/decisions'
import { useUi } from '@/store/ui'
import { DemoBanner } from './DemoBanner'
import { Logo } from './Logo'
import { NAV_ITEMS, NEW_ITEM } from './nav'
import { SettingsMenu } from './SettingsMenu'

function useDueCount() {
  const decisions = useDecisions((s) => s.decisions)
  return useMemo(() => dueQueue(decisions).length, [decisions])
}

/** Press N anywhere (outside text fields and dialogs) to log a decision. */
function useNewDecisionShortcut() {
  const navigate = useNavigate()
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'n' && e.key !== 'N') return
      if (e.metaKey || e.ctrlKey || e.altKey || e.repeat) return
      const target = e.target as HTMLElement | null
      if (
        target?.closest(
          'input, textarea, select, [contenteditable="true"], [role="dialog"], [role="menu"]',
        )
      )
        return
      e.preventDefault()
      navigate('/new')
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [navigate])
}

function useThemeClass() {
  const theme = useUi((s) => s.theme)
  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute('content', theme === 'dark' ? '#0b0e13' : '#f6f3ec')
  }, [theme])
}

function DueBadge({ count, className }: { count: number; className?: string }) {
  if (count === 0) return null
  return (
    <span className={cn('relative inline-flex', className)}>
      <span
        aria-hidden
        className="absolute inset-0 rounded-full bg-accent animate-[ping-soft_2.4s_cubic-bezier(0,0,0.2,1)_infinite]"
      />
      <motion.span
        key={count}
        initial={{ scale: 0.6 }}
        animate={{ scale: 1 }}
        transition={SPRING}
        className="tabular relative inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-accent px-1.5 font-mono text-[11px] font-medium text-accent-ink"
      >
        {count}
        <span className="sr-only"> due for review</span>
      </motion.span>
    </span>
  )
}

function Sidebar({ dueCount }: { dueCount: number }) {
  return (
    <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 flex-col border-r border-line/80 bg-bg/60 px-5 py-7 backdrop-blur-sm md:flex">
      <div className="px-2">
        <Logo />
      </div>
      <p className="eyebrow mt-10 mb-3 px-3">Journal</p>
      <nav aria-label="Main" className="flex flex-col gap-1">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              cn(
                'relative flex h-11 items-center gap-3 rounded-xl px-3 text-[15px] transition-colors',
                isActive ? 'font-medium text-ink' : 'text-muted hover:text-ink',
              )
            }
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <motion.span
                    layoutId="sidebar-active"
                    aria-hidden
                    className="absolute inset-0 rounded-xl border border-line bg-surface shadow-card"
                    transition={SPRING}
                  />
                )}
                <item.icon
                  className={cn('relative size-[18px]', isActive && 'text-accent-text')}
                  aria-hidden
                />
                <span className="relative flex-1">{item.label}</span>
                {item.badge === 'due' && <DueBadge count={dueCount} />}
              </>
            )}
          </NavLink>
        ))}
      </nav>
      <NavLink
        to={NEW_ITEM.to}
        className="press group mt-6 flex h-12 items-center gap-2.5 rounded-xl bg-ink px-4 text-sm font-medium text-bg shadow-card hover:bg-ink/90"
      >
        <span className="flex size-6 items-center justify-center rounded-lg bg-bg/15 transition-transform duration-300 group-hover:rotate-90">
          <NEW_ITEM.icon className="size-4" aria-hidden />
        </span>
        <span className="flex-1">Log a decision</span>
        <kbd
          className="rounded-md border border-bg/25 px-1.5 font-mono text-[11px] opacity-70"
          aria-label="shortcut N"
        >
          N
        </kbd>
      </NavLink>

      <figure className="mt-auto rounded-2xl border border-line bg-surface/60 p-4">
        <blockquote className="font-display text-[19px] leading-snug text-ink italic">
          “Judge the call, not the dice.”
        </blockquote>
        <figcaption className="eyebrow mt-2">House rule</figcaption>
      </figure>
      <div className="mt-4 flex items-center justify-between px-1">
        <p className="eyebrow">v1 · local only</p>
        <SettingsMenu align="start" side="top" />
      </div>
    </aside>
  )
}

function MobileHeader() {
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-line/80 bg-bg/80 px-5 backdrop-blur-md md:hidden">
      <Logo />
      <SettingsMenu />
    </header>
  )
}

function MobileTabBar({ dueCount }: { dueCount: number }) {
  return (
    <nav
      aria-label="Main"
      className="fixed inset-x-3 bottom-3 z-40 rounded-2xl border border-line bg-surface/85 pb-[env(safe-area-inset-bottom)] shadow-lift backdrop-blur-xl md:hidden"
    >
      <ul className="grid grid-cols-4">
        {[...NAV_ITEMS, NEW_ITEM].map((item) => (
          <li key={item.to}>
            <NavLink
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                cn(
                  'relative flex h-16 flex-col items-center justify-center gap-1 text-[11px] font-medium transition-colors',
                  isActive ? 'text-accent-text' : 'text-muted',
                )
              }
            >
              {({ isActive }) => (
                <>
                  <span className="relative flex h-8 w-14 items-center justify-center">
                    {item === NEW_ITEM ? (
                      <span className="absolute inset-0 rounded-full bg-ink" aria-hidden />
                    ) : (
                      isActive && (
                        <motion.span
                          layoutId="tab-active"
                          aria-hidden
                          className="absolute inset-0 rounded-full bg-accent-soft"
                          transition={SPRING}
                        />
                      )
                    )}
                    <item.icon
                      className={cn('relative size-5', item === NEW_ITEM && 'text-bg')}
                      aria-hidden
                    />
                    {item.badge === 'due' && (
                      <DueBadge count={dueCount} className="absolute -top-1.5 -right-0.5" />
                    )}
                  </span>
                  {item.label}
                </>
              )}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}

export function AppShell() {
  const dueCount = useDueCount()
  const { pathname } = useLocation()
  // Freeze the outlet so the exiting page keeps rendering its own route.
  const outlet = useOutlet()
  const reduced = useReducedMotion()
  useNewDecisionShortcut()
  useThemeClass()

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])

  return (
    <div className="flex min-h-dvh">
      {/* HashRouter owns the URL hash, so the skip link focuses <main> directly. */}
      <a
        href="#main"
        onClick={(e) => {
          e.preventDefault()
          document.getElementById('main')?.focus()
        }}
        className="sr-only z-50 rounded-md bg-accent px-3 py-2 text-accent-ink focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
      >
        Skip to content
      </a>
      <Sidebar dueCount={dueCount} />
      <div className="flex min-w-0 flex-1 flex-col">
        <MobileHeader />
        <DemoBanner />
        <main
          id="main"
          tabIndex={-1}
          className="mx-auto w-full max-w-6xl flex-1 px-5 pt-8 pb-32 outline-none sm:px-10 sm:pt-14 md:pb-20 lg:px-14"
        >
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={pathname}
              initial={reduced ? false : { opacity: 0, y: 14, filter: 'blur(4px)' }}
              animate={{
                opacity: 1,
                y: 0,
                filter: 'blur(0px)',
                transitionEnd: { filter: 'none' },
              }}
              exit={{ opacity: 0, transition: { duration: 0.12 } }}
              transition={{ duration: 0.45, ease: EASE }}
            >
              {outlet}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
      <MobileTabBar dueCount={dueCount} />
      <Toaster />
    </div>
  )
}
