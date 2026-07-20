import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { ArrowLeft, Pause } from './icons'
import { getProductionDetail, pauseProduction, resumeProduction, type ProductionDetail } from '../data/api'
import { prettyStage } from '../data/pipeline'

interface TopBarProps {
  status?: string
  showElapsed?: boolean
  showPause?: boolean
}

function elapsedSince(iso?: string | null): string {
  if (!iso) return '—'
  const then = new Date(iso.replace(' ', 'T') + (iso.includes('Z') ? '' : 'Z')).getTime()
  if (Number.isNaN(then)) return '—'
  const secs = Math.max(0, Math.floor((Date.now() - then) / 1000))
  const m = Math.floor(secs / 60)
  const s = secs % 60
  return `${m}:${String(s).padStart(2, '0')} elapsed`
}

export function TopBar({ showElapsed = true, showPause = true }: TopBarProps) {
  const [searchParams] = useSearchParams()
  const productionId = searchParams.get('productionId')
  const [production, setProduction] = useState<ProductionDetail | null>(null)
  const [tick, setTick] = useState(0)
  const [pausing, setPausing] = useState(false)

  useEffect(() => {
    if (!productionId) return
    const load = () => getProductionDetail(productionId).then(setProduction).catch(console.error)
    load()
    const poll = setInterval(load, 10000)
    return () => clearInterval(poll)
  }, [productionId])

  // Re-render elapsed time every second while producing
  useEffect(() => {
    const t = setInterval(() => setTick((v) => v + 1), 1000)
    return () => clearInterval(t)
  }, [])
  void tick

  const isPaused = (production?.status || '').toLowerCase() === 'paused'
  const isDone = ['complete', 'failed', 'ready_for_review'].includes((production?.status || '').toLowerCase())

  const handlePauseResume = async () => {
    if (!productionId) return
    setPausing(true)
    try {
      if (isPaused) await resumeProduction(productionId)
      else await pauseProduction(productionId)
      setProduction(await getProductionDetail(productionId))
    } catch (e) {
      console.error(e)
    } finally {
      setPausing(false)
    }
  }

  return (
    <header className="flex h-[70px] shrink-0 items-center justify-between border-b border-line-soft bg-app px-6">
      {/* Brand logo container */}
      <div className="flex items-center gap-2">
        <Link to="/shows" className="text-[20px] font-semibold tracking-tight text-ink">
          Cre<span className="text-accent">8</span>Motion
        </Link>
        <span className="mx-4 h-4 w-px bg-line" />
        <Link
          to={production?.show_id ? `/show/${production.show_id}` : '/productions'}
          className="text-ink-3 transition-colors hover:text-ink"
          aria-label="Back"
        >
          <ArrowLeft size={16} />
        </Link>
        <nav className="flex items-center gap-2.5 text-[15px] pl-2">
          <span className="font-normal text-ink">{production?.show_title || 'Production'}</span>
          <span className="text-ink-5">/</span>
          <span className="font-normal text-ink">
            {production?.episode_number
              ? `Episode ${String(production.episode_number).padStart(2, '0')}`
              : '…'}
          </span>
        </nav>
      </div>

      {/* Center status area */}
      <div className="flex items-center gap-2">
        <span className={`h-2 w-2 rounded-full ${isPaused ? 'bg-warn' : 'bg-accent'}`} />
        <span className="text-[15px] font-normal text-ink">
          {isPaused ? 'Paused' : prettyStage(production?.current_stage) || 'Producing'}
        </span>
      </div>

      {/* Right control panel */}
      <div className="flex items-center gap-6">
        <span className="text-[15px]">
          <span className="text-ink-2">Budget </span>
          <span className="font-normal text-accent">
            {production ? `${production.budget_used}/${production.budget_limit}` : '…'}
          </span>
        </span>

        {showElapsed && (
          <span className="text-[15px] font-normal text-ink-2">
            {production?.completed_at ? 'Finished' : elapsedSince(production?.started_at)}
          </span>
        )}

        {showPause && !isDone && (
          <button
            onClick={handlePauseResume}
            disabled={pausing || !productionId}
            className="flex h-[36.5px] items-center gap-2 rounded-md border border-line px-[17px] text-[15px] font-normal text-ink transition-colors hover:bg-selected disabled:opacity-50"
          >
            <Pause size={12} />
            {pausing ? '…' : isPaused ? 'Resume' : 'Pause'}
          </button>
        )}
      </div>
    </header>
  )
}
