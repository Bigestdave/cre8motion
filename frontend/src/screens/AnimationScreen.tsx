import { useState, useEffect, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { AppShell } from '../components/AppShell'
import { RightPanel, ScoreBar } from '../components/RightPanel'
import { ThumbShotStrip, Thumb, type StripStatuses } from '../components/ShotStrip'
import { VideoPlayer } from '../components/VideoPlayer'
import { Checklist } from '../components/Checklist'
import { ChevronRight } from '../components/icons'
import { getProductionShots } from '../data/api'
import { useProductionEvents } from '../hooks/useProductionEvents'

export function AnimationScreen() {
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
        // Select an active shot
        const activeShot = data.find((s: any) => s.status.includes('video_')) || data[0]
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
      if (s.status.includes('video_approved') || s.status === 'completed') st[s.id] = 'approved'
      else if (s.status.includes('video_retry') || s.status.includes('needs_attention')) st[s.id] = 'warning'
      else if (s.status.includes('video_')) st[s.id] = 'generating'
      else st[s.id] = 'pending'
    })
    return st
  }, [shots, selected])

  const selectedShot = shots.find(s => s.id === selected)
  const isApproved = selectedShot?.status.includes('video_approved') || selectedShot?.status === 'completed'
  const isGenerating = selectedShot?.status.includes('generating')
  const numStr = selectedShot ? String(selectedShot.sequence_number).padStart(2, '0') : ''

  return (
    <AppShell
      active="Animation"
      panel={
        <RightPanel
          defaultTab="Quality"
          render={(tab) =>
            tab === 'Quality' && selectedShot ? (
              <div>
                <ScoreBar label="AI review" score={87} />
                <ScoreBar label="Character stability" score={94} />
                <ScoreBar label="Motion accuracy" score={85} />
                <ScoreBar label="Camera accuracy" score={91} />
                <ScoreBar label="Background consistency" score={89} />
                <ScoreBar label="Visual quality" score={88} />

                <div className="mt-6 border-t border-line-soft pt-6">
                  <p className="text-[16px] font-semibold">Status</p>
                  <p className={`flex items-center gap-2.5 pt-3 text-[14.5px] ${isApproved ? 'text-ink-2' : 'text-accent'}`}>
                    <span className={`h-2 w-2 rounded-full ${isApproved ? 'bg-ink-3' : 'bg-accent'}`} />
                    {isApproved ? 'Approved' : isGenerating ? 'Generating motion...' : 'Reviewing motion...'}
                  </p>
                </div>

                <button className="mt-7 flex w-full items-center justify-between rounded-xl border border-line px-4 py-3.5 text-[15px] transition-colors hover:bg-raised">
                  View review details
                  <ChevronRight className="text-ink-3" />
                </button>
              </div>
            ) : tab === 'Details' && selectedShot ? (
              <div>
                <p className="pb-1 text-[16px] font-semibold">Shot {numStr}</p>
                <p className="text-[13.5px] text-ink-2">{selectedShot.story_function}</p>

                <div className="mt-5 border-t border-line-soft pt-5">
                  <p className="pb-1.5 text-[13px] font-medium text-ink-3">Motion instruction</p>
                  <p className="text-[13.5px] italic leading-relaxed text-ink-2">
                    {selectedShot.motion_prompt || 'Standard generated motion'}
                  </p>
                </div>

                <div className="mt-5 border-t border-line-soft pt-5">
                  <p className="pb-3 text-[13px] font-medium text-ink-3">Approved keyframe</p>
                  <Thumb
                    shotId={`S${numStr}`}
                    artifactId={selectedShot.approved_keyframe_artifact_id}
                    className="aspect-[9/16] w-full rounded-xl"
                  />
                </div>

                <div className="mt-5 border-t border-line-soft pt-5">
                  <Checklist
                    items={[
                      { label: 'Keyframe attached', state: 'done' },
                      { label: 'Motion instruction compiled', state: 'done' },
                      { label: 'Clip generated', state: isApproved || !isGenerating ? 'done' : 'todo' },
                      { label: 'Motion quality review', state: isApproved ? 'done' : 'todo' },
                    ]}
                  />
                </div>
              </div>
            ) : null
          }
        />
      }
      strip={
        <ThumbShotStrip
          shots={shots}
          statuses={statuses}
          selected={selected}
          onSelect={setSelected}
          variant="name-sec"
          caption={(id) =>
            id === selected && isGenerating ? <p className="px-1 pt-0.5 text-[12px] text-ink-3">⟳ Attempting</p> : null
          }
        />
      }
    >
      <div className="flex h-full items-center justify-center p-6">
        {selectedShot ? (
          <VideoPlayer
            shotId={`S${numStr}`}
            artifactId={selectedShot.approved_video_artifact_id}
            overlayLabel={`Shot ${numStr} · ${selectedShot.story_function}`}
            className="h-full max-h-[calc(100vh-220px)] w-auto"
            aspect="aspect-[9/16]"
          />
        ) : (
          <div className="text-[15px] text-ink-2">Loading animation…</div>
        )}
      </div>
    </AppShell>
  )
}

