import { Link } from 'react-router-dom'

export function Logo() {
  return (
    <Link
      to="/"
      className="inline-flex items-center gap-2.5 rounded-md"
      aria-label="Hindsight home"
    >
      <svg viewBox="0 0 32 32" className="size-8" aria-hidden>
        <rect width="32" height="32" rx="8" fill="var(--accent)" />
        <path
          d="M9 22.5 15 9.5h2l6 13"
          fill="none"
          stroke="var(--accent-ink)"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="16" cy="19" r="2" fill="var(--accent-ink)" />
      </svg>
      <span className="font-display text-xl font-medium tracking-tight">Hindsight</span>
    </Link>
  )
}
