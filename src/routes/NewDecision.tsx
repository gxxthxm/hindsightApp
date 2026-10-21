import { format, parseISO } from 'date-fns'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { DecisionForm } from '@/components/DecisionForm'
import { Reveal, RevealWords, Stagger } from '@/components/motion'
import { Card } from '@/components/ui/card'
import { EASE } from '@/lib/motion'
import { useDecisions } from '@/store/decisions'
import { toast } from '@/store/toast'
import { usePageTitle } from './usePageTitle'

const TIPS = [
  {
    title: 'Make it checkable',
    body: '“Activation above 40% in launch week” beats “launch goes well”. Future you needs a yes or no.',
  },
  {
    title: 'Be honest about the number',
    body: 'If you feel 90% sure, say 90. The point is to find out whether your 90 means 90.',
  },
  {
    title: 'Note the mood',
    body: 'Rushed, anxious, excited. It’s the easiest pattern to miss and the most useful to find.',
  },
]

export function NewDecision() {
  usePageTitle('Log a decision')
  const navigate = useNavigate()
  const addDecision = useDecisions((s) => s.addDecision)

  return (
    <div className="grid gap-10 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.4fr)] lg:gap-16">
      <header className="lg:sticky lg:top-14 lg:self-start">
        <motion.p
          className="eyebrow"
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, ease: EASE }}
        >
          New entry · {format(new Date(), 'd MMMM yyyy')}
        </motion.p>
        <h1 className="mt-4 font-display text-[52px] leading-[0.95] tracking-[-0.02em] sm:text-[68px] [&_em]:text-accent-text">
          <RevealWords>{['Write down what you believe ', <em key="now">now.</em>]}</RevealWords>
        </h1>
        <motion.p
          className="mt-5 max-w-sm text-[17px] leading-relaxed text-muted"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.4 }}
        >
          Future you will check. Three fields are required; the rest makes the lesson sharper.
        </motion.p>

        <Stagger className="mt-10 hidden space-y-6 lg:block" stagger={0.12}>
          {TIPS.map((tip, i) => (
            <Reveal key={tip.title} className="flex gap-4">
              <span className="eyebrow tabular pt-1">{String(i + 1).padStart(2, '0')}</span>
              <div>
                <p className="font-display text-[22px] leading-tight">{tip.title}</p>
                <p className="mt-1 text-sm leading-relaxed text-muted">{tip.body}</p>
              </div>
            </Reveal>
          ))}
        </Stagger>
      </header>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: EASE, delay: 0.15 }}
      >
        <Card className="p-6 shadow-lift sm:p-9">
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
      </motion.div>
    </div>
  )
}
