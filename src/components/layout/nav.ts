import { House, LineChart, ListChecks, Plus, type LucideIcon } from 'lucide-react'

export interface NavItem {
  to: string
  label: string
  icon: LucideIcon
  end?: boolean
  badge?: 'due'
}

export const NAV_ITEMS: NavItem[] = [
  { to: '/', label: 'Home', icon: House, end: true, badge: 'due' },
  { to: '/decisions', label: 'Decisions', icon: ListChecks },
  { to: '/insights', label: 'Insights', icon: LineChart },
]

export const NEW_ITEM: NavItem = { to: '/new', label: 'New', icon: Plus }
