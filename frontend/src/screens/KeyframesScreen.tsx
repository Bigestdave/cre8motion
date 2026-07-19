import { useState, useEffect, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { AppShell } from '../components/AppShell'
import { RightPanel, ScoreBar } from '../components/RightPanel'
import { ThumbShotStrip, Thumb, type StripStatuses } from '../components/ShotStrip'
import { SparkleIcon, PersonIcon, SunIcon, WaveIcon, HandIcon } from '../components/icons'
import { getProductionShots } from '../data/api'
import { useProductionEvents } from '../hooks/useProductionEvents'

const recommendations = [
  { icon: PersonIcon, label: 'Preserve the', sub: 'current character identity' },
  { icon: SunIcon, label: 'Keep the', sub: 'approved lighting' },
  { icon: WaveIcon, label: 'Reduce', sub: 'background motion' },
  { icon: HandIcon, label: 'Simplify the', sub: 'hand movement' },
]

export function KeyframesScreen() {
  const [searchParams] = useSearchParams()
  const productionId = searchParams.get('productionId')
  
  const [shots, setShots] = useState<any[]>([])
  const [selected, setSelected] = useState<string>('')
  
  const { lastEvent } = useProductionEvents(productionId)

  // Fetch shots on mount and when SSE events arrive
  useEffect(() => {
    if (!productionId) return
    getProductionShots(productionId).then(data => {
      setShots(data)
      if (!selected && data.length > 0) {
        // Try to select a shot that needs attention or is generating keyframes
        const activeShot = data.find((s: any) => s.status.includes('keyframe_')) || data[0]
        setSelected(activeShot.id)
      }
    }).catch(err => console.error("Failed to load shots", err))
  }, [productionId, lastEvent])

  const statuses: StripStatuses = useMemo(() => {
    const st: StripStatuses = {}
    shots.forEach(s => {
      if (s.id === selected) {
        st[s.id] = 'active'
        return
      }
      if (s.status.includes('keyframe_approved') || s.status.includes('video_')) st[s.id] = 'approved'
      else if (s.status.includes('keyframe_retry') || s.status.includes('needs_attention')) st[s.id] = 'warning'
      else if (s.status.includes('keyframe_')) st[s.id] = 'generating'
      else st[s.id] = 'pending'
    })
    return st
  }, [shots, selected])

  const selectedShot = shots.find(s => s.id === selected)
  const isFailed = selectedShot?.status.includes('retry') || selectedShot?.status.includes('needs_attention')
  const numStr = selectedShot ? String(selectedShot.sequence_number).padStart(2, '0') : ''

  return (
    <AppShell
      active="Keyframes"
      sidebarOverrides={{ Keyframes: isFailed ? 'warning' : 'active' }}
      panel={
        <RightPanel
          defaultTab="Quality"
          render={(tab) =>
            tab === 'Quality' && selectedShot ? (
              <div>
                <ScoreBar label="AI review" score={isFailed ? 71 : 89} tone={isFailed ? "warn" : undefined} />
                <ScoreBar label="Character identity" score={94} />
                <ScoreBar label="Style consistency" score={91} />
                <ScoreBar label="Composition" score={83} />
                <ScoreBar label="Action accuracy" score={isFailed ? 48 : 85} tone={isFailed ? "danger" : undefined} />

                {isFailed && (
                  <div className="mt-8 border-t border-line-soft pt-6">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-[16px] font-semibold text-danger">Failed check</p>
                        <p className="pt-3 text-[14.5px] leading-relaxed text-ink-2">
                          Keyframe quality did not meet the <br />required threshold.
                        </p>
                      </div>
                      <span className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-danger text-[16px] font-bold text-danger">!</span>
                    </div>
                  </div>
                )}
              </div>
            ) : null
          }
        />
      }
      strip={<ThumbShotStrip statuses={statuses} selected={selected} onSelect={setSelected} variant="name-sec" />}
    >
      <div className="p-8">
        {selectedShot ? (
          <>
            <h1 className="text-[30px] font-bold tracking-tight">
              {isFailed ? `Shot ${numStr} needs another attempt` : `Reviewing Shot ${numStr}`}
            </h1>
            <p className="pt-2 text-[15px] text-ink-2">
              {isFailed ? 'The AI detected issues with the generated keyframe.' : 'Checking character identity and style consistency.'}
            </p>

            <div className="mt-7 grid grid-cols-2 gap-6">
              <div>
                <p className="pb-3 text-[14.5px] text-ink-2">Current attempt</p>
                <Thumb shotId={selectedShot.approved_keyframe_artifact_id ? `S${numStr}` : `S${numStr}`} className="aspect-[16/10.5] w-full rounded-lg" />
              </div>
              <div>
                <p className="pb-3 text-[14.5px] text-ink-2">Approved storyboard</p>
                <Thumb shotId={`S${numStr}`} artifactId={selectedShot.approved_storyboard_artifact_id} className="aspect-[16/10.5] w-full rounded-lg opacity-70" />
              </div>
            </div>

            {isFailed && (
              <div className="mt-6 rounded-xl border border-line-soft bg-raised p-5">
                <p className="flex items-center gap-2.5 pb-4 text-[15px] font-semibold">
                  <SparkleIcon size={17} />
                  Cre8Motion recommends
                </p>
                <div className="grid grid-cols-4 gap-4">
                  {recommendations.map(({ icon: Icon, label, sub }) => (
                    <div key={sub} className="flex items-start gap-3">
                      <Icon size={20} className="mt-0.5 shrink-0 text-ink-2" />
                      <p className="text-[13.5px] leading-snug text-ink-2">
                        {label}<br />{sub}
                      </p>
                    </div>
                  ))}
                </div>
                <div className="mt-5 flex items-center border-t border-line-soft pt-4 text-[14.5px]">
                  <span className="text-ink-2">Estimated retry cost</span>
                  <span className="pl-6 text-[16px] font-semibold">7 units</span>
                  <span className="mx-6 h-5 w-px bg-line" />
                  <span className="text-ink-2">Remaining retry reserve</span>
                  <span className="pl-6 text-[16px] font-semibold">14 units</span>
                </div>
              </div>
            )}

            <div className="mt-6 flex items-center gap-4">
              {isFailed ? (
                <>
                  <button className="rounded-lg border border-line px-6 py-3 text-[15px] font-medium transition-colors hover:bg-raised">
                    Use current attempt
                  </button>
                  <button className="rounded-lg bg-accent px-7 py-3 text-[15px] font-semibold text-accent-ink transition-colors hover:bg-accent-strong">
                    Accept recommended retry
                  </button>
                </>
              ) : (
                <button className="rounded-lg bg-ink px-7 py-3 text-[15px] font-semibold text-app transition-colors hover:bg-ink-2">
                  Approve Keyframe
                </button>
              )}
              <button className="px-4 py-3 text-[15px] text-ink-2 transition-colors hover:text-ink">
                Pause production
              </button>
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center h-full pt-20 text-ink-2">Loading keyframes...</div>
        )}
      </div>
    </AppShell>
  )
}

