import { useState, useEffect, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { AppShell } from '../components/AppShell'
import { RightPanel, ScoreBar } from '../components/RightPanel'
import { ThumbShotStrip, Thumb, type StripStatuses } from '../components/ShotStrip'
import { SparkleIcon, PersonIcon, SunIcon, WaveIcon, HandIcon } from '../components/icons'
import { getProductionShots, retryShot, getShotAttempts, approveAttempt, pauseProduction } from '../data/api'
import { useProductionEvents } from '../hooks/useProductionEvents'

const recommendations = [
  { icon: PersonIcon, label: 'Preserve the', sub: 'character identity' },
  { icon: SunIcon, label: 'Keep the', sub: 'approved lighting' },
  { icon: WaveIcon, label: 'Reduce', sub: 'background motion' },
  { icon: HandIcon, label: 'Simplify the', sub: 'hand movement' },
]

export function KeyframesScreen() {
  const [searchParams] = useSearchParams()
  const productionId = searchParams.get('productionId')

  const [shots, setShots] = useState<any[]>([])
  const [selected, setSelected] = useState<string>('')
  const [acting, setActing] = useState(false)

  const { lastEvent } = useProductionEvents(productionId)

  useEffect(() => {
    if (!productionId) return
    getProductionShots(productionId).then(data => {
      setShots(data)
      if (!selected && data.length > 0) {
        const activeShot = data.find((s: any) => s.status.includes('keyframe_')) || data[0]
        setSelected(activeShot.id)
      }
    }).catch(err => console.error('Failed to load shots', err))
  }, [productionId, lastEvent])

  const statuses: StripStatuses = useMemo(() => {
    const st: StripStatuses = {}
    shots.forEach(s => {
      if (s.id === selected) { st[s.id] = 'active'; return }
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

  const handleApprove = async () => {
    if (!selected || acting) return
    setActing(true)
    try {
      const attempts = await getShotAttempts(selected) as any[]
      if (attempts?.length) {
        await approveAttempt(selected, attempts[attempts.length - 1].id)
      } else {
        await retryShot(selected)
      }
      if (productionId) setShots(await getProductionShots(productionId))
    } catch (e) { console.error(e) }
    finally { setActing(false) }
  }

  const handleRetry = async () => {
    if (!selected || acting) return
    setActing(true)
    try {
      await retryShot(selected)
      if (productionId) setShots(await getProductionShots(productionId))
    } catch (e) { console.error(e) }
    finally { setActing(false) }
  }

  const handlePause = async () => {
    if (!productionId || acting) return
    setActing(true)
    try { await pauseProduction(productionId) }
    catch (e) { console.error(e) }
    finally { setActing(false) }
  }

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
                <ScoreBar label="AI review" score={isFailed ? 71 : 89} tone={isFailed ? 'warn' : undefined} />
                <ScoreBar label="Character identity" score={94} />
                <ScoreBar label="Style consistency" score={91} />
                <ScoreBar label="Composition" score={83} />
                <ScoreBar label="Action accuracy" score={isFailed ? 48 : 85} tone={isFailed ? 'danger' : undefined} />
                {isFailed && (
                  <div className="mt-8 border-t border-line-soft pt-6">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-[16px] font-semibold text-danger">Failed check</p>
                        <p className="pt-3 text-[14.5px] leading-relaxed text-ink-2">
                          Keyframe quality did not meet the required threshold.
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
      strip={<ThumbShotStrip shots={shots} statuses={statuses} selected={selected} onSelect={setSelected} variant="name-sec" />}
    >
      {selectedShot ? (
        /* Side-by-side layout: two portrait images left, details right — no scrolling */
        <div className="flex h-full gap-0 overflow-hidden">
          {/* Left: the two portrait images */}
          <div className="flex shrink-0 gap-3 p-6">
            <div className="flex flex-col gap-1.5">
              <p className="text-[12.5px] font-medium text-ink-3">Keyframe</p>
              <Thumb
                shotId={`S${numStr}`}
                artifactId={selectedShot.approved_keyframe_artifact_id}
                className="h-full max-h-[420px] w-[160px] rounded-xl"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <p className="text-[12.5px] font-medium text-ink-3">Storyboard</p>
              <Thumb
                shotId={`S${numStr}`}
                artifactId={selectedShot.approved_storyboard_artifact_id}
                className="h-full max-h-[420px] w-[160px] rounded-xl opacity-70"
              />
            </div>
          </div>

          {/* Right: title, status, actions */}
          <div className="flex min-w-0 flex-1 flex-col justify-between overflow-y-auto p-6 pl-2">
            <div>
              <h1 className="text-[26px] font-bold tracking-tight">
                {isFailed ? `Shot ${numStr} · Needs retry` : `Shot ${numStr} · Reviewing`}
              </h1>
              <p className="pt-1.5 text-[14.5px] text-ink-2">
                {selectedShot.story_function}
              </p>
              <p className="pt-4 text-[13.5px] text-ink-3">
                {isFailed
                  ? 'The AI detected quality issues with this keyframe.'
                  : 'Checking character identity and style consistency.'}
              </p>

              {isFailed && (
                <div className="mt-5 rounded-xl border border-line-soft bg-raised p-4">
                  <p className="flex items-center gap-2 pb-3 text-[14px] font-semibold">
                    <SparkleIcon size={15} />
                    Cre8Motion recommends
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    {recommendations.map(({ icon: Icon, label, sub }) => (
                      <div key={sub} className="flex items-start gap-2.5">
                        <Icon size={16} className="mt-0.5 shrink-0 text-ink-2" />
                        <p className="text-[13px] leading-snug text-ink-2">{label} {sub}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex flex-col gap-3 pt-6">
              {isFailed ? (
                <>
                  <button
                    onClick={handleRetry}
                    disabled={acting}
                    className="w-full rounded-xl bg-accent px-5 py-3 text-[14.5px] font-semibold text-accent-ink transition-colors hover:bg-accent-strong disabled:opacity-50"
                  >
                    {acting ? '…' : 'Retry this shot'}
                  </button>
                  <button
                    onClick={handleApprove}
                    disabled={acting}
                    className="w-full rounded-xl border border-line px-5 py-3 text-[14.5px] font-medium transition-colors hover:bg-raised disabled:opacity-50"
                  >
                    {acting ? '…' : 'Accept current attempt'}
                  </button>
                </>
              ) : (
                <button
                  onClick={handleApprove}
                  disabled={acting}
                  className="w-full rounded-xl bg-ink px-5 py-3 text-[14.5px] font-semibold text-app transition-colors hover:bg-ink-2 disabled:opacity-50"
                >
                  {acting ? '…' : 'Approve keyframe'}
                </button>
              )}
              <button
                onClick={handlePause}
                disabled={acting}
                className="text-center text-[13.5px] text-ink-3 transition-colors hover:text-ink disabled:opacity-50"
              >
                Pause production
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex h-full items-center justify-center text-ink-2">Loading keyframes…</div>
      )}
    </AppShell>
  )
}
