import { useState, useEffect, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { AppShell } from '../components/AppShell'
import { RightPanel, KV } from '../components/RightPanel'
import { ThumbShotStrip, type StripStatuses } from '../components/ShotStrip'
import { Checklist } from '../components/Checklist'
import { MusicNote } from '../components/icons'
import { TextShimmer } from '../components/ui/shimmer-text'
import { getProduction, getProductionShots } from '../data/api'
import { useProductionEvents } from '../hooks/useProductionEvents'

export function AudioScreen() {
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
    shots.forEach(s => { st[s.id] = s.approved_video_artifact_id ? 'approved' : 'pending' })
    return st
  }, [shots])

  return (
    <AppShell
      active="Audio"
      panel={
        <RightPanel
          render={(tab) =>
            tab === 'Details' ? (
              <div>
                <h2 className="pb-4 text-[18px] font-semibold">Audio</h2>
                <KV label="Episode" value={production?.episode_title || '…'} />
                <KV label="Dialogue" value="None (silent by design)" />
                <KV label="Status" value="Passing through" />
              </div>
            ) : null
          }
        />
      }
      strip={<ThumbShotStrip shots={shots} statuses={statuses} variant="plain" />}
    >
      <div className="p-8">
        <h1 className="text-[32px] font-bold tracking-tight">Audio</h1>
        <p className="pt-2 text-[15px] text-ink-2">
          <TextShimmer className="font-medium" duration={2}>
            Silent-acting pass-through — advancing immediately to multi-clip assembly…
          </TextShimmer>
        </p>

        <div className="mt-10 flex flex-col items-center justify-center gap-5 rounded-xl border border-line-soft bg-raised py-14 text-center">
          <MusicNote size={36} className="text-ink-4" />
          <p className="text-[17px] font-semibold text-ink-2">No audio generation in this version</p>
          <p className="max-w-[380px] text-[14.5px] leading-relaxed text-ink-3">
            Cre8Motion produces completely silent shows. Audio layers such as music,
            ambience, and sound effects are not generated. The episode will proceed
            directly to assembly.
          </p>
        </div>

        <div className="mt-8 max-w-[400px]">
          <Checklist
            items={[
              { label: 'Audio stage acknowledged', state: 'done' },
              { label: 'Proceeding to assembly', state: production?.current_stage === 'ASSEMBLY' ? 'done' : 'active' },
            ]}
          />
        </div>
      </div>
    </AppShell>
  )
}
