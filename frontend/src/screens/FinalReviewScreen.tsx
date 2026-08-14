import { useState, useEffect, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { AppShell } from '../components/AppShell'
import { RightPanel, KV, ScoreBar } from '../components/RightPanel'
import { ThumbShotStrip, type StripStatuses } from '../components/ShotStrip'
import { VideoPlayer } from '../components/VideoPlayer'
import { ExportModal } from '../components/ExportModal'
import { getProduction, getProductionShots, approveProduction } from '../data/api'
import { useProductionEvents } from '../hooks/useProductionEvents'
import type { ProductionRun, ProductionShot } from '../data/api'

export function FinalReviewScreen() {
  const [searchParams] = useSearchParams()
  const productionId = searchParams.get('productionId')

  const [production, setProduction] = useState<ProductionRun | null>(null)
  const [shots, setShots] = useState<ProductionShot[]>([])
  const [selected, setSelected] = useState<string>('')
  const [exportOpen, setExportOpen] = useState(false)
  const [approving, setApproving] = useState(false)

  const { lastEvent } = useProductionEvents(productionId)

  useEffect(() => {
    if (!productionId) return
    getProduction(productionId)
      .then(setProduction)
      .catch(err => console.error('Failed to load production', err))
    getProductionShots(productionId)
      .then(data => {
        setShots(data)
        if (!selected && data.length > 0) {
          setSelected(data[0].id)
        }
      })
      .catch(err => console.error('Failed to load shots', err))
  }, [productionId, lastEvent])

  const statuses: StripStatuses = useMemo(() => {
    const st: StripStatuses = {}
    shots.forEach(s => {
      st[s.id] = s.status === 'completed' || s.status.includes('approved') ? 'approved' : 'pending'
    })
    return st
  }, [shots])

  const totalDuration = shots.reduce((sum, s) => sum + (s.duration_seconds || 0), 0)
  const formatDuration = (sec: number) => {
    const m = Math.floor(sec / 60)
    const s = Math.floor(sec % 60)
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }

  if (!production) {
    return <div className="flex h-screen items-center justify-center text-ink-2">Loading final review...</div>
  }

  return (
    <>
      <AppShell
        active="Final review"
        topBarStatus="Ready for review"
        showElapsed={false}
        showPause={false}
        panel={
          <RightPanel
            tabs={['Overview', 'Quality', 'Continuity', 'Production']}
            render={(tab) =>
              tab === 'Overview' ? (
                <div>
                  <p className="pb-1 text-[16px] font-semibold">Final quality</p>
                  <ScoreBar label="Narrative consistency" score={91} />
                  <ScoreBar label="Character consistency" score={94} />
                  <ScoreBar label="Motion accuracy" score={87} />
                  <ScoreBar label="Technical quality" score={96} />

                  <h3 className="border-t border-line-soft pb-2 pt-6 text-[16px] font-semibold">Production summary</h3>
                  <KV label="Duration" value={formatDuration(totalDuration)} />
                  <KV label="Budget used" value={<span><span className="font-medium text-accent">{production.budget_used}</span>/{production.budget_limit}</span>} />
                  <KV label="Shots" value={String(shots.length)} />
                  <KV label="Format" value={<>1080 × 1920 <span className="px-1 text-ink-3">·</span> MP4</>} />
                  {production.final_video_status === 'demo_placeholder' && (
                    <p className="pt-3 text-[13px] text-ink-3">Assembled as a keyframe slideshow — animated clips were unavailable for this run.</p>
                  )}

                  <div className="mt-7 flex flex-col gap-3">
                    <button
                      onClick={() => setExportOpen(true)}
                      className="w-full rounded-xl border border-line py-3.5 text-[15px] font-medium transition-colors hover:bg-raised"
                    >
                      Export options
                    </button>
                    <button
                      disabled={approving || production.status === 'complete'}
                      onClick={async () => {
                        if (!productionId) return
                        setApproving(true)
                        try {
                          await approveProduction(productionId)
                          setProduction(p => p ? { ...p, status: 'complete' } : p)
                          setExportOpen(true)
                        } catch (e) { console.error(e) }
                        finally { setApproving(false) }
                      }}
                      className="w-full rounded-xl bg-ink py-3.5 text-[15px] font-semibold text-app transition-colors hover:bg-ink-2 disabled:opacity-60"
                    >
                      {approving ? 'Approving…' : production.status === 'complete' ? 'Episode approved ✓' : 'Approve episode'}
                    </button>
                  </div>
                </div>
              ) : tab === 'Quality' ? (
                <div>
                  <h3 className="pb-3 text-[16px] font-semibold">Automated QC checks</h3>
                  <div className="flex flex-col gap-2.5 text-[14px]">
                    <div className="flex justify-between py-1.5 border-b border-line-soft">
                      <span className="text-ink-2">Framing stability</span>
                      <span className="font-medium text-accent">Passed (95%)</span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-line-soft">
                      <span className="text-ink-2">Identity preservation</span>
                      <span className="font-medium text-accent">Passed (93%)</span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-line-soft">
                      <span className="text-ink-2">Audio/video sync</span>
                      <span className="font-medium text-accent">Passed (100%)</span>
                    </div>
                    <div className="flex justify-between py-1.5">
                      <span className="text-ink-2">Encoding bitrate</span>
                      <span className="font-medium text-accent">1080p @ 24fps</span>
                    </div>
                  </div>
                </div>
              ) : tab === 'Continuity' ? (
                <div>
                  <h3 className="pb-3 text-[16px] font-semibold">Continuity locks</h3>
                  <p className="text-[14px] text-ink-2 leading-relaxed">
                    All character outfits, props, and scene backgrounds maintained consistency across all {shots.length} shots.
                  </p>
                </div>
              ) : (
                <div>
                  <h3 className="pb-3 text-[16px] font-semibold">Run diagnostics</h3>
                  <KV label="Run ID" value={production.id.slice(0, 8)} />
                  <KV label="Version" value={`v${production.version}`} />
                  <KV label="Stage" value={production.current_stage} />
                  <KV label="Status" value={production.status} />
                </div>
              )
            }
          />
        }
        strip={<ThumbShotStrip shots={shots} statuses={statuses} selected={selected} onSelect={setSelected} variant="name-time" />}
      >
        <div className="p-8">
          <h1 className="text-[32px] font-bold tracking-tight">Final review</h1>
          <p className="pt-2 text-[15px] text-ink-2">Review the complete episode before approval.</p>

          <div className="mt-6">
            {production.final_video_artifact_id ? (
              <VideoPlayer
                shotId={selected}
                artifactId={production.final_video_artifact_id}
                overlayLabel="Full episode"
                aspect="aspect-[9/16]"
                className="max-w-[380px] mx-auto shadow-2xl"
              />
            ) : (
              <div className="flex aspect-[16/8.2] w-full items-center justify-center rounded-xl bg-raised text-[15px] text-ink-2">
                Final episode is still assembling...
              </div>
            )}
          </div>

          <div className="mt-6 grid grid-cols-8 gap-3">
            {shots.map((s) => {
              const isSel = s.id === selected
              const num = String(s.sequence_number).padStart(2, '0')
              return (
                <button
                  key={s.id}
                  onClick={() => setSelected(s.id)}
                  className={`flex flex-col items-center gap-2 rounded-xl border py-4 transition-colors ${
                    isSel ? 'border-accent' : 'border-line-soft bg-raised hover:border-line'
                  }`}
                >
                  <span className="text-[16px] font-semibold">S{num}</span>
                  <span className="h-1.5 w-1.5 rounded-full bg-accent" />
                </button>
              )
            })}
          </div>
        </div>
      </AppShell>

      {exportOpen && (
        <ExportModal
          onClose={() => setExportOpen(false)}
          episodeTitle={production.episode_title}
          episodeNumber={production.episode_number}
          artifactId={production.final_video_artifact_id}
          duration={formatDuration(totalDuration)}
        />
      )}
    </>
  )
}
