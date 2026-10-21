import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { usePageTitle } from './usePageTitle'

export function NotFound() {
  usePageTitle('Not found')
  return (
    <div className="mx-auto max-w-md py-16 text-center">
      <h1 className="font-display text-3xl font-medium">Nothing here</h1>
      <p className="mt-2 text-muted">This decision may have been deleted, or the link is wrong.</p>
      <Button asChild className="mt-6">
        <Link to="/decisions">All decisions</Link>
      </Button>
    </div>
  )
}
