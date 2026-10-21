import { format } from 'date-fns'
import { Download, Moon, RotateCcw, Settings, Sun, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useDecisions } from '@/store/decisions'
import { toast } from '@/store/toast'
import { useUi } from '@/store/ui'

function exportJson() {
  const { decisions } = useDecisions.getState()
  const blob = new Blob([JSON.stringify(decisions, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `hindsight-${format(new Date(), 'yyyy-MM-dd')}.json`
  a.click()
  URL.revokeObjectURL(url)
  toast({ title: `Exported ${decisions.length} decisions` })
}

/** Snapshot the current decisions, run a destructive change, and offer an undo toast. */
function withUndo(title: string, change: () => void) {
  const previous = useDecisions.getState().decisions
  change()
  toast({
    title,
    action: { label: 'Undo', onClick: () => useDecisions.getState().replaceAll(previous) },
  })
}

export function SettingsMenu({
  align = 'end',
  side,
}: {
  align?: 'start' | 'end'
  side?: 'top' | 'bottom'
}) {
  const theme = useUi((s) => s.theme)
  const toggleTheme = useUi((s) => s.toggleTheme)
  const showBanner = useUi((s) => s.showBanner)
  const dismissBanner = useUi((s) => s.dismissBanner)

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Settings">
          <Settings aria-hidden />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align={align} side={side}>
        <DropdownMenuLabel>Appearance</DropdownMenuLabel>
        <DropdownMenuItem onSelect={toggleTheme}>
          {theme === 'dark' ? <Sun aria-hidden /> : <Moon aria-hidden />}
          {theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuLabel>Data</DropdownMenuLabel>
        <DropdownMenuItem onSelect={exportJson}>
          <Download aria-hidden />
          Export JSON
        </DropdownMenuItem>
        <DropdownMenuItem
          onSelect={() => {
            withUndo('Demo data restored', () => useDecisions.getState().resetDemo())
            showBanner()
          }}
        >
          <RotateCcw aria-hidden />
          Reset demo data
        </DropdownMenuItem>
        <DropdownMenuItem
          destructive
          onSelect={() => {
            withUndo('All decisions cleared', () => useDecisions.getState().clearAll())
            dismissBanner()
          }}
        >
          <Trash2 aria-hidden />
          Clear all data
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
