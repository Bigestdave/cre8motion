import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { AppShell } from '../components/AppShell'
import { RightPanel, KV } from '../components/RightPanel'
import { CheckCircle, CircleOutline } from '../components/icons'
import { PeopleIcon, ClockIcon, PhoneIcon, FramePlaceholder } from '../components/icons2'
import { getProduction, getProductionShots, listCharacters } from '../data/api'
import { useProductionEvents } from '../hooks/useProductionEvents'

export function BriefScreen() {
  const [searchParams] = useSearchParams()
  const productionId = searchParams.get('productionId')

  const [production, setProduction] = useState<any>(null)
  const [shots, setShots] = useState<any[]>([])
  const [characters, setCharacters] = useState<any[]>([])
  const { lastEvent } = useProductionEvents(productionId)

  useEffect(() => {
    if (!productionId) return
    getProduction(productionId)
      .then(async (prod) => {
        setProduction(prod)
        if (prod.show_id) {
          listCharacters(prod.show_id).then(setCharacters).catch(console.error)
        }
      })
      .catch(console.error)
    getProductionShots(productionId).then(setShots).catch(console.error)
  }, [productionId, lastEvent])

  const charNames = characters.map((c: any) => c.name).join(', ') || '…'
  const episodeLabel = production?.episode_number
    ? `Episode ${String(production.episode_number).padStart(2, '0')} · ${production.episode_title || ''}`
    : '…'

  const briefRows = [
    { icon: PeopleIcon, label: 'Characters', value: charNames },
    { icon: ClockIcon, label: 'Target duration', value: production?.target_duration_seconds ? `${production.target_duration_seconds} seconds` : '45 seconds' },
    { icon: PhoneIcon, label: 'Format', value: 'Vertical · 9:16' },
  ]

  return (
    <AppShell
      active="Brief"
      panel={
        <RightPanel
          render={(tab) =>
            tab === 'Details' ? (
              <div>
                <h2 className="pb-3 text-[17px] font-semibold">Production context</h2>
                <KV label="Show" value={production?.show_title || '…'} />
                <KV label="Episode" value={episodeLabel} />
                <KV label="Stage" value={production?.current_stage || '…'} />
              </div>
            ) : null
          }
        />
      }
      strip={
        <div className="grid grid-cols-8 gap-3">
          {(shots.length > 0 ? shots : Array.from({ length: 7 })).map((s: any, i) => (
            <div key={s?.id || i} className="rounded-xl border border-line-soft bg-raised p-2 pb-2.5">
              <div className="mb-2 flex aspect-[16/10] w-full items-center justify-center rounded-md border border-dashed border-line-strong">
                <FramePlaceholder />
              </div>
              <div className="flex items-center justify-between px-1">
                <span className="text-[13.5px] font-semibold">
                  {s?.sequence_number ? `S${String(s.sequence_number).padStart(2, '0')}` : `S${String(i + 1).padStart(2, '0')}`}
                </span>
                <CircleOutline size={15} />
              </div>
              <p className="px-1 pt-0.5 text-[12.5px] text-ink-3">Estimated</p>
            </div>
          ))}
        </div>
      }
    >
      <div className="p-8">
        <div className="flex items-center gap-4">
          <h1 className="text-[32px] font-bold tracking-tight">Production brief</h1>
          <span className="flex items-center gap-2 rounded-full border border-accent-border bg-accent-soft px-3.5 py-1.5 text-[13.5px] font-medium text-accent">
            <CheckCircle size={15} className="text-accent" />
            Ready
          </span>
        </div>
        <p className="pt-2 text-[15px] text-ink-2">All required episode information is ready.</p>

        <h2 className="pt-7 text-[19px] font-semibold">{episodeLabel}</h2>

        <div className="mt-6 max-w-[820px]">
          {briefRows.map(({ icon: Icon, label, value }) => (
            <div key={label} className="flex items-center gap-4 border-b border-line-soft py-3.5 last:border-b-0">
              <Icon size={17} className="shrink-0 text-ink-2" />
              <span className="w-[220px] text-[14.5px] text-ink-2">{label}</span>
              <span className="text-[14.5px]">{value}</span>
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  )
}
