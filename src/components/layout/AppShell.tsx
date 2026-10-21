import { useEffect, useMemo } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
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
      ?.setAttribute('content', theme === 'dark' ? '#0d1117' : '#faf8f3')
  }, [theme])
}

function DueBadge({ count, className }: { count: number; className?: string }) {
  if (count === 0) return null
  return (
    <span
      className={cn(
        'tabular inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-accent px-1.5 text-[11px] font-semibold text-accent-ink',
        className,
      )}
    >
      {count}
      <span className="sr-only"> due for review</span>
    </span>
  )
}

function Sidebar({ dueCount }: { dueCount: number }) {
  return (
    <aside className="sticky top-0 hidden h-dvh w-60 shrink-0 flex-col border-r border-line px-4 py-6 md:flex">
      <div className="px-2">
        <Logo />
      </div>
      <nav aria-label="Main" className="mt-8 flex flex-col gap-1">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              cn(
                'flex h-10 items-center gap-3 rounded-lg px-3 text-[15px] transition-colors',
                isActive
                  ? 'bg-surface font-medium text-ink shadow-card'
                  : 'text-muted hover:bg-surface-2 hover:text-ink',
              )
            }
          >
            <item.icon className="size-[18px]" aria-hidden />
            <span className="flex-1">{item.label}</span>
            {item.badge === 'due' && <DueBadge count={dueCount} />}
          </NavLink>
        ))}
      </nav>
      <NavLink
        to={NEW_ITEM.to}
        className="mt-6 flex h-10 items-center justify-center gap-2 rounded-lg bg-accent text-sm font-medium text-accent-ink shadow-sm transition-colors hover:bg-accent-hover"
      >
        <NEW_ITEM.icon className="size-4" aria-hidden />
        Log a decision
        <kbd
          className="ml-1 rounded border border-accent-ink/30 px-1.5 font-sans text-[11px] opacity-80"
          aria-label="shortcut N"
        >
          N
        </kbd>
      </NavLink>
      <div className="mt-auto flex items-center justify-between px-1">
        <p className="text-xs text-faint">Decision journal</p>
        <SettingsMenu align="start" side="top" />
      </div>
    </aside>
  )
}

function MobileHeader() {
  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-line bg-bg/90 px-4 backdrop-blur md:hidden">
      <Logo />
      <SettingsMenu />
    </header>
  )
}

function MobileTabBar({ dueCount }: { dueCount: number }) {
  const items = [...NAV_ITEMS, NEW_ITEM]
  return (
    <nav
      aria-label="Main"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-bg/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden"
    >
      <ul className="grid grid-cols-4">
        {items.map((item) => (
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
                  <span
                    className={cn(
                      'relative flex h-7 w-12 items-center justify-center rounded-full transition-colors',
                      item === NEW_ITEM
                        ? 'bg-accent text-accent-ink'
                        : isActive && 'bg-accent-soft',
                    )}
                  >
                    <item.icon className="size-5" aria-hidden />
                    {item.badge === 'due' && (
                      <DueBadge count={dueCount} className="absolute -top-1.5 -right-1" />
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
          className="mx-auto w-full max-w-5xl flex-1 px-4 pt-6 pb-28 outline-none sm:px-8 sm:pt-10 md:pb-16"
        >
          <Outlet />
        </main>
      </div>
      <MobileTabBar dueCount={dueCount} />
      <Toaster />
    </div>
  )
}
