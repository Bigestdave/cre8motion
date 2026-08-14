import { useState, useEffect, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { AppShell } from '../components/AppShell'
import { RightPanel, KV } from '../components/RightPanel'
import { ThumbShotStrip, type StripStatuses } from '../components/ShotStrip'
import { Checklist } from '../components/Checklist'
import { Spinner } from '../components/icons'
import { TextShimmer } from '../components/ui/shimmer-text'
import { getProduction, getProductionShots, listCharacters, listCharacterReferences, generateCharacterReference, getArtifactDownloadUrl } from '../data/api'
import { useProductionEvents } from '../hooks/useProductionEvents'

export function ReferencesScreen() {
  const [searchParams] = useSearchParams()
  const productionId = searchParams.get('productionId')

  const [production, setProduction] = useState<any>(null)
  const [shots, setShots] = useState<any[]>([])
  const [characters, setCharacters] = useState<any[]>([])
  const [refsByChar, setRefsByChar] = useState<Record<string, any[]>>({})
  const [generating, setGenerating] = useState<Record<string, boolean>>({})
  const { lastEvent } = useProductionEvents(productionId)

  // Load production → show → characters → their references
  useEffect(() => {
    if (!productionId) return
    getProduction(productionId)
      .then(async (prod) => {
        setProduction(prod)
        if (!prod.show_id) return
        const chars = await listCharacters(prod.show_id)
        setCharacters(chars)
        const map: Record<string, any[]> = {}
        await Promise.all(
          chars.map(async (c: any) => {
            try { map[c.id] = await listCharacterReferences(c.id) }
            catch { map[c.id] = [] }
          })
        )
        setRefsByChar(map)
      })
      .catch(console.error)
    getProductionShots(productionId).then(setShots).catch(console.error)
  }, [productionId, lastEvent])

  const statuses: StripStatuses = useMemo(() => {
    const st: StripStatuses = {}
    shots.forEach(s => { st[s.id] = s.approved_keyframe_artifact_id ? 'approved' : 'pending' })
    return st
  }, [shots])

  const totalRefs = Object.values(refsByChar).reduce((n, refs) => n + refs.length, 0)
  const charsReady = characters.filter(c => (refsByChar[c.id]?.length ?? 0) > 0).length

  const handleGenerate = async (characterId: string) => {
    if (generating[characterId]) return
    setGenerating(prev => ({ ...prev, [characterId]: true }))
    try {
      await generateCharacterReference(characterId)
      const refs = await listCharacterReferences(characterId)
      setRefsByChar(prev => ({ ...prev, [characterId]: refs }))
    } catch (e) { console.error(e) }
    finally { setGenerating(prev => ({ ...prev, [characterId]: false })) }
  }

  return (
    <AppShell
      active="References"
      panel={
        <RightPanel
          render={(tab) =>
            tab === 'Details' ? (
              <div>
                <h2 className="pb-4 text-[18px] font-semibold">Reference status</h2>
                <KV label="Characters" value={`${charsReady} / ${characters.length} ready`} />
                <KV label="Total references" value={String(totalRefs)} />
                <KV label="Show" value={production?.show_title || '…'} />
              </div>
            ) : null
          }
        />
      }
      strip={<ThumbShotStrip shots={shots} statuses={statuses} variant="plain" />}
    >
      <div className="p-8">
        <h1 className="text-[32px] font-bold tracking-tight">Preparing references</h1>
        <p className="pt-2 text-[15px] text-ink-2">
          {characters.length === 0 ? (
            <TextShimmer className="text-[15px] font-medium" duration={2}>
              Resolving character model sheets and show references…
            </TextShimmer>
          ) : (
            `${charsReady} of ${characters.length} characters ready`
          )}
        </p>
        {characters.length > 0 && (
          <div className="mt-4 h-[6px] w-full overflow-hidden rounded-full bg-raised-2">
            <div
              className="h-full rounded-full bg-accent transition-all"
              style={{ width: `${characters.length ? (charsReady / characters.length) * 100 : 0}%` }}
            />
          </div>
        )}

        <div className="mt-8 grid grid-cols-[1fr_300px] gap-8">
          <div>
            <p className="pb-3 text-[12px] font-semibold tracking-[0.12em] text-ink-3">CHARACTERS</p>
            <div className="flex flex-col gap-3">
              {characters.length === 0 && (
                <p className="text-[14.5px] text-ink-3">No characters found for this show.</p>
              )}
              {characters.map((char) => {
                const refs = refsByChar[char.id] ?? []
                const isGen = generating[char.id]
                const firstRef = refs[0]
                const refUrl = firstRef ? getArtifactDownloadUrl(firstRef.artifact_id) : undefined
                return (
                  <div
                    key={char.id}
                    className="flex w-full items-center gap-4 rounded-xl border border-line-soft bg-raised p-3"
                  >
                    {refUrl ? (
                      <img src={refUrl} alt={char.name} className="aspect-[9/16] w-[72px] shrink-0 rounded-md object-cover" />
                    ) : (
                      <div className="aspect-[9/16] w-[72px] shrink-0 rounded-md bg-raised-2 flex items-center justify-center text-ink-4 text-[12px]">
                        No ref
                      </div>
                    )}
                    <div className="flex-1">
                      <p className="text-[16px] font-semibold">{char.name}</p>
                      <p className="pt-1 text-[14px] text-ink-2">
                        {refs.length > 0
                          ? <span className="text-accent">{refs.length} reference{refs.length !== 1 ? 's' : ''} · Ready</span>
                          : 'No references yet'}
                      </p>
                    </div>
                    {isGen ? (
                      <Spinner size={18} />
                    ) : refs.length === 0 ? (
                      <button
                        onClick={() => handleGenerate(char.id)}
                        className="rounded-lg border border-line px-3 py-1.5 text-[13.5px] transition-colors hover:bg-raised-2"
                      >
                        Generate
                      </button>
                    ) : null}
                  </div>
                )
              })}
            </div>
          </div>

          <div className="pt-8">
            <Checklist
              items={[
                { label: 'Show characters identified', state: characters.length > 0 ? 'done' : 'active' },
                { label: 'Character references loaded', state: charsReady > 0 ? 'done' : 'todo' },
                { label: 'All references ready', state: charsReady === characters.length && characters.length > 0 ? 'done' : 'todo' },
              ]}
            />
          </div>
        </div>
      </div>
    </AppShell>
  )
}
