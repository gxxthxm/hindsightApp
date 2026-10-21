import { useEffect } from 'react'

export function usePageTitle(title?: string) {
  useEffect(() => {
    document.title = title ? `${title} · Hindsight` : 'Hindsight · Decision journal'
  }, [title])
}
