import { useState, useEffect, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { AppShell } from '../components/AppShell'
import { RightPanel, KV } from '../components/RightPanel'
import { ThumbShotStrip, Thumb, type StripStatuses } from '../components/ShotStrip'
import { ChevronRight, CheckCircleSolid, Spinner, CircleOutline, DotSolid } from '../components/icons'
import { getProductionShots } from '../data/api'
import { useProductionEvents } from '../hooks/useProductionEvents'

type UIStatus = 'approved' | 'reviewing' | 'generating' | 'pending' | 'active' | 'warning'

function mapShotStatusToUI(status: string): UIStatus {
  if (status.includes('approved')) return 'approved'
  if (status.includes('qc') || status.includes('retry')) return 'reviewing'
  if (status.includes('generating')) return 'generating'
  return 'pending'
}

function BoardBadge({ status }: { status: UIStatus }) {
  switch (status) {
    case 'approved':
      return <span className="flex items-center gap-2 text-[13.5px] text-ink-2"><CheckCircleSolid size={15} /> Approved</span>
    case 'reviewing':
      return <span className="flex items-center gap-2 text-[13.5px] text-ink"><DotSolid size={15} /> Reviewing</span>
    case 'generating':
      return <span className="flex items-center gap-2 text-[13.5px] text-ink-2"><Spinner size={14} /> Generating</span>
    default:
      return <span className="flex items-center gap-2 text-[13.5px] text-ink-3"><CircleOutline size={15} /> Pending</span>
  }
}

export function StoryboardsScreen() {
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
        setSelected(data[0].id)
      }
    }).catch(err => console.error("Failed to load shots", err))
  }, [productionId, lastEvent])

  const boardStatus = useMemo(() => {
    const st: Record<string, UIStatus> = {}
    shots.forEach(s => {
      st[s.id] = mapShotStatusToUI(s.status)
    })
    return st
  }, [shots])

  const stripStatuses = useMemo(() => {
    const st: StripStatuses = {}
    shots.forEach(s => {
      let ui = mapShotStatusToUI(s.status)
      if (s.id === selected) ui = 'active'
      st[s.id] = ui as any
    })
    return st
  }, [shots, selected])

  const approved = Object.values(boardStatus).filter((s) => s === 'approved').length
  const selectedShot = shots.find(s => s.id === selected)

  return (
    <AppShell
      active="Storyboards"
      panel={
        <RightPanel
          render={(tab) =>
            tab === 'Details' && selectedShot ? (
              <div>
                <h2 className="pb-4 text-[18px] font-semibold">
                  Shot {String(selectedShot.sequence_number).padStart(2, '0')} <span className="px-1 text-ink-3">·</span> {selectedShot.story_function}
                </h2>
                <KV label="Characters" value={selectedShot.characters?.map((c:any) => c.name || c).join(', ') || 'None'} />
                <KV label="Background" value={selectedShot.location_id || 'Unknown location'} />
                <KV label="Props" value={selectedShot.environment?.props?.join(', ') || 'None'} />
                <KV label="Composition" value={<>{selectedShot.camera?.framing || 'Medium'} <span className="px-1 text-ink-3">·</span> {selectedShot.camera?.movement || 'Static'}</>} />
                <div className="flex items-center gap-4 py-2.5">
                  <span className="w-[120px] shrink-0 text-[14.5px] text-ink-2">Continuity</span>
                  <span className="text-[15px] font-semibold text-accent">91</span>
                  <div className="h-[5px] flex-1 overflow-hidden rounded-full bg-raised-2">
                    <div className="h-full rounded-full bg-accent" style={{ width: '91%' }} />
                  </div>
                </div>

                <h3 className="pb-2 pt-6 text-[16px] font-semibold">AI review</h3>
                <p className="text-[14.5px] leading-relaxed text-ink-2">
                  {selectedShot.status === 'storyboard_approved' 
                    ? "Matches the production plan perfectly."
                    : selectedShot.status.includes('qc') 
                    ? "Currently reviewing..."
                    : "Awaiting generation."}
                </p>

                <button className="mt-7 flex w-full items-center justify-between rounded-xl border border-line px-4 py-3.5 text-[15px] transition-colors hover:bg-raised">
                  Open storyboard
                  <ChevronRight className="text-ink-3" />
                </button>
              </div>
            ) : null
          }
        />
      }
      strip={<ThumbShotStrip statuses={stripStatuses} selected={selected} onSelect={setSelected} variant="plain" />}
    >
      <div className="p-8">
        <div className="flex items-start justify-between">
          <h1 className="text-[32px] font-bold tracking-tight">Storyboards</h1>
          <p className="pt-3 text-[15px] text-ink-2">
            <span className="font-medium text-ink">{approved} of {shots.length}</span> approved
          </p>
        </div>

        <div className="mt-7 grid grid-cols-4 gap-4">
          {shots.map((s) => {
            const st = boardStatus[s.id]
            const isSel = selected === s.id
            const numStr = String(s.sequence_number).padStart(2, '0')
            return (
              <button
                key={s.id}
                onClick={() => setSelected(s.id)}
                className={`rounded-xl border text-left transition-colors ${
                  isSel ? 'border-accent' : 'border-line-soft bg-raised hover:border-line'
                }`}
              >
                {/* Fallback to S0X for thumbnails if artifact ID is not available for demo purposes */}
                <Thumb shotId={`S${numStr}`} artifactId={s.approved_storyboard_artifact_id} className="aspect-[4/3] w-full rounded-b-none rounded-t-xl" />
                <div className="p-4">
                  <p className="text-[15px] font-semibold truncate">
                    {numStr} <span className="px-0.5 text-ink-3">·</span> {s.story_function}
                  </p>
                  <p className="pt-1 text-[13.5px] text-ink-3">{s.duration_seconds} sec</p>
                  <div className="pt-2.5"><BoardBadge status={st} /></div>
                </div>
              </button>
            )
          })}
        </div>
      </div>
    </AppShell>
  )
}

