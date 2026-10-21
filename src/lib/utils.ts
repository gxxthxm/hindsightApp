import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function percent(value: number | null, digits = 0): string {
  return value === null ? '–' : `${(value * 100).toFixed(digits)}%`
}

export function newId(): string {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `d-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
}

/** Stable pseudo-random number in [-0.5, 0.5) derived from a string, for chart jitter. */
export function jitterFor(seed: string, salt = 0): number {
  let h = 2166136261 ^ salt
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return ((h >>> 0) % 1000) / 1000 - 0.5
}
