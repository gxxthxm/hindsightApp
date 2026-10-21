import { Link } from 'react-router-dom'

export function Logo() {
  return (
    <Link
      to="/"
      className="group inline-flex items-center gap-2.5 rounded-md"
      aria-label="Hindsight home"
    >
      <svg
        viewBox="0 0 32 32"
        className="size-8 transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:-rotate-12"
        aria-hidden
      >
        <rect width="32" height="32" rx="9" fill="var(--ink)" />
        <path
          d="M9 22.5 15 9.5h2l6 13"
          fill="none"
          stroke="var(--bg)"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="16" cy="19" r="2.2" fill="var(--accent-bright)" />
      </svg>
      <span className="font-display text-[26px] leading-none">
        Hind<span className="text-accent-text italic">sight</span>
      </span>
    </Link>
  )
}
