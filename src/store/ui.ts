import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

export type Theme = 'light' | 'dark'

interface UiState {
  theme: Theme
  bannerDismissed: boolean
  setTheme: (theme: Theme) => void
  toggleTheme: () => void
  dismissBanner: () => void
  showBanner: () => void
}

const prefersDark = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches

export const useUi = create<UiState>()(
  persist(
    (set) => ({
      theme: prefersDark() ? 'dark' : 'light',
      bannerDismissed: false,
      setTheme: (theme) => set({ theme }),
      toggleTheme: () => set((s) => ({ theme: s.theme === 'dark' ? 'light' : 'dark' })),
      dismissBanner: () => set({ bannerDismissed: true }),
      showBanner: () => set({ bannerDismissed: false }),
    }),
    {
      name: 'hindsight.v1.ui',
      version: 1,
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ theme: s.theme, bannerDismissed: s.bannerDismissed }),
    },
  ),
)
