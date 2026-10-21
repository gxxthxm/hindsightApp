import { format, parseISO } from 'date-fns'
import { useNavigate } from 'react-router-dom'
import { DecisionForm } from '@/components/DecisionForm'
import { Card } from '@/components/ui/card'
import { useDecisions } from '@/store/decisions'
import { toast } from '@/store/toast'
import { usePageTitle } from './usePageTitle'

export function NewDecision() {
  usePageTitle('Log a decision')
  const navigate = useNavigate()
  const addDecision = useDecisions((s) => s.addDecision)

  return (
    <div className="mx-auto max-w-2xl">
      <header className="mb-6">
        <h1 className="font-display text-3xl font-medium sm:text-4xl">Log a decision</h1>
        <p className="mt-1.5 text-muted">
          Write down what you believe <em>now</em>. Future you will check.
        </p>
      </header>
      <Card className="p-5 sm:p-7">
        <DecisionForm
          autoFocus
          submitLabel="Save decision"
          onCancel={() => navigate(-1)}
          onSubmit={(input) => {
            const d = addDecision(input)
            toast({
              title: 'Decision logged',
              description: `We’ll ask how it went on ${format(parseISO(d.reviewAt), 'd MMMM')}.`,
            })
            navigate(`/decisions/${d.id}`)
          }}
        />
      </Card>
    </div>
  )
}
