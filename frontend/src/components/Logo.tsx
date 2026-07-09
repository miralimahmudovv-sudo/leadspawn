import { useId } from 'react'

export function LogoMark({ className }: { className?: string }) {
  const gradientId = useId()

  return (
    <svg viewBox="0 0 48 48" className={className} role="img" aria-label="LeadSpawn">
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#6d5ae8" />
          <stop offset="1" stopColor="#d946ef" />
        </linearGradient>
      </defs>
      <rect width="48" height="48" rx="12" fill={`url(#${gradientId})`} />
      <path d="M27.5 7 13 28.5h8.6L18.4 41 33 19.5h-8.6L27.5 7z" fill="#fff" />
      <circle cx="36.5" cy="12" r="2.6" fill="#fff" opacity="0.9" />
      <circle cx="41" cy="18.5" r="1.8" fill="#fff" opacity="0.55" />
      <circle cx="38.5" cy="25" r="1.3" fill="#fff" opacity="0.35" />
    </svg>
  )
}
