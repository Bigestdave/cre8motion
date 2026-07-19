import { useState, useEffect, useMemo } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { AppShell } from '../components/AppShell'
import { RightPanel, ScoreBar } from '../components/RightPanel'
import { ThumbShotStrip, Thumb, type StripStatuses } from '../components/ShotStrip'
import { ChevronRight, ChevronDown } from '../components/icons'
import { getProductionShots } from '../data/api'
import { useProductionEvents } from '../hooks/useProductionEvents'

export function KeyframesReviewScreen() {
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
        // Try to select an active shot, otherwise first shot
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
      if (s.status.includes('keyframe_approved') || s.status.includes('video_') || s.status === 'completed') st[s.id] = 'approved'
      else if (s.status.includes('keyframe_retry') || s.status.includes('needs_attention')) st[s.id] = 'warning'
      else if (s.status.includes('keyframe_')) st[s.id] = 'generating'
      else st[s.id] = 'pending'
    })
    return st
  }, [shots, selected])

  const selectedShot = shots.find(s => s.id === selected)
  const isApproved = selectedShot?.status.includes('keyframe_approved') || selectedShot?.status.includes('video_') || selectedShot?.status === 'completed'
  const numStr = selectedShot ? String(selectedShot.sequence_number).padStart(2, '0') : ''

  return (
    <AppShell
      active="Keyframes"
      sidebarBadges={{ Keyframes: `${shots.filter(s => s.status.includes('keyframe_approved') || s.status.includes('video_') || s.status === 'completed').length}/${shots.length}` }}
      panel={
        <RightPanel
          defaultTab="Quality"
          render={(tab) =>
            tab === 'Quality' && selectedShot ? (
              <div>
                <ScoreBar label="AI review" score={89} />
                <ScoreBar label="Character identity" score={95} />
                <ScoreBar label="Style consistency" score={92} />
                <ScoreBar label="Composition" score={87} />
                <ScoreBar label="Continuity" score={84} />

                <div className="mt-4 border-t border-line-soft pt-6">
                  <p className="flex items-center gap-2.5 text-[16px] font-semibold">
                    <span className="text-accent">✓</span>
                    Approved for animation
                  </p>
                  <p className="pt-2 text-[14.5px] text-ink-2">Identity and movement are preserved.</p>
                </div>

                <Link
                  to={`/keyframes-retry?productionId=${productionId}`}
                  className="mt-7 flex w-full items-center justify-between rounded-xl border border-line px-4 py-3.5 text-[15px] transition-colors hover:bg-selected"
                >
                  View full report
                  <ChevronRight className="text-ink-3" />
                </Link>
              </div>
            ) : null
          }
        />
      }
      strip={<ThumbShotStrip statuses={statuses} selected={selected} onSelect={setSelected} variant="plain" />}
    >
      <div className="flex h-full flex-col justify-between p-8">
        {selectedShot ? (
          <>
            <div className="flex gap-8">
              {/* Left: title */}
              <h1 className="shrink-0 pt-1 text-[26px] font-semibold tracking-tight text-ink">
                Shot {numStr} <span className="px-1 text-[20px] font-normal text-ink-3">·</span>{' '}
                <span className="text-[24px] font-normal text-ink-2">{selectedShot.story_function}</span>
              </h1>

              {/* Center: portrait keyframe */}
              <div className="flex flex-1 flex-col items-center">
                <Thumb shotId={`S${numStr}`} artifactId={selectedShot.approved_keyframe_artifact_id} className="aspect-[9/13] w-[340px] rounded-lg border border-line" />

                <div className="w-[420px] pt-5">
                  <p className="flex items-center gap-2.5 text-[15px] font-medium">
                    <span className="flex h-[15px] w-[15px] items-center justify-center rounded-full border-2 border-accent">
                      <span className="h-[5px] w-[5px] rounded-full bg-accent" />
                    </span>
                    {isApproved ? 'Keyframe approved' : 'Reviewing keyframe'}
                  </p>
                  <p className="pl-[26px] pt-1 text-[14px] text-ink-3">
                    {isApproved ? 'Identity and movement preserved successfully.' : 'Checking motion, identity, style, and continuity.'}
                  </p>

                  <button className="mt-4 flex w-full items-center gap-3 rounded-xl border border-line px-4 py-3 text-[14.5px] text-ink transition-colors hover:bg-selected">
                    <ChevronDown size={15} className="text-ink-3" />
                    3 generation steps completed
                  </button>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center h-full text-ink-2">Loading keyframe details...</div>
        )}
      </div>
    </AppShell>
  )
}

