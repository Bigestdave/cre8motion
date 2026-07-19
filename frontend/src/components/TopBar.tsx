import { Link, useSearchParams } from 'react-router-dom'
import { ArrowLeft, Pause } from './icons'

interface TopBarProps {
  status?: string
  showElapsed?: boolean
  showPause?: boolean
}

export function TopBar({ status = 'Producing', showElapsed = true, showPause = true }: TopBarProps) {
  const [searchParams] = useSearchParams()
  const showId = searchParams.get('showId') || 'fruitful-secrets'

  return (
    <header className="flex h-[70px] shrink-0 items-center justify-between border-b border-line-soft bg-app px-6">
      {/* Brand logo container */}
      <div className="flex items-center gap-2">
        <Link to="/shows" className="text-[20px] font-semibold tracking-tight text-ink">
          Cre<span className="text-accent">8</span>Motion
        </Link>
        <span className="mx-4 h-4 w-px bg-line" />
        <Link to={`/show/${showId}`} className="text-ink-3 transition-colors hover:text-ink" aria-label="Back">
          <ArrowLeft size={16} />
        </Link>
        <nav className="flex items-center gap-2.5 text-[15px] pl-2">
          <span className="font-normal text-ink">Fruitful Secrets</span>
          <span className="text-ink-5">/</span>
          <span className="font-normal text-ink">Episode 04</span>
        </nav>
      </div>

      {/* Center status area */}
      <div className="flex items-center gap-2">
        <span className="h-2 w-2 rounded-full bg-accent" />
        <span className="text-[15px] font-normal text-ink">{status}</span>
        <span className="pl-4 text-[15px] font-normal text-ink-4">Saved just now</span>
      </div>

      {/* Right control panel */}
      <div className="flex items-center gap-6">
        <span className="text-[15px]">
          <span className="text-ink-2">Budget </span>
          <span className="font-normal text-accent">64/100</span>
        </span>

        {showElapsed && <span className="text-[15px] font-normal text-ink-2">18:42 elapsed</span>}

        {showPause && (
          <button className="flex h-[36.5px] items-center gap-2 rounded-md border border-line px-[17px] text-[15px] font-normal text-ink transition-colors hover:bg-selected">
            <Pause size={12} />
            Pause
          </button>
        )}

        <button className="flex h-7 items-center justify-center text-ink-3 hover:text-ink" aria-label="More">
          <span className="text-[20px] tracking-widest">···</span>
        </button>
      </div>
    </header>
  )
}

