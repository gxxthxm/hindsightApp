import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import { buildSeed } from '@/data/seed'
import { snoozeDate } from '@/lib/status'
import type { Decision, Review } from '@/lib/types'
import { newId } from '@/lib/utils'

export type DecisionInput = Omit<Decision, 'id' | 'createdAt' | 'review' | 'snoozedUntil'>

interface DecisionsState {
  decisions: Decision[]
  addDecision: (input: DecisionInput) => Decision
  updateDecision: (id: string, patch: Partial<Omit<Decision, 'id'>>) => void
  /** Removes a decision and returns what's needed to undo it. */
  deleteDecision: (id: string) => { decision: Decision; index: number } | null
  restoreDecision: (decision: Decision, index: number) => void
  snooze: (id: string, days?: number) => void
  submitReview: (id: string, review: Omit<Review, 'reviewedAt'>) => void
  replaceAll: (decisions: Decision[]) => void
  resetDemo: () => void
  clearAll: () => void
}

export const useDecisions = create<DecisionsState>()(
  persist(
    (set, get) => ({
      // First run only: persisted state replaces this as soon as anything is stored.
      decisions: buildSeed(),

      addDecision: (input) => {
        const decision: Decision = { ...input, id: newId(), createdAt: new Date().toISOString() }
        set((s) => ({ decisions: [decision, ...s.decisions] }))
        return decision
      },

      updateDecision: (id, patch) =>
        set((s) => ({ decisions: s.decisions.map((d) => (d.id === id ? { ...d, ...patch } : d)) })),

      deleteDecision: (id) => {
        const index = get().decisions.findIndex((d) => d.id === id)
        if (index === -1) return null
        const decision = get().decisions[index]
        set((s) => ({ decisions: s.decisions.filter((d) => d.id !== id) }))
        return { decision, index }
      },

      restoreDecision: (decision, index) =>
        set((s) => {
          if (s.decisions.some((d) => d.id === decision.id)) return s
          const decisions = [...s.decisions]
          decisions.splice(Math.min(index, decisions.length), 0, decision)
          return { decisions }
        }),

      snooze: (id, days = 7) =>
        get().updateDecision(id, { snoozedUntil: snoozeDate(new Date(), days) }),

      submitReview: (id, review) =>
        get().updateDecision(id, { review: { ...review, reviewedAt: new Date().toISOString() } }),

      replaceAll: (decisions) => set({ decisions }),
      resetDemo: () => set({ decisions: buildSeed() }),
      clearAll: () => set({ decisions: [] }),
    }),
    {
      name: 'hindsight.v1',
      version: 1,
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ decisions: s.decisions }),
    },
  ),
)

export function useDecision(id: string | undefined): Decision | undefined {
  return useDecisions((s) => s.decisions.find((d) => d.id === id))
}
