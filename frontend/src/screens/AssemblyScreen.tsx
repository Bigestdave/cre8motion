import { useState, useEffect, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { AppShell } from '../components/AppShell'
import { RightPanel, KV } from '../components/RightPanel'
import { ThumbShotStrip, type StripStatuses } from '../components/ShotStrip'
import { Checklist } from '../components/Checklist'
import { DocIcon } from '../components/icons'
import { TextShimmer } from '../components/ui/shimmer-text'
import { getProduction, getProductionShots } from '../data/api'
import { useProductionEvents } from '../hooks/useProductionEvents'

function formatDuration(sec: number) {
  const m = Math.floor(sec / 60)
  const s = Math.floor(sec % 60)
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
}

export function AssemblyScreen() {
  const [searchParams] = useSearchParams()
  const productionId = searchParams.get('productionId')

  const [production, setProduction] = useState<any>(null)
  const [shots, setShots] = useState<any[]>([])
  const { lastEvent } = useProductionEvents(productionId)

  useEffect(() => {
    if (!productionId) return
    getProduction(productionId).then(setProduction).catch(console.error)
    getProductionShots(productionId).then(setShots).catch(console.error)
  }, [productionId, lastEvent])

  const statuses: StripStatuses = useMemo(() => {
    const st: StripStatuses = {}
    shots.forEach(s => {
      st[s.id] = s.approved_video_artifact_id ? 'approved' : 'pending'
    })
    return st
  }, [shots])

  const approvedClips = shots.filter(s => s.approved_video_artifact_id).length
  const totalDuration = shots.reduce((sum, s) => sum + (s.duration_seconds || 0), 0)
  const isComplete = production?.current_stage === 'READY_FOR_REVIEW' || production?.current_stage === 'FINAL_QC'
  const hasFinalVideo = Boolean(production?.final_video_artifact_id)

  return (
    <AppShell
      active="Assembly"
      panel={
        <RightPanel
          render={(tab) =>
            tab === 'Details' ? (
              <div>
                <h2 className="pb-4 text-[18px] font-semibold">Output</h2>
                <KV label="Resolution" value="1080 × 1920" />
                <KV label="Frame rate" value="24 fps" />
                <KV label="Format" value={<>MP4 <span className="px-1 text-ink-3">·</span> H.264</>} />
                <KV label="Duration" value={totalDuration ? formatDuration(totalDuration) : '…'} />
                <KV label="Clips assembled" value={`${approvedClips} / ${shots.length}`} />

                <button className="mt-9 flex w-full items-center justify-between rounded-xl border border-line px-4 py-3.5 text-[15px] transition-colors hover:bg-raised">
                  <span className="flex items-center gap-3">
                    <DocIcon className="text-ink-2" />
                    View encoding details
                  </span>
                </button>
              </div>
            ) : null
          }
        />
      }
      strip={<ThumbShotStrip shots={shots} statuses={statuses} variant="name-time" />}
    >
      <div className="p-8">
        <h1 className="text-[32px] font-bold tracking-tight">Assembling final episode</h1>
        <p className="pt-2 text-[15px] text-ink-2">
          {hasFinalVideo ? (
            'Assembly complete — final episode is ready for review.'
          ) : (
            <TextShimmer className="font-medium" duration={2}>
              {`Combining ${approvedClips} approved clips into the final cut…`}
            </TextShimmer>
          )}
        </p>

        <div className="mt-7">
          <div className="flex items-end justify-between">
            <p className="text-[13px] font-semibold tracking-[0.1em] text-ink-3">VIDEO CLIPS</p>
            <p className="text-[14.5px] font-medium">{totalDuration ? formatDuration(totalDuration) : '…'} total</p>
          </div>

          {shots.length > 0 && (
            <div className="mt-3 flex overflow-hidden rounded-lg border border-line-soft">
              {shots.map((s) => {
                const num = String(s.sequence_number).padStart(2, '0')
                const approved = Boolean(s.approved_video_artifact_id)
                return (
                  <div
                    key={s.id}
                    className="relative min-w-0 border-r border-line-soft last:border-r-0"
                    style={{ flex: s.duration_seconds || 5 }}
                  >
                    <div className={`h-[104px] w-full rounded-none ${approved ? 'bg-accent/20' : 'bg-raised-2'} flex items-center justify-center`}>
                      <span className={`text-[13px] font-semibold ${approved ? 'text-accent' : 'text-ink-4'}`}>S{num}</span>
                    </div>
                    <div className="absolute bottom-0 inset-x-0 px-1.5 pb-1">
                      <p className="text-[11px] text-ink-3">{s.duration_seconds ? `${s.duration_seconds}s` : ''}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        <div className="mt-6 grid grid-cols-2 gap-8 border-t border-line-soft pt-6">
          <Checklist
            items={[
              { label: 'Video clips approved', state: approvedClips > 0 ? 'done' : 'todo' },
              { label: `${approvedClips} of ${shots.length} clips ready`, state: approvedClips === shots.length && shots.length > 0 ? 'done' : 'active' },
            ]}
          />
          <Checklist
            items={[
              { label: 'Encoding final MP4', state: hasFinalVideo ? 'done' : isComplete ? 'active' : 'todo' },
              { label: 'Ready for review', state: isComplete ? 'done' : 'todo' },
            ]}
          />
        </div>
      </div>
    </AppShell>
  )
}
