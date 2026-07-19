/* Icons for workspace shell + create/episode flow screens */

interface IconProps {
  size?: number
  className?: string
}

export function PlusIcon({ size = 16, className = '' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" className={className}>
      <path d="M10 4v12M4 10h12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  )
}

export function BellIcon({ size = 20, className = '' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" className={className}>
      <path d="M10 3a4.5 4.5 0 00-4.5 4.5c0 3.2-1 4.3-1.6 5h12.2c-.6-.7-1.6-1.8-1.6-5A4.5 4.5 0 0010 3z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
      <path d="M8.3 15.5a1.8 1.8 0 003.4 0" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  )
}

export function GridIcon({ size = 18, className = '' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" className={className}>
      <rect x="3.5" y="3.5" width="13" height="13" rx="2" stroke="currentColor" strokeWidth="1.4" />
      <path d="M3.5 8.5h13M8.5 8.5v8" stroke="currentColor" strokeWidth="1.4" />
    </svg>
  )
}

export function FilmIcon({ size = 18, className = '' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" className={className}>
      <rect x="3.5" y="3.5" width="13" height="13" rx="2" stroke="currentColor" strokeWidth="1.4" />
      <path d="M8.3 7.2v5.6l4.6-2.8-4.6-2.8z" fill="currentColor" />
    </svg>
  )
}

export function FolderIcon({ size = 18, className = '' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" className={className}>
      <path d="M3.5 5.5A1.5 1.5 0 015 4h3l1.5 2H15a1.5 1.5 0 011.5 1.5v7A1.5 1.5 0 0115 16H5a1.5 1.5 0 01-1.5-1.5v-9z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
    </svg>
  )
}

export function UsageIcon({ size = 18, className = '' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" className={className}>
      <circle cx="10" cy="10" r="7" stroke="currentColor" strokeWidth="1.4" />
      <path d="M10 3v7l5 3.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function GearIcon({ size = 18, className = '' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" className={className}>
      <circle cx="10" cy="10" r="2.4" stroke="currentColor" strokeWidth="1.4" />
      <path d="M10 2.8l1 2.1 2.3-.5 1 1.7-1.6 1.7.7 2.2 2.1.9-.3 2-2.3.3-1 2.1-2-.3-.9-2.1-2.3.1-.9-1.8 1.7-1.6-.6-2.2-2-1 .5-2 2.3-.2.8-2.2 1.5.8z" stroke="currentColor" strokeWidth="1.1" strokeLinejoin="round" opacity="0.9" />
    </svg>
  )
}

export function SearchIcon({ size = 18, className = '' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" className={className}>
      <circle cx="9" cy="9" r="5.5" stroke="currentColor" strokeWidth="1.5" />
      <path d="M13.2 13.2L17 17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

export function UploadCloud({ size = 26, className = '' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M7 15.5A4 4 0 016.8 8a5.2 5.2 0 0110.2 1.2A3.6 3.6 0 0117 16.4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      <path d="M12 11v8M8.8 13.8L12 10.6l3.2 3.2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function InfoCircle({ size = 18, className = '' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" className={className}>
      <circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="1.4" />
      <path d="M10 9v4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="10" cy="6.3" r="1" fill="currentColor" />
    </svg>
  )
}

export function ClockIcon({ size = 18, className = '' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" className={className}>
      <circle cx="10" cy="10" r="7.2" stroke="currentColor" strokeWidth="1.4" />
      <path d="M10 6v4.2l2.8 1.6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function PhoneIcon({ size = 18, className = '' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" className={className}>
      <rect x="6" y="2.8" width="8" height="14.4" rx="1.8" stroke="currentColor" strokeWidth="1.4" />
      <path d="M8.8 15h2.4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  )
}

export function PeopleIcon({ size = 18, className = '' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" className={className}>
      <circle cx="7.5" cy="7" r="2.6" stroke="currentColor" strokeWidth="1.3" />
      <path d="M3 16c.6-2.6 2.3-4 4.5-4s3.9 1.4 4.5 4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      <path d="M13 4.8a2.6 2.6 0 010 4.6M14.6 12.3c1.4.5 2.3 1.8 2.7 3.7" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  )
}

export function LoopIcon({ size = 18, className = '' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" className={className}>
      <path d="M4 8.5a6 6 0 0110.5-2.6L16.5 8M16 11.5A6 6 0 015.5 14L3.5 12" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M16.5 4.5V8H13M3.5 15.5V12H7" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function WandIcon({ size = 18, className = '' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" className={className}>
      <path d="M4 16L13 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M14.5 3l.7 1.8 1.8.7-1.8.7-.7 1.8-.7-1.8-1.8-.7 1.8-.7.7-1.8z" fill="currentColor" />
      <path d="M16.8 10.5l.4 1 1 .4-1 .4-.4 1-.4-1-1-.4 1-.4.4-1z" fill="currentColor" />
    </svg>
  )
}

export function FramePlaceholder({ size = 22, className = 'text-ink-4' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M4 8V5.5A1.5 1.5 0 015.5 4H8M16 4h2.5A1.5 1.5 0 0120 5.5V8M20 16v2.5a1.5 1.5 0 01-1.5 1.5H16M8 20H5.5A1.5 1.5 0 014 18.5V16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}
