import { create } from 'zustand'

export interface ToastItem {
  id: number
  title: string
  description?: string
  action?: { label: string; onClick: () => void }
}

interface ToastState {
  toasts: ToastItem[]
  push: (toast: Omit<ToastItem, 'id'>) => void
  dismiss: (id: number) => void
}

let nextId = 1

export const useToasts = create<ToastState>()((set) => ({
  toasts: [],
  push: (toast) => set((s) => ({ toasts: [...s.toasts.slice(-2), { ...toast, id: nextId++ }] })),
  dismiss: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}))

export const toast = (t: Omit<ToastItem, 'id'>) => useToasts.getState().push(t)
