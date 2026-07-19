interface IconProps {
  size?: number
  className?: string
}

export function CheckCircle({ size = 18, className = 'text-accent' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" className={className}>
      <circle cx="10" cy="10" r="8.5" stroke="currentColor" strokeWidth="1.5" />
      <path d="M6.5 10.2l2.3 2.3 4.7-4.8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function CheckCircleSolid({ size = 18, className = '' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" className={className}>
      <circle cx="10" cy="10" r="9" fill="var(--color-accent)" />
      <path d="M6.3 10.2l2.4 2.4 5-5" stroke="#000000" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function DotSolid({ size = 18, className = '' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" className={className}>
      <circle cx="10" cy="10" r="7" fill="var(--color-accent)" />
    </svg>
  )
}

export function CircleOutline({ size = 18, className = 'text-ink-3' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" className={className}>
      <circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  )
}

export function WarnTriangle({ size = 18, className = 'text-warn' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" className={className}>
      <path d="M10 3l7.5 13.5h-15L10 3z" fill="currentColor" />
      <path d="M10 8.2v3.6" stroke="#111" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="10" cy="14" r="0.9" fill="#111" />
    </svg>
  )
}

export function WarnCircle({ size = 18, className = 'text-warn' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" className={className}>
      <circle cx="10" cy="10" r="9" fill="currentColor" />
      <path d="M10 5.5v5.5" stroke="#111" strokeWidth="1.8" strokeLinecap="round" />
      <circle cx="10" cy="14.2" r="1" fill="#111" />
    </svg>
  )
}

export function Spinner({ size = 16, className = 'text-accent' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" className={`animate-spin ${className}`} style={{ animationDuration: '1.4s' }}>
      <circle cx="10" cy="10" r="7.5" stroke="currentColor" strokeWidth="2" strokeDasharray="10 6" strokeLinecap="round" opacity="0.9" />
    </svg>
  )
}

export function ArrowLeft({ size = 20, className = '' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" className={className}>
      <path d="M12.5 4.5L7 10l5.5 5.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function ChevronRight({ size = 16, className = '' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" className={className}>
      <path d="M7.5 4.5L13 10l-5.5 5.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function ChevronDown({ size = 16, className = '' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" className={className}>
      <path d="M4.5 7.5L10 13l5.5-5.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function Pause({ size = 16, className = '' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="currentColor" className={className}>
      <rect x="5" y="4" width="3.4" height="12" rx="1" />
      <rect x="11.6" y="4" width="3.4" height="12" rx="1" />
    </svg>
  )
}

export function Play({ size = 16, className = '' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="currentColor" className={className}>
      <path d="M6.5 4.2v11.6c0 .8.9 1.3 1.6.9l9-5.8c.6-.4.6-1.4 0-1.8l-9-5.8c-.7-.4-1.6.1-1.6.9z" transform="scale(0.85) translate(1.5 1.5)" />
    </svg>
  )
}

export function Ellipsis({ size = 18, className = '' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="currentColor" className={className}>
      <circle cx="4.5" cy="10" r="1.5" />
      <circle cx="10" cy="10" r="1.5" />
      <circle cx="15.5" cy="10" r="1.5" />
    </svg>
  )
}

export function DocIcon({ size = 18, className = '' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" className={className}>
      <rect x="4.5" y="3" width="11" height="14" rx="1.5" stroke="currentColor" strokeWidth="1.4" />
      <path d="M7.5 7h5M7.5 10h5M7.5 13h3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  )
}

export function MusicNote({ size = 16, className = '' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" className={className}>
      <path d="M7.5 15.5V5.2l7-1.4v10" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="5.7" cy="15.5" r="1.8" fill="currentColor" />
      <circle cx="12.7" cy="13.8" r="1.8" fill="currentColor" />
    </svg>
  )
}

export function LeafIcon({ size = 16, className = '' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" className={className}>
      <path d="M15.5 4.5C9 4.5 4.8 8.5 4.5 15.3c6.8-.3 10.7-4.4 11-10.8z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
      <path d="M5.5 14.5c2.5-3.5 5.5-6 8.5-8" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" />
    </svg>
  )
}

export function FaceIcon({ size = 16, className = '' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" className={className}>
      <circle cx="10" cy="10" r="7.5" stroke="currentColor" strokeWidth="1.3" />
      <circle cx="7.5" cy="8.5" r="0.9" fill="currentColor" />
      <circle cx="12.5" cy="8.5" r="0.9" fill="currentColor" />
      <path d="M7 12.3c.8 1 1.8 1.5 3 1.5s2.2-.5 3-1.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  )
}

export function BoltIcon({ size = 16, className = '' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="currentColor" className={className}>
      <path d="M11 2.5L4.5 11h4l-1 6.5L14.5 9h-4l.5-6.5z" />
    </svg>
  )
}

export function VolumeIcon({ size = 18, className = '' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" className={className}>
      <path d="M3.5 7.5v5h2.8L10.5 16V4L6.3 7.5H3.5z" fill="currentColor" />
      <path d="M13 7c1 .7 1.6 1.8 1.6 3S14 12.3 13 13" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  )
}

export function FullscreenIcon({ size = 16, className = '' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" className={className}>
      <path d="M3.5 7.5v-4h4M12.5 3.5h4v4M16.5 12.5v4h-4M7.5 16.5h-4v-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function CloseIcon({ size = 18, className = '' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" className={className}>
      <path d="M5 5l10 10M15 5L5 15" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  )
}

export function SlidersIcon({ size = 18, className = '' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" className={className}>
      <path d="M3.5 6h13M3.5 10h13M3.5 14h13" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      <circle cx="7.5" cy="6" r="1.8" fill="var(--color-surface)" stroke="currentColor" strokeWidth="1.4" />
      <circle cx="12.5" cy="10" r="1.8" fill="var(--color-surface)" stroke="currentColor" strokeWidth="1.4" />
      <circle cx="8.5" cy="14" r="1.8" fill="var(--color-surface)" stroke="currentColor" strokeWidth="1.4" />
    </svg>
  )
}

export function SparkleIcon({ size = 18, className = 'text-accent' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="currentColor" className={className}>
      <path d="M10 2l1.6 4.9L16.5 8.5l-4.9 1.6L10 15l-1.6-4.9L3.5 8.5l4.9-1.6L10 2z" transform="scale(0.7) translate(1 1)" />
      <path d="M15.5 12.5l.8 2.2 2.2.8-2.2.8-.8 2.2-.8-2.2-2.2-.8 2.2-.8.8-2.2z" />
    </svg>
  )
}

export function PersonIcon({ size = 18, className = '' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" className={className}>
      <circle cx="10" cy="6.5" r="3" stroke="currentColor" strokeWidth="1.4" />
      <path d="M4.5 16.5c.7-3 2.8-4.5 5.5-4.5s4.8 1.5 5.5 4.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  )
}

export function SunIcon({ size = 18, className = '' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" className={className}>
      <circle cx="10" cy="10" r="3.2" stroke="currentColor" strokeWidth="1.4" />
      <path d="M10 2.5v2M10 15.5v2M2.5 10h2M15.5 10h2M4.7 4.7l1.4 1.4M13.9 13.9l1.4 1.4M15.3 4.7l-1.4 1.4M6.1 13.9l-1.4 1.4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  )
}

export function WaveIcon({ size = 18, className = '' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" className={className}>
      <path d="M3 7c2.3 0 2.3 2 4.7 2S10 7 12.3 7s2.4 2 4.7 2M3 12c2.3 0 2.3 2 4.7 2s2.3-2 4.6-2 2.4 2 4.7 2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  )
}

export function HandIcon({ size = 18, className = '' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" className={className}>
      <path d="M7 10V4.8a1.2 1.2 0 012.4 0V9m0-4.6V3.6a1.2 1.2 0 012.4 0V9m0-4.2a1.2 1.2 0 012.4 0V10m0-3a1.2 1.2 0 012.4 0v5c0 3.3-2.2 5.5-5.4 5.5-2.6 0-4-1-5.2-3.2L4.5 11c-.6-1-.2-2 .7-2.3.7-.2 1.4.1 1.8.8z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
