import { useState, useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { WorkspaceShell } from '../components/WorkspaceShell'
import { CheckCircle, ChevronDown, DocIcon } from '../components/icons'
import { getProduction, getProductionShots } from '../data/api'
import { stageScreen as pipelineStageScreen } from '../data/pipeline'

export function PreflightScreen() {
  const [searchParams] = useSearchParams()
  const productionId = searchParams.get('productionId')

  const [production, setProduction] = useState<any>(null)
  const [shots, setShots] = useState<any[]>([])

  useEffect(() => {
    if (!productionId) return
    getProduction(productionId).then(setProduction).catch(console.error)
    getProductionShots(productionId).then(setShots).catch(console.error)
  }, [productionId])

  const episodeLabel = production?.episode_number
    ? `Episode ${String(production.episode_number).padStart(2, '0')} · ${production.episode_title || ''}`
    : '…'

  const totalDuration = shots.reduce((s, shot) => s + (shot.duration_seconds || 0), 0)

  // "Continue" destination: wherever the live stage currently is
  const continueTo = production?.current_stage
    ? `${pipelineStageScreen(production.current_stage)}?productionId=${encodeURIComponent(productionId!)}`
    : `/plan?productionId=${encodeURIComponent(productionId || '')}`

  const readiness = [
    { label: 'Duration', value: totalDuration ? `${totalDuration} seconds` : '…' },
    { label: 'Shots', value: shots.length ? String(shots.length) : '…' },
    { label: 'Episode', value: production?.episode_title || '…' },
    { label: 'Budget limit', value: production?.budget_limit ? `${production.budget_limit} units` : '…', accent: true },
  ]

  const readyChecks = [
    'Episode analyzed',
    shots.length > 0 ? `${shots.length} shots planned` : 'Shots planning…',
    'Budget allocated',
  ]

  return (
    <WorkspaceShell
      breadcrumb={
        <>
          <span>{production?.show_title || 'Show'}</span>
          <span className="px-2 text-ink-3">/</span>
          <span>{episodeLabel}</span>
        </>
      }
      backTo="/productions"
    >
      <div className="mx-auto max-w-[1280px] px-8 pb-8">
        <h1 className="text-[30px] font-semibold tracking-tight">Production plan ready</h1>
        <p className="pt-1.5 text-[15px] text-ink-2">
          {shots.length > 0
            ? `Cre8Motion has prepared a ${shots.length}-shot production plan.`
            : 'Loading production plan…'}
        </p>

        <div className="grid grid-cols-2 gap-x-14 pt-7">
          {/* Left column */}
          <div>
            <h2 className="pb-3 text-[16px] font-semibold">Readiness summary</h2>
            <div className="rounded-xl border border-line-soft bg-surface px-5 py-2">
              {readiness.map((r) => (
                <div key={r.label} className="flex items-center justify-between border-b border-line-soft py-2.5 last:border-b-0">
                  <span className={`text-[14.5px] ${r.accent ? 'font-medium text-accent' : 'text-ink-2'}`}>{r.label}</span>
                  <span className={`text-[14.5px] ${r.accent ? 'font-semibold text-accent' : ''}`}>{r.value}</span>
                </div>
              ))}
            </div>

            {shots.length > 0 && (
              <>
                <h2 className="pb-3 pt-7 text-[16px] font-semibold">Shot plan</h2>
                <div className="rounded-xl border border-line-soft bg-surface px-5 py-2">
                  {shots.map((s: any) => {
                    const num = `S${String(s.sequence_number).padStart(2, '0')}`
                    return (
                      <div key={s.id} className="flex items-center gap-4 border-b border-line-soft py-2.5 last:border-b-0">
                        <span className="w-7 text-[14.5px] font-semibold text-ink-2">{num}</span>
                        <span className="flex-1 text-[14.5px]">{s.story_function}</span>
                        <span className="text-[14px] text-ink-2">{s.duration_seconds ? `${s.duration_seconds}s` : ''}</span>
                      </div>
                    )
                  })}
                </div>
              </>
            )}
          </div>

          {/* Right column */}
          <div className="border-l border-line-soft pl-14">
            <h2 className="pb-4 text-[16px] font-semibold">Ready for production</h2>
            <ul className="flex flex-col gap-3.5">
              {readyChecks.map((c) => (
                <li key={c} className="flex items-center gap-3 text-[14.5px] text-ink-2">
                  <CheckCircle size={18} />
                  {c}
                </li>
              ))}
            </ul>

            <button className="mt-8 flex w-full items-center justify-between rounded-xl border border-line px-4 py-3.5 text-[15px] transition-colors hover:bg-raised">
              <span className="flex items-center gap-3">
                <DocIcon className="text-ink-2" />
                Review planning details
              </span>
              <ChevronDown className="text-ink-3" />
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 flex items-center justify-between border-t border-line-soft pt-5">
          <Link
            to={`/plan?productionId=${encodeURIComponent(productionId || '')}`}
            className="rounded-lg border border-line bg-raised px-5 py-2.5 text-[14.5px] font-medium transition-colors hover:bg-raised-2"
          >
            Back to plan
          </Link>
          <div className="text-right">
            <Link
              to={continueTo}
              className="inline-flex items-center gap-2.5 rounded-lg bg-ink px-6 py-3 text-[15px] font-medium text-app transition-colors hover:bg-ink-2"
            >
              Continue to {production?.current_stage ? production.current_stage.replace(/_/g, ' ').toLowerCase() : 'production'}
              <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
                <path d="M4 10h12M11 4.5L16.5 10 11 15.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </Link>
            <p className="pt-2.5 text-[13px] leading-snug text-ink-3">
              Production continues automatically unless<br />Cre8Motion needs a creative decision.
            </p>
          </div>
        </div>
      </div>
    </WorkspaceShell>
  )
}
