import { useState, useEffect, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { AppShell } from '../components/AppShell'
import { RightPanel, KV } from '../components/RightPanel'
import { TextShotStrip, type StripStatuses } from '../components/ShotStrip'
import { DocIcon, ChevronDown } from '../components/icons'
import { getProductionShots } from '../data/api'
import { useProductionEvents } from '../hooks/useProductionEvents'

export function PlanScreen() {
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

  const statuses: StripStatuses = useMemo(() => {
    const st: StripStatuses = {}
    shots.forEach(s => {
      if (s.id === selected) st[s.id] = 'active'
      else if (s.status !== 'planned') st[s.id] = 'approved'
      else st[s.id] = 'pending'
    })
    return st
  }, [shots, selected])

  const shot = shots.find((s) => s.id === selected)
  const totalSec = shots.reduce((a, s) => a + (s.duration_seconds || 0), 0)

  return (
    <AppShell
      active="Plan"
      panel={
        <RightPanel
          render={(tab) =>
            tab === 'Details' && shot ? (
              <div>
                <h2 className="pb-4 text-[18px] font-semibold">
                  Shot {String(shot.sequence_number).padStart(2, '0')} <span className="px-1 text-ink-3">·</span> {shot.story_function}
                </h2>
                <KV label="Duration" value={`${shot.duration_seconds} seconds`} />
                <KV label="Characters" value={shot.characters?.map((c:any) => c.name || c).join(', ') || 'None'} />
                <KV label="Location" value={shot.location_id || 'Unknown location'} />
                <KV label="Camera" value={`${shot.camera?.framing || 'Medium'} · ${shot.camera?.movement || 'Static'}`} />
                <KV label="Action" value={shot.motion_prompt || 'Standard motion'} />

                <h3 className="pb-3 pt-6 text-[16px] font-semibold">Required references</h3>
                <ul className="flex flex-col gap-2.5">
                  {(shot.characters || []).map((c:any) => c.name || c).map((r:string) => (
                    <li key={r} className="flex items-center gap-3 text-[14.5px] text-ink-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-accent" />
                      Character: {r}
                    </li>
                  ))}
                  <li className="flex items-center gap-3 text-[14.5px] text-ink-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-accent" />
                    Location: {shot.location_id || 'Main'}
                  </li>
                </ul>

                <button className="mt-7 flex w-full items-center justify-between rounded-xl border border-line px-4 py-3.5 text-[15px] transition-colors hover:bg-raised">
                  <span className="flex items-center gap-3">
                    <DocIcon className="text-ink-2" />
                    Planning rationale
                  </span>
                  <ChevronDown className="text-ink-3" />
                </button>
              </div>
            ) : null
          }
        />
      }
      strip={<TextShotStrip shots={shots} statuses={statuses} selected={selected} onSelect={setSelected} />}
    >
      <div className="p-8">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-[32px] font-bold tracking-tight">Production plan</h1>
            <p className="pt-2 text-[15px] text-ink-2">Eight shots prepared for a {totalSec}-second episode.</p>
          </div>
          <p className="pt-3 text-[15px] text-ink-2">
            <span className="font-medium text-ink">{totalSec} sec total</span>
            <span className="px-2 text-ink-3">·</span>
            {shots.length} shots
          </p>
        </div>

        <div className="mt-8">
          {shots.length > 0 ? shots.map((s) => {
            const isSel = s.id === selected
            const numStr = String(s.sequence_number).padStart(2, '0')
            return (
              <button
                key={s.id}
                onClick={() => setSelected(s.id)}
                className={`flex w-full items-center gap-2 border-b px-4 py-[18px] text-left transition-colors ${
                  isSel
                    ? 'rounded-xl border border-accent bg-raised'
                    : 'border-line-soft hover:bg-raised/50'
                }`}
              >
                <span className="w-10 text-[16px] font-semibold text-ink-2">{numStr}</span>
                <span className="pr-3 text-ink-3">·</span>
                <span className={`w-[150px] text-[16px] font-semibold truncate ${isSel ? 'text-accent' : ''}`}>{s.story_function}</span>
                <span className="flex-1 text-[15px] text-ink-2 truncate">{s.keyframe_prompt || 'Generating prompt...'}</span>
                <span className="text-[15px] text-ink-2">{s.duration_seconds} sec</span>
              </button>
            )
          }) : (
             <div className="flex items-center justify-center h-40 text-ink-2">Loading shots...</div>
          )}
        </div>
      </div>
    </AppShell>
  )
}

